import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_HP,
  COMBO_MS,
  MIN_PUNCH_MS,
  newRound,
  punch,
  expireCombo,
  roundSeconds,
  cropPosition,
} from "../src/sandbag.js";

test("one physical punch changes HP once; input flooding is bounded", () => {
  const s = newRound();
  assert.equal(punch(s, 0).damage, 8);
  for (let t = 1; t < MIN_PUNCH_MS; t++) assert.equal(punch(s, t), null);
  assert.equal(s.hits, 1);
  assert.equal(s.hp, MAX_HP - 8);
  assert.ok(punch(s, MIN_PUNCH_MS));
});
test("combo survives the exact deadline, expires beyond it, and restarts at one", () => {
  const s = newRound();
  punch(s, 0);
  punch(s, COMBO_MS);
  assert.equal(s.combo, 2);
  assert.equal(expireCombo(s, 2 * COMBO_MS), false);
  assert.equal(expireCombo(s, 2 * COMBO_MS + 1), true);
  assert.equal(s.combo, 0);
  punch(s, 3 * COMBO_MS);
  assert.equal(s.combo, 1);
  assert.equal(s.bestCombo, 2);
});
test("three reaction milestones unlock and remain available after a combo break", () => {
  const s = newRound();
  for (let i = 1; i <= 10; i++) {
    punch(s, i * 100);
    assert.equal(s.reaction, i >= 10 ? 3 : i >= 6 ? 2 : i >= 3 ? 1 : 0);
  }
  punch(s, 3000);
  assert.equal(s.reaction, 0);
  assert.equal(s.unlocked, 3);
});
test("KO clamps HP, stops extra punches, and retry starts without prior run state", () => {
  const s = newRound();
  let time = 0,
    hit;
  while (s.hp) {
    hit = punch(s, time);
    time += 100;
  }
  assert.equal(hit.ko, true);
  assert.equal(s.hp, 0);
  assert.equal(s.hits, 32);
  const snapshot = structuredClone(s);
  assert.equal(punch(s, time + 2000), null);
  assert.deepEqual(s, snapshot);
  assert.equal(roundSeconds(s), 3.1);
  const retry = newRound();
  assert.equal(retry.hp, MAX_HP);
  assert.equal(retry.unlocked, 0);
  assert.equal(retry.started, null);
});
test("crop stays covered for portrait, landscape, extreme drags, and zoom", () => {
  for (const [w, h] of [
    [1600, 900],
    [900, 1600],
    [100, 100],
    [1, 1600],
  ])
    for (const zoom of [1, 2, 4])
      for (const offset of [-9999, 0, 9999]) {
        const r = cropPosition(w, h, zoom, offset, -offset);
        assert.ok(r.x <= 0 && r.y <= 0);
        assert.ok(r.x + r.w >= 319.999 && r.y + r.h >= 319.999);
      }
});
