import { chromium, devices } from "@playwright/test";
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
const baseURL = "http://127.0.0.1:4183";
const soakMs = Number(
  process.argv.find((a) => a.startsWith("--soak="))?.split("=")[1] || 180000,
);
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4183",
    "--strictPort",
  ],
  { stdio: "ignore" },
);
let browser;
const results = {
  measuredAt: new Date().toISOString(),
  environment:
    "Headless Chromium on shared Linux runner; emulation is not physical phone validation",
  profiles: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(baseURL)).ok) break;
    } catch {}
    await sleep(100);
  }
  browser = await chromium.launch();
  results.browser = browser.version();
  for (const profile of [
    { name: "desktop-sandbag", viewport: { width: 1440, height: 1000 } },
    { name: "mobile-sandbag", ...devices["Pixel 7"] },
    { name: "mobile-4x-cpu-sandbag", ...devices["Pixel 7"], cpu: 4 },
    {
      name: "classic-first-stage",
      viewport: { width: 1440, height: 1000 },
      classic: true,
    },
    { name: "mobile-3-minute-soak", ...devices["Pixel 7"], soak: true },
  ]) {
    const { name, cpu, classic, soak, defaultBrowserType, ...options } =
      profile;
    const context = await browser.newContext(options);
    await context.addInitScript(() => {
      const original = requestAnimationFrame;
      window.__frames = { intervals: [], costs: [], last: 0, measuring: false };
      window.requestAnimationFrame = (callback) =>
        original((time) => {
          const f = window.__frames,
            start = performance.now();
          callback(time);
          if (f.measuring) {
            f.costs.push(performance.now() - start);
            if (f.last) f.intervals.push(time - f.last);
            f.last = time;
          }
        });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    if (cpu)
      await (
        await context.newCDPSession(page)
      ).send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await page.goto(baseURL + (classic ? "/classic.html" : "/"));
    if (classic) await page.locator("#start").click();
    else {
      // Exercise the actual local-photo path before measuring uploaded-face rendering.
      const b64 = await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 320;
        const x = c.getContext("2d");
        x.fillStyle = "#d9ad82";
        x.fillRect(0, 0, 320, 320);
        x.fillStyle = "#302b27";
        x.fillRect(90, 100, 24, 35);
        x.fillRect(206, 100, 24, 35);
        x.fillRect(130, 220, 60, 15);
        return c.toDataURL().split(",")[1];
      });
      await page
        .locator("#photo")
        .setInputFiles({
          name: "benchmark-face.png",
          mimeType: "image/png",
          buffer: Buffer.from(b64, "base64"),
        });
      await page.locator("#save-crop").click();
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    await page.waitForTimeout(1200);
    const duration = soak ? soakMs : 8000;
    await page.evaluate((classic) => {
      window.__frames.measuring = true;
      if (!classic)
        window.__punchInterval = setInterval(() => {
          if (document.querySelector("#result").open)
            document.querySelector("#retry").click();
          else document.querySelector("#punch").click();
        }, 120);
    }, classic);
    console.log(`${name}: measuring ${duration / 1000}s`);
    for (let elapsed = 0; elapsed < duration; elapsed += 30000) {
      await page.waitForTimeout(Math.min(30000, duration - elapsed));
      if (soak)
        console.log(
          `${name}: ${Math.min(duration, elapsed + 30000) / 1000}s complete`,
        );
    }
    const metrics = await page.evaluate(() => {
      clearInterval(window.__punchInterval);
      const f = window.__frames;
      f.measuring = false;
      const percentile = (values, p) => {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.floor((sorted.length - 1) * p)] || 0;
      };
      const avg = f.intervals.reduce((a, b) => a + b, 0) / f.intervals.length;
      return {
        frames: f.intervals.length,
        averageFps: +(1000 / avg).toFixed(2),
        frameP95Ms: +percentile(f.intervals, 0.95).toFixed(2),
        frameP99Ms: +percentile(f.intervals, 0.99).toFixed(2),
        callbackP95Ms: +percentile(f.costs, 0.95).toFixed(2),
        framesOver25Ms: f.intervals.filter((t) => t > 25).length,
        kos: Number(document.querySelector("#kos")?.textContent || 0),
        canvasPixels:
          document.querySelector("canvas").width *
          document.querySelector("canvas").height,
        domNodes: document.querySelectorAll("*").length,
      };
    });
    results.profiles.push({ name, durationMs: duration, ...metrics, errors });
    console.log(JSON.stringify(results.profiles.at(-1)));
    if (classic)
      await page.screenshot({
        path: "docs/artifacts/classic-play.png",
        fullPage: true,
      });
    await context.close();
  }
  await mkdir("docs/artifacts", { recursive: true });
  await writeFile(
    "docs/artifacts/performance.json",
    JSON.stringify(results, null, 2) + "\n",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
