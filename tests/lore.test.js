import test from "node:test";
import assert from "node:assert/strict";
import {
  traits,
  rollTrait,
  stages,
  upgrades,
  upgradeChoices,
  stageResult,
} from "../src/lore.js";
test("twelve distinct visible kits span the toybox", () => {
  assert.equal(traits.length, 12);
  assert.equal(new Set(traits.map((t) => t.id)).size, 12);
  for (const t of traits) {
    assert.ok(t.prop);
    assert.ok(t.behavior);
    assert.ok(t.description);
  }
  assert.equal(new Set(traits.map((t) => t.category)).size, 6);
});
test("reroll always changes kit including random boundaries", () => {
  for (const t of traits)
    for (const r of [0, 0.25, 0.99, 1])
      assert.notEqual(rollTrait(t.id, () => r).id, t.id);
});
test("all five stages have valid boss and NPC kits and unique hazards", () => {
  assert.deepEqual(
    stages.map((s) => s.english),
    ["Backyard", "Castle", "Beast Pit", "Neon Lab", "Rift"],
  );
  for (const s of stages) {
    assert.ok(traits.some((t) => t.id === s.kit));
    assert.ok(traits.some((t) => t.id === s.npc));
  }
  assert.equal(new Set(stages.map((s) => s.hazard)).size, 5);
});
test("offer three distinct upgrades even when every toy is owned", () => {
  for (const owned of [[], ["giant"], upgrades.map((u) => u.id)]) {
    const cards = upgradeChoices(owned, () => 0.5);
    assert.equal(cards.length, 3);
    assert.equal(new Set(cards.map((c) => c.id)).size, 3);
  }
  assert.ok(
    !upgradeChoices(["giant"], () => 0.5).some((c) => c.id === "giant"),
  );
});
test("only a living friendly team and defeated enemies win; timeout loses", () => {
  const teams = (a, b) => [
    { team: 0, hp: a },
    { team: 1, hp: b },
  ];
  assert.equal(stageResult(teams(50, 50), 59), null);
  assert.equal(stageResult(teams(50, 0), 15), "win");
  assert.equal(stageResult(teams(0, 50), 15), "lose");
  assert.equal(stageResult(teams(0, 0), 60), "lose");
  assert.equal(stageResult(teams(1, 99), 60), "lose");
});
