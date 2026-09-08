export const WEAPONS = [
  { id: "bread", name: "어제 산 바게트", icon: "🥖", reward: "바삭! 부스러기 300점", reaction: 3 },
  { id: "chicken", name: "비명 지르는 닭", icon: "🐔", reward: "꽈아악! 소음 999점", reaction: 6 },
  { id: "leek", name: "대파 한 단", icon: "🥬", reward: "파하하! 향기 500점", reaction: 2 },
];
export function drawWeapon(random = Math.random) { return WEAPONS[Math.min(2, Math.max(0, Math.floor(random() * WEAPONS.length)))]; }
export function createMode(host) {
  let phase = "ready", elapsed = 0, index = -1, weapon = null, draws = 0, reduced = false;
  function ready() {
    phase = "ready"; host.reset();
    host.show({ status: "오늘의 무기… 뭐 나올까?", hint: "한 번 누르면 뽑고, 알아서 한 대!", button: "뽑아서 갈기기", callout: "바게트? 닭? 대파?", score: `뽑기 ${draws}회`, prop: "?" });
  }
  ready();
  return {
    action() {
      if (phase === "rolling" || phase === "disposed") return;
      host.reset(); phase = "rolling"; elapsed = 0; index = -1; weapon = drawWeapon();
      host.show({ status: "달그락 달그락…", hint: "이번엔 대체 뭘 뽑은 거야", button: "뽑는 중…", callout: "???", score: `뽑기 ${draws}회`, prop: "?" });
    },
    frame(dt) {
      if (phase !== "rolling") return;
      elapsed += dt;
      const next = Math.floor(elapsed / .12) % WEAPONS.length;
      if (!reduced && next !== index && elapsed < .72) {
        index = next; host.show({ status: "달그락 달그락…", hint: "뽑으면 바로 한 대!", button: "뽑는 중…", callout: WEAPONS[index].name, score: `뽑기 ${draws}회`, prop: WEAPONS[index].icon });
      }
      if (elapsed >= .78) {
        phase = "reward"; draws++;
        host.impact({ heavy: true, reaction: weapon.reaction, prop: weapon.id });
        host.show({ status: weapon.reward, hint: `${weapon.name} 당첨. 친구는 무사해!`, button: "한 번 더 뽑기 ↻", callout: weapon.name, score: `뽑기 ${draws}회`, prop: weapon.icon });
      }
    },
    setReduced(value) { reduced = value; }, suspend() {}, dispose() { phase = "disposed"; },
    snapshot: () => ({ phase, draws, weapon: weapon?.id ?? null }),
  };
}
