export function finisherReward(position) {
  return Math.abs(position - .5) <= .13 ? { label: "우정 파괴력 999!", perfect: true } : { label: "삑! 솜주먹 12점", perfect: false };
}
export function createMode(host) {
  let phase = "aim", elapsed = 0, position = .05, wins = 0, reduced = false;
  function ready() {
    phase = "aim"; elapsed = 0; position = .05; host.reset(); host.meter(position);
    host.show({ status: "가운데에 오면 딱 한 방!", hint: "주황 구간을 노려. 빗나가도 웃긴 한 방.", button: "지금! 필살기", callout: "한 방에 끝내자", score: `정통 ${wins}회`, meter: true });
  }
  ready();
  return {
    action() {
      if (phase === "reward") { ready(); return; }
      if (phase !== "aim") return;
      const reward = finisherReward(position); phase = "reward";
      if (reward.perfect) wins++;
      host.impact({ heavy: reward.perfect, ko: reward.perfect, reaction: reward.perfect ? 6 : 3, event: reward.perfect ? "spirit" : null });
      host.show({ status: reward.label, hint: reward.perfect ? "영혼까지 깔끔하게 퇴근." : "힘은 들어갔는데… 삑사리도 재능.", button: "다시 한 방 ↻", callout: reward.perfect ? "999!!" : "삑…", score: `정통 ${wins}회`, meter: true });
    },
    frame(dt) { if (phase !== "aim") return; elapsed += dt; position = .5 - Math.cos(elapsed * (reduced ? 2 : 3.6)) * .45; host.meter(position); },
    setReduced(value) { reduced = value; },
    suspend() {}, dispose() { phase = "disposed"; },
    snapshot: () => ({ phase, position, wins }),
  };
}
