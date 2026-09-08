export const MAX_HP = 360;
export const COMBO_MS = 850;
export const MIN_PUNCH_MS = 70;
export const REACTIONS = [
  { name: "자동", icon: "☺", caption: "어디 한 번 쳐 보시지.", unlock: 0 },
  { name: "눈물 수도꼭지", icon: "ㅠ", caption: "안 우는데? 눈에서 땀이 나는데?", unlock: 3 },
  { name: "왕 콧방울", icon: "◌", caption: "콧방울 보존 법칙… 에취!", unlock: 6 },
  { name: "이 꽉!", icon: "▤", caption: "치과에서는 꽉 물라던데.", unlock: 10 },
  { name: "X눈과 침", icon: "×", caption: "시스템 종료… 침은 정상 작동.", unlock: 14 },
  { name: "만화 코피", icon: "!", caption: "이건 만화야. 휴지 한 장만.", unlock: 18 },
  { name: "별 천지", icon: "✦", caption: "별점 다섯 개 드립니다…", unlock: 23 },
];
// Exactly two one-shot gags per round, independent of broken combos.
export function comedyEvent(hits) {
  return hits === 8 ? "sneeze" : hits === 20 ? "spirit" : null;
}
export function newRound() {
  return {
    hp: MAX_HP,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    lastHit: -Infinity,
    started: null,
    ended: null,
    reaction: 0,
    unlocked: 0,
  };
}
export function expireCombo(state, now) {
  if (state.combo && now - state.lastHit > COMBO_MS) {
    state.combo = 0;
    return true;
  }
  return false;
}
export function punch(state, now) {
  if (state.hp <= 0 || now - state.lastHit < MIN_PUNCH_MS) return null;
  expireCombo(state, now);
  state.started ??= now;
  state.combo++;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.hits++;
  state.lastHit = now;
  const damage = 8 + Math.min(6, Math.floor(state.combo / 4));
  state.hp = Math.max(0, state.hp - damage);
  state.reaction = REACTIONS.findLastIndex((r) => state.combo >= r.unlock);
  state.unlocked = Math.max(state.unlocked, state.reaction);
  if (state.hp === 0) state.ended = now;
  return { damage, ko: state.hp === 0, reaction: state.reaction, heavy: state.combo % 4 === 0, event: comedyEvent(state.hits) };
}
export function roundSeconds(state) {
  return state.started === null || state.ended === null
    ? 0
    : (state.ended - state.started) / 1000;
}
export function cropPosition(width, height, zoom, x, y, size = 320) {
  const scale = Math.max(size / width, size / height) * zoom;
  const w = width * scale,
    h = height * scale;
  return {
    w,
    h,
    x: Math.min(0, Math.max(size - w, (size - w) / 2 + x)),
    y: Math.min(0, Math.max(size - h, (size - h) / 2 + y)),
  };
}
