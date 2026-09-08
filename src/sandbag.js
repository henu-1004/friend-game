export const MAX_HP = 360;
export const COMBO_MS = 850;
export const MIN_PUNCH_MS = 70;
export const REACTIONS = [
  { name: "말랑말랑", caption: "어? 방금 뭐 지나갔어?", unlock: 0 },
  { name: "별이 반짝", caption: "눈앞에 별이 다섯 개!", unlock: 3 },
  { name: "빙글빙글", caption: "지구야, 잠깐만 멈춰 봐.", unlock: 6 },
  { name: "콧수염 등장", caption: "갑자기 분위기 신사.", unlock: 10 },
];
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
  return { damage, ko: state.hp === 0, reaction: state.reaction };
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
