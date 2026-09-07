export const traits = [
  { id: 'escape', name: '도망의 신', description: '위험하면 초고속 도주', toast: '도망도 재능이다! 💨' },
  { id: 'traitor', name: '배신자', description: '충돌할 때 상대 체력 훔치기', toast: '친구 체력? 이제 내 거! 🐍' },
  { id: 'immortal', name: '불사신', description: '한 번 쓰러져도 체력 40으로 부활', toast: '아직 집에 안 간다! 🔥' },
  { id: 'snack', name: '간식 도둑', description: '주기적으로 체력 8 회복', toast: '몰래 먹는 간식이 제일 맛있지 🍪' },
  { id: 'rage', name: '급발진 장인', description: '주기적으로 속도와 충돌 피해 증가', toast: '갑자기 왜 이렇게 진심이야?! 💢' },
  { id: 'magnet', name: '인간 자석', description: '주변 친구들을 자기 쪽으로 끌어당김', toast: '얘들아 나 좀 봐! 🧲' },
];
export function rollTrait(previous, random = Math.random) {
  const pool = traits.filter(t => t.id !== previous);
  return pool[Math.floor(random() * pool.length)];
}
export function activate(f, fighters, time) {
  const id = f.trait.id;
  if (id === 'immortal' || id === 'traitor' || time < f.nextProc) return false;
  if (id === 'escape' && f.hp > 55) return false;
  f.nextProc = time + 7;
  if (id === 'escape' || id === 'rage') { f.vx *= 1.8; f.vy *= 1.8; f.boostUntil = time + 2; }
  if (id === 'snack') f.hp = Math.min(100, f.hp + 8);
  if (id === 'magnet') for (const other of fighters) {
    if (other === f || other.hp <= 0) continue;
    const dx = f.x - other.x, dy = f.y - other.y, d = Math.hypot(dx, dy) || 1;
    other.vx += dx / d * 140; other.vy += dy / d * 140;
  }
  return true;
}
export function damage(f, amount) {
  f.hp = Math.max(0, f.hp - amount);
  if (!f.hp && f.trait.id === 'immortal' && !f.revived) { f.hp = 40; f.revived = true; return true; }
  return false;
}
