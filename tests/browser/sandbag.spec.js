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
  await expect(page.locator("#reaction-caption")).toContainText("신사");
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
