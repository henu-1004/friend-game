import test from "node:test";
import assert from "node:assert/strict";
import { createMode as finisher, finisherReward } from "../src/modes/finisher.js";
import { createMode as punchout } from "../src/modes/punchout.js";
import { createMode as lottery, drawWeapon } from "../src/modes/lottery.js";
function host() {
  return { rewards: [], messages: [], show(value) { this.messages.push(value); },
    impact(value) { this.rewards.push(value); }, reset() {}, meter() {}, pose() {} };
}
test("finisher scores timing and can retry; one input produces one reward", () => {
  assert.equal(finisherReward(.5).perfect, true);
  assert.equal(finisherReward(.1).perfect, false);
  const h = host(), mode = finisher(h);
  mode.frame(Math.PI / 2 / 3.6); mode.action();
  assert.equal(mode.snapshot().wins, 1);
  assert.equal(h.rewards.length, 1);
  mode.frame(2); assert.equal(h.rewards.length, 1);
  mode.action(); assert.equal(mode.snapshot().phase, "aim");
  mode.action(); assert.equal(h.rewards.length, 2);
});
test("punchout rewards a tell-window dodge, handles early/late input, and resets on hide", () => {
  const h = host(), mode = punchout(h);
  mode.action(); assert.equal(mode.snapshot().wins, 0);
  mode.action(); mode.frame(1.15); mode.action();
  assert.equal(mode.snapshot().wins, 1);
  assert.equal(h.rewards.at(-1).heavy, true);
  mode.action(); mode.frame(1.15); mode.frame(.81);
  assert.equal(mode.snapshot().phase, "reward");
  assert.equal(mode.snapshot().wins, 1);
  mode.action(); mode.frame(1.15); mode.suspend();
  assert.equal(mode.snapshot().phase, "wait");
});
test("lottery bounds random picks and ignores repeated inputs while drawing", () => {
  assert.equal(drawWeapon(() => 0).id, "bread");
  assert.equal(drawWeapon(() => .5).id, "chicken");
  assert.equal(drawWeapon(() => .999999).id, "leek");
  const h = host(), mode = lottery(h);
  mode.action(); for (let i = 0; i < 100; i++) mode.action();
  mode.frame(.8);
  assert.equal(mode.snapshot().draws, 1);
  assert.equal(h.rewards.length, 1);
  mode.frame(10); assert.equal(h.rewards.length, 1);
  mode.action(); mode.frame(.8); assert.equal(mode.snapshot().draws, 2);
  mode.dispose(); mode.frame(100); mode.action();
  assert.equal(h.rewards.length, 2);
});
