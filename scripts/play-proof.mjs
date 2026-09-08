import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
const baseURL = "http://127.0.0.1:4185";
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4185", "--strictPort"], { stdio: "ignore" });
const temporary = await mkdtemp(`${tmpdir()}/friend-proof-`);
const proof = { recordedAt: new Date().toISOString(), viewport: { width: 1024, height: 900 },
  note: "Actual browser inputs and captures. Playwright WebM is silent; sound is enabled during play. No participant photos.", steps: [], errors: [] };
let browser;
try {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(baseURL)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await mkdir("docs/artifacts", { recursive: true });
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: proof.viewport, recordVideo: { dir: temporary, size: proof.viewport } });
  const page = await context.newPage(); page.on("pageerror", e => proof.errors.push(e.message));
  const started = Date.now();
  const mark = async label => proof.steps.push({ label, seconds: +((Date.now() - started) / 1000).toFixed(2), diagnostics: await page.evaluate(() => window.__toyDebug()) });
  await page.goto(baseURL); await page.locator("#sound").click(); await page.waitForTimeout(700);
  await mark("Ready; default Sandbag with sound enabled");
  for (let i = 1; i <= 32; i++) {
    await page.locator("#punch").click();
    if (i === 4) { await page.screenshot({ path: "docs/artifacts/desktop-dense-impact.png" }); await mark("Fourth-hit heavy squash and glove"); }
    if (i === 8 || i === 20) await mark(i === 8 ? "One tissue sneeze" : "One escaping spirit");
    await page.waitForTimeout(160);
  }
  await page.locator("#result").waitFor({ state: "visible" }); await mark("32-hit KO with stacked cartoon overlays");
  await page.waitForTimeout(800); await page.locator("#retry").click();
  for (const mode of ["finisher", "punchout", "lottery"]) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await page.waitForFunction(() => !window.__toyDebug().loading);
    if (mode === "finisher") {
      await page.waitForFunction(() => {
        const m = window.__toyDebug().mode;
        if (m.phase === "aim" && Math.abs(m.position - .5) < .09) document.querySelector("#punch").click();
        return window.__toyDebug().mode.phase === "reward";
      });
    } else if (mode === "punchout") {
      await page.waitForFunction(() => window.__toyDebug().mode.phase === "tell");
      await page.locator("#punch").click();
    } else {
      await page.locator("#punch").click();
      await page.waitForFunction(() => window.__toyDebug().mode.phase === "reward");
    }
    await mark(`${mode}: playable reward`); await page.waitForTimeout(1000);
  }
  await page.locator('[data-mode="sandbag"]').click(); await page.locator("#punch").click();
  await mark("Return to Sandbag; one scheduled loop"); await page.waitForTimeout(700);
  const video = page.video(); await context.close();
  await video.saveAs("docs/artifacts/party-play.webm");
  assert.deepEqual(proof.errors, []);
  assert.ok(proof.steps.every(step => step.diagnostics.scheduledLoops === 1));
  await writeFile("docs/artifacts/play-proof.json", JSON.stringify(proof, null, 2) + "\n");
  console.log(`Recorded ${proof.steps.length} verified steps to docs/artifacts/party-play.webm`);
} finally {
  await browser?.close(); server.kill("SIGTERM"); await rm(temporary, { recursive: true, force: true });
}
