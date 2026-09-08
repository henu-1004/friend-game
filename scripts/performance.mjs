import { chromium, devices } from "@playwright/test";
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
const baseURL = "http://127.0.0.1:4183";
const onlyProfile = process.argv.find(a => a.startsWith("--profile="))?.split("=")[1];
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
  budgets: { minimumFps: 57, frameP95Ms: 20, callbackP95Ms: 16.67, maxParticles: 32, maxLoops: 1, canvasPixels: 1000000, maxAudioVoices: 6 },
  profiles: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  await mkdir("docs/artifacts", { recursive: true });
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
    { name: "mobile-finisher", ...devices["Pixel 7"], mode: "finisher" },
    { name: "mobile-punchout", ...devices["Pixel 7"], mode: "punchout" },
    { name: "mobile-lottery", ...devices["Pixel 7"], mode: "lottery" },
    { name: "mobile-3-minute-soak", ...devices["Pixel 7"], soak: true },
  ].filter(profile => !onlyProfile || profile.name === onlyProfile)) {
    const { name, cpu, classic, soak, mode, defaultBrowserType, ...options } =
      profile;
    const context = await browser.newContext(options);
    await context.addInitScript(() => {
      const original = requestAnimationFrame, cancel = cancelAnimationFrame, pending = new Set();
      window.__frames = { intervals: [], costs: [], last: 0, measuring: false, maxPending: 0, maxVoices: 0 };
      window.requestAnimationFrame = callback => {
        const id = original(time => {
          pending.delete(id);
          const f = window.__frames, start = performance.now();
          callback(time);
          if (f.measuring) {
            f.costs.push(performance.now() - start);
            if (f.last) f.intervals.push(time - f.last);
            f.last = time;
          }
        });
        pending.add(id);
        // Count only the workload. Playwright's load waiter uses its own rAF.
        if (window.__frames.measuring)
          window.__frames.maxPending = Math.max(window.__frames.maxPending, pending.size);
        return id;
      };
      window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
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
    const idleStart = await page.evaluate(() => window.__toyDebug?.().renderer.draws ?? null);
    await page.waitForTimeout(300);
    const baseline = await page.evaluate(() => window.__toyDebug?.() ?? null);
    const idleDraws = baseline ? baseline.renderer.draws - idleStart : null;
    if (!classic) {
      await page.locator("#sound").click();
      if (mode) {
        await page.locator(`[data-mode="${mode}"]`).click();
        await page.waitForFunction(() => !window.__toyDebug().loading);
      }
    }
    const duration = soak ? soakMs : 8000;
    await page.evaluate(({ classic, mode }) => {
      window.__frames.measuring = true;
      if (!classic) window.__punchInterval = setInterval(() => {
        const d = window.__toyDebug(), button = document.querySelector("#punch");
        window.__frames.maxVoices = Math.max(window.__frames.maxVoices, d.audioVoices);
        if (mode) {
          const m = d.mode;
          if (m.phase === "reward" || m.phase === "ready" || m.phase === "tell" ||
            (m.phase === "aim" && Math.abs(m.position - .5) < .13)) button.click();
        } else if (document.querySelector("#result").open) document.querySelector("#retry").click();
        else button.click();
        window.__frames.maxVoices = Math.max(window.__frames.maxVoices, window.__toyDebug().audioVoices);
      }, 100);
    }, { classic, mode });
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
        maxScheduledLoops: f.maxPending,
        maxAudioVoices: f.maxVoices,
        diagnostics: window.__toyDebug?.() ?? null,
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
    const failures = [];
    if (metrics.averageFps < results.budgets.minimumFps || !Number.isFinite(metrics.averageFps)) failures.push("FPS below 57");
    if (metrics.frameP95Ms > results.budgets.frameP95Ms) failures.push("frame cadence over budget");
    if (metrics.callbackP95Ms > results.budgets.callbackP95Ms) failures.push("callback cost over budget");
    if (errors.length) failures.push("browser errors");
    if (!classic) {
      if (idleDraws !== 0) failures.push("idle canvas repainted");
      if (metrics.maxScheduledLoops > 1) failures.push("multiple animation loops");
      if (metrics.maxAudioVoices > 6) failures.push("audio voice cap exceeded");
      if (metrics.canvasPixels > 1000000) failures.push("canvas pixel cap exceeded");
      if (metrics.diagnostics.renderer.maxParticles > 32) failures.push("particle cap exceeded");
      if (metrics.diagnostics.renderer.cacheBuilds !== baseline.renderer.cacheBuilds) failures.push("face cache rebuilt during play");
      if (mode && !(metrics.diagnostics.mode.wins || metrics.diagnostics.mode.draws)) failures.push("mode never rewarded input");
    }
    results.profiles.push({ name, durationMs: duration, idleDraws, cacheBuildsDuringPlay: baseline ? metrics.diagnostics.renderer.cacheBuilds - baseline.renderer.cacheBuilds : null,
      ...metrics, errors, failures, passed: failures.length === 0 });
    console.log(JSON.stringify(results.profiles.at(-1)));
    if (classic)
      await page.screenshot({
        path: "docs/artifacts/classic-play.png",
        fullPage: true,
      });
    await context.close();
  }
  await mkdir("docs/artifacts", { recursive: true });
  results.passed = results.profiles.length > 0 && results.profiles.every(p => p.passed);
  await writeFile(
    "docs/artifacts/performance.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  if (!results.passed) process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
