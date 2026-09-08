export function dodgeReward(phase) { return phase === "tell"; }
export function createMode(host) {
  let phase = "wait", elapsed = 0, wins = 0, reduced = false;
  function ready() {
    phase = "wait"; elapsed = 0; host.reset(); host.pose("guard");
    host.show({ status: "상대가 씩 웃으면 피해!", hint: "‘지금 피해!’가 뜨면 한 번. 피하면 자동 반격!", button: "숙이기", callout: "…눈치 보는 중", score: `반격 ${wins}회`, prop: "🥊" });
  }
  function result(success, early = false) {
    phase = "reward"; host.pose(success ? "dodged" : "bonk");
    if (success) wins++;
    host.impact({ heavy: success, reaction: success ? 4 : 1, event: success ? "sneeze" : null });
    host.show({ status: success ? "쓱 피하고 뽁! 반격 성공" : early ? "너무 빨라ㅋㅋ 혼자 인사했네" : "늦었다! 이마에 뽁!", hint: "한 번 더? 상대가 웃을 때만 숙여 봐.", button: "다시 눈치 싸움 ↻", callout: success ? "헛손질 고마워!" : "뽁!", score: `반격 ${wins}회`, prop: "🥊" });
  }
  ready();
  return {
    action() { if (phase === "disposed") return; if (phase === "reward") ready(); else result(dodgeReward(phase), phase === "wait"); },
    frame(dt) {
      if (phase === "reward" || phase === "disposed") return;
      elapsed += dt;
      if (phase === "wait" && elapsed >= 1.15) {
        phase = "tell"; elapsed = 0; host.pose("tell");
        host.show({ status: "지금 피해!", hint: "숙이면 바로 반격!", button: "지금! 숙이기", callout: "히죽… 간다!!", score: `반격 ${wins}회`, prop: "🥊" });
      } else if (phase === "tell" && elapsed >= (reduced ? 1.1 : .8)) result(false);
    },
    setReduced(value) { reduced = value; },
    suspend() { if (phase !== "reward") ready(); },
    dispose() { phase = "disposed"; },
    snapshot: () => ({ phase, wins }),
  };
}
