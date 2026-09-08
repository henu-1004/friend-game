import { test, expect } from "@playwright/test";

async function hit(page, count, delay = 95) {
  for (let i = 0; i < count; i++) {
    await page.locator("#punch").click();
    await page.waitForTimeout(delay);
  }
}
async function localPhoto(page) {
  const base64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 400;
    const x = c.getContext("2d");
    x.fillStyle = "#7852a9";
    x.fillRect(0, 0, 600, 400);
    x.fillStyle = "#ffe0ac";
    x.beginPath();
    x.ellipse(300, 200, 130, 170, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#292824";
    x.fillRect(240, 145, 25, 30);
    x.fillRect(335, 145, 25, 30);
    x.fillRect(280, 250, 40, 15);
    return c.toDataURL().split(",")[1];
  });
  await page.locator("#photo").setInputFiles({
    name: "test-face.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
  await expect(page.locator("#crop-dialog")).toBeVisible();
}

test("immediate play, scoped hit target, combo expiry and sticker selection", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "360");
  await expect(page.locator("#fps")).toContainText("FPS");
  await page.screenshot({
    path: `docs/artifacts/${info.project.name}-ready.png`,
    fullPage: true,
  });
  const box = await page.locator("#bag").boundingBox();
  await page.mouse.click(box.x + 10, box.y + 20);
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "360");
  if (info.project.name === "mobile")
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "352");
  await page.waitForTimeout(95);
  await hit(page, 9);
  await expect(page.locator('[data-reaction="3"]')).toBeEnabled();
  await page.locator('[data-reaction="3"]').click();
  await expect(page.locator("#reaction-caption")).toContainText("치과");
  await page.screenshot({
    path: `docs/artifacts/${info.project.name}-combo.png`,
    fullPage: true,
  });
  await page.waitForTimeout(950);
  await expect(page.locator("#combo")).toHaveText("0 콤보");
  await expect(page.locator('[data-reaction="3"]')).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("local photo crop, cancel, re-edit and remove; no upload requests", async ({
  page,
}) => {
  const outbound = [];
  page.on("request", (r) => {
    if (
      ["POST", "PUT"].includes(r.method()) ||
      (/^https?:/.test(r.url()) &&
        new URL(r.url()).origin !== "http://127.0.0.1:4173")
    )
      outbound.push(r.url());
  });
  await page.goto("/");
  await localPhoto(page);
  await page.locator("#zoom").fill("2");
  await page.locator("#zoom").dispatchEvent("input");
  await page.locator("#crop-x").fill("60");
  await page.locator("#crop-x").dispatchEvent("input");
  const crop = await page.locator("#crop").boundingBox();
  await page.mouse.move(crop.x + 100, crop.y + 100);
  await page.mouse.down();
  await page.mouse.move(crop.x + 130, crop.y + 120);
  await page.mouse.up();
  await page.locator("#save-crop").click();
  await expect(page.locator("#avatar img")).toBeVisible();
  const original = await page.locator("#avatar img").getAttribute("src");
  await page.locator("#recrop").click();
  await page.locator("#cancel-crop").click();
  await expect(page.locator("#avatar img")).toHaveAttribute("src", original);
  await localPhoto(page);
  await page.keyboard.press("Escape");
  await expect(page.locator("#avatar img")).toHaveAttribute("src", original);
  await page.locator("#remove-photo").click();
  await expect(page.locator("#avatar img")).toHaveCount(0);
  expect(outbound).toEqual([]);
});

test("invalid and oversized photos recover without breaking play", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#photo").setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a png"),
  });
  await expect(page.locator("#photo-status")).toContainText("열 수 없어요");
  await page.locator("#photo").setInputFiles({
    name: "big.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(12 * 1024 * 1024 + 1),
  });
  await expect(page.locator("#photo-status")).toContainText("12MB");
  await expect(page.locator("#upload")).toBeEnabled();
  await hit(page, 1);
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "352");
});

test("KO result, image export and immediate retry retain the chosen face", async ({
  page,
}, info) => {
  await page.goto("/");
  await localPhoto(page);
  await page.locator("#save-crop").click();
  await hit(page, 32);
  await expect(page.locator("#result")).toBeVisible();
  await expect(page.locator("#result-hits")).toHaveText("32");
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator("#punch")).toBeDisabled();
  await page.screenshot({
    path: `docs/artifacts/${info.project.name}-ko.png`,
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#save-card").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("friend-sandbag-ko.png");
  await download.saveAs(`docs/artifacts/${info.project.name}-ko-card.png`);
  await page.locator("#retry").click();
  await expect(page.locator("#result")).not.toBeVisible();
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "360");
  await expect(page.locator("#combo")).toHaveText("0 콤보");
  await expect(page.locator("#round-number")).toHaveText("02");
  await expect(page.locator("#avatar img")).toBeVisible();
  await expect(page.locator("#kos")).toHaveText("1");
  await expect(page.locator('[data-reaction="3"]')).toBeDisabled();
  await hit(page, 1);
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "352");
  await page.reload();
  await expect(page.locator("#avatar img")).toHaveCount(0);
  await expect(page.locator("#best")).toHaveText("32");
});

test("keyboard, reduced motion and blocked storage remain playable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => {
      throw new Error("storage blocked");
    };
  });
  await page.goto("/");
  await expect(page.locator("#motion")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#target").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "352");
  await page.waitForTimeout(95);
  await page.keyboard.press("Enter");
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "344");
  await page.waitForTimeout(95);
  await hit(page, 30);
  await expect(page.locator("#result")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "360");
});

test("Classic remains independently playable and links back to sandbag", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Classic" }).click();
  await expect(page).toHaveURL(/classic.html/);
  await expect(page.locator("#roster .fighter")).toHaveCount(4);
  await page.locator("#start").click();
  await expect(page.locator("#status")).toContainText("뒷마당");
  await expect(page.locator('[data-action="wind"]')).toBeEnabled();
  await page.locator('[data-action="wind"]').click();
  await expect(page.locator("#events")).toContainText("관전자 개입");
  await page.getByRole("link", { name: "샌드백" }).click();
  await expect(page.locator("#punch")).toBeEnabled();
  expect(errors).toEqual([]);
});

test("small and landscape screens fit; default entry never loads the Classic simulation", async ({
  page,
}) => {
  const loaded = [];
  page.on("request", (r) => loaded.push(r.url()));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  expect(loaded.some((url) => /assets\/classic-/.test(url))).toBe(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await localPhoto(page);
  await expect(page.locator("#save-crop")).toBeVisible();
  await page.locator("#save-crop").click();
  await page.setViewportSize({ width: 740, height: 360 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await hit(page, 1);
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "352");
});

test("cached face and bounded effects survive dense hits; idle does not repaint", async ({ page }, info) => {
  await page.goto("/");
  await localPhoto(page); await page.locator("#save-crop").click();
  await page.locator("#sound").click();
  const builds = await page.evaluate(() => window.__toyDebug().renderer.cacheBuilds);
  const first = await page.evaluate(() => {
    document.querySelector("#punch").click();
    return window.__toyDebug();
  });
  expect(first.freezeMs).toBeGreaterThan(0);
  expect(first.audioVoices).toBeGreaterThan(0);
  await page.waitForTimeout(90);
  await hit(page, 7, 80);
  await page.screenshot({ path: `docs/artifacts/${info.project.name}-sneeze.png`, fullPage: true });
  await hit(page, 12, 80);
  await page.screenshot({ path: `docs/artifacts/${info.project.name}-spirit.png`, fullPage: true });
  await hit(page, 3, 80);
  await expect(page.locator('[data-reaction="6"]')).toBeEnabled();
  for (const i of [1, 2, 3, 4, 5, 6]) {
    await page.locator(`[data-reaction="${i}"]`).click();
    await expect(page.locator(`[data-reaction="${i}"]`)).toHaveAttribute("aria-pressed", "true");
  }
  await page.waitForTimeout(1600);
  const settled = await page.evaluate(() => window.__toyDebug());
  expect(settled.renderer.cacheBuilds).toBe(builds);
  expect(settled.renderer.maxParticles).toBeLessThanOrEqual(32);
  expect(settled.audioVoices).toBe(0);
  expect(settled.particles).toBe(0);
  await page.waitForTimeout(250);
  expect((await page.evaluate(() => window.__toyDebug())).renderer.draws).toBe(settled.renderer.draws);
});

test("hub lazily loads playable modes, retains photo/round, and runs only the selected mode", async ({ page }, info) => {
  const loaded = [], errors = [];
  page.on("request", request => loaded.push(request.url()));
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  expect(loaded.some(url => /assets\/(finisher|punchout|lottery|classic)-/.test(url))).toBe(false);
  await localPhoto(page); await page.locator("#save-crop").click();
  await hit(page, 1);
  for (const mode of ["finisher", "punchout", "lottery"]) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await expect(page.locator(`[data-mode="${mode}"]`)).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => window.__toyDebug().loading)).toBe(false);
    expect(loaded.some(url => url.includes(`/assets/${mode}-`))).toBe(true);
    const before = await page.evaluate(() => window.__toyDebug());
    if (mode === "finisher") {
      await page.waitForFunction(() => {
        const d = window.__toyDebug();
        if (d.mode.phase === "aim" && Math.abs(d.mode.position - .5) < .1) document.querySelector("#punch").click();
        return window.__toyDebug().mode.phase === "reward";
      });
      await expect(page.locator("#bag-status")).toContainText("999");
    } else if (mode === "punchout") {
      await expect(page.locator("#bag-status")).toHaveText("지금 피해!");
      await page.locator("#punch").click();
      await expect(page.locator("#bag-status")).toContainText("반격 성공");
    } else {
      await page.locator("#target").focus(); await page.keyboard.press("Space");
      await expect(page.locator("#bag-status")).toContainText("점");
    }
    await page.screenshot({ path: `docs/artifacts/${info.project.name}-${mode}.png`, fullPage: true });
    const after = await page.evaluate(() => window.__toyDebug());
    expect(after.scheduledLoops).toBe(1);
    expect(after.loopCounts[mode]).toBeGreaterThan(before.loopCounts[mode]);
    for (const other of ["sandbag", "finisher", "punchout", "lottery"].filter(m => m !== mode))
      expect(after.loopCounts[other]).toBe(before.loopCounts[other]);
    expect(await page.locator("#avatar img").count()).toBe(1);
    if (mode !== "lottery") { await page.locator("#punch").click(); expect((await page.evaluate(() => window.__toyDebug())).mode.phase).not.toBe("reward"); }
  }
  await page.locator('[data-mode="sandbag"]').click();
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "352");
  await hit(page, 1);
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "344");
  expect(loaded.some(url => /assets\/classic-/.test(url))).toBe(false);
  expect(errors).toEqual([]);
});

test("late mode imports, pending KO, and hidden pages cannot leave extra loops", async ({ page }) => {
  await page.goto("/");
  await page.route(/assets\/finisher-.*\.js/, async route => {
    await new Promise(resolve => setTimeout(resolve, 350)); await route.continue();
  });
  await page.locator('[data-mode="finisher"]').click();
  await page.locator('[data-mode="lottery"]').click();
  await page.waitForTimeout(600);
  expect((await page.evaluate(() => window.__toyDebug())).activeMode).toBe("lottery");
  await page.locator('[data-mode="sandbag"]').click();
  await hit(page, 32, 80);
  await page.locator('[data-mode="punchout"]').click();
  await page.waitForTimeout(950);
  await expect(page.locator("#result")).not.toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await page.evaluate(() => window.__toyDebug());
  expect(hidden.scheduledLoops).toBe(0);
  await page.waitForTimeout(150);
  expect((await page.evaluate(() => window.__toyDebug())).loopCounts).toEqual(hidden.loopCounts);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.locator('[data-mode="sandbag"]').click();
  await expect(page.locator("#result")).toBeVisible();
  await page.locator("#retry").click();
  expect((await page.evaluate(() => window.__toyDebug())).scheduledLoops).toBe(1);
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "360");
});

test("slow observed cadence cuts pixels and particles while keeping input and one loop", async ({ page }) => {
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame;
    // Simulate a 30 Hz cadence without slowing the test runner or changing input.
    window.requestAnimationFrame = cb => raf(time => cb(time * 2));
  });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => window.__toyDebug().renderer.quality)).toBe("lite");
  const before = await page.evaluate(() => window.__toyDebug());
  await page.locator("#punch").click();
  await expect(page.locator("#hp")).toHaveAttribute("aria-valuenow", "352");
  const after = await page.evaluate(() => window.__toyDebug());
  expect(after.scheduledLoops).toBe(1);
  expect(after.renderer.dpr).toBe(1);
  expect(after.renderer.cacheBuilds).toBe(before.renderer.cacheBuilds);
  expect(after.renderer.maxParticles).toBeLessThanOrEqual(16);
});
