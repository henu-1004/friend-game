export const traits = [
  ["axe", "급발진 장인", "🪓", "근접", "도끼를 들고 적에게 돌진해요.", "rush"],
  [
    "shield",
    "도망의 신",
    "🛡️",
    "방어",
    "방패로 막고 적에게서 달아나요.",
    "flee",
  ],
  [
    "bow",
    "거리두기 달인",
    "🏹",
    "원거리",
    "거리를 유지하며 화살을 쏴요.",
    "ranged",
  ],
  [
    "gun",
    "방아쇠 친구",
    "🔫",
    "원거리",
    "빠른 탄환을 연속 발사해요.",
    "ranged",
  ],
  ["wand", "마법 과몰입", "🪄", "마법", "커다란 마법 구체를 날려요.", "magic"],
  ["wolf", "늑대 집사", "🐺", "야수", "늑대가 함께 적을 추격해요.", "summon"],
  [
    "drone",
    "드론 조종사",
    "🛸",
    "SF",
    "공전하는 드론이 레이저를 쏴요.",
    "drone",
  ],
  [
    "pan",
    "주방의 지배자",
    "🍳",
    "근접",
    "프라이팬으로 멀리 밀어내요.",
    "knockback",
  ],
  ["magnet", "인간 자석", "🧲", "SF", "자석으로 적을 끌어당겨요.", "pull"],
  [
    "ice",
    "냉동 인간",
    "❄️",
    "마법",
    "얼음탄이 적을 잠시 느리게 해요.",
    "freeze",
  ],
  [
    "bomb",
    "폭탄 돌리기",
    "💣",
    "원거리",
    "폭탄이 터지며 주변 적을 맞혀요.",
    "blast",
  ],
  ["snack", "간식 수호자", "🍭", "방어", "회복 간식을 만들며 싸워요.", "heal"],
].map(([id, name, prop, category, description, behavior]) => ({
  id,
  name,
  prop,
  category,
  description,
  behavior,
}));
export function rollTrait(previous, random = Math.random) {
  const pool = traits.filter((t) => t.id !== previous);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
export const stages = [
  {
    name: "뒷마당",
    english: "Backyard",
    color: "#bcdf75",
    bg: "#1d302b",
    hazard: "잔디 스프링클러 · 중앙 물줄기가 밀쳐요",
    boss: "잔디 왕",
    kit: "pan",
    npc: "snack",
    icon: "🌻",
  },
  {
    name: "성채",
    english: "Castle",
    color: "#f6c579",
    bg: "#302b37",
    hazard: "성문 함정 · 붉은 세로 띠를 피하세요",
    boss: "철벽 기사",
    kit: "shield",
    npc: "bow",
    icon: "🏰",
  },
  {
    name: "야수 구덩이",
    english: "Beast Pit",
    color: "#ffa47c",
    bg: "#38281f",
    hazard: "야수의 발톱 · 중앙 독 웅덩이",
    boss: "늑대 군주",
    kit: "wolf",
    npc: "axe",
    icon: "🐾",
  },
  {
    name: "네온 연구소",
    english: "Neon Lab",
    color: "#79e8ef",
    bg: "#162d3b",
    hazard: "실험 레이저 · 가로 띠가 점멸해요",
    boss: "메카",
    kit: "drone",
    npc: "gun",
    icon: "⚙️",
  },
  {
    name: "균열",
    english: "Rift",
    color: "#c5a0ff",
    bg: "#2d2040",
    hazard: "불안정한 균열 · 중심으로 끌어당겨요",
    boss: "초거대",
    kit: "wand",
    npc: "ice",
    icon: "🌀",
  },
];
export const upgrades = [
  {
    id: "giant",
    name: "왕 커진 장난감",
    icon: "🪓",
    description: "모든 친구의 소품이 커지고 근접 사거리가 늘어요.",
  },
  {
    id: "ricochet",
    name: "벽도 내 편",
    icon: "💫",
    description: "친구 모두 탄환을 발사하고, 벽에서 두 번 튕겨요.",
  },
  {
    id: "summon",
    name: "늑대 한 마리 더",
    icon: "🐺",
    description: "친구마다 적을 추격하는 늑대가 한 마리 추가돼요.",
  },
  {
    id: "orbit",
    name: "위성 출근",
    icon: "🛸",
    description: "친구마다 레이저를 쏘는 드론이 추가돼요.",
  },
  {
    id: "ice",
    name: "아이스 토핑",
    icon: "❄️",
    description: "모든 타격에 눈꽃이 터지고 적을 느리게 해요.",
  },
  {
    id: "halo",
    name: "보호 고리",
    icon: "🛡️",
    description: "빛나는 방어막이 첫 3번의 타격을 막아요.",
  },
];
export function upgradeChoices(owned, random = Math.random) {
  const pool = upgrades.map((u) => ({
    ...u,
    rank: Number(owned.includes(u.id)) + random(),
  }));
  return pool.sort((a, b) => a.rank - b.rank).slice(0, 3);
}
export function stageResult(fighters, elapsed) {
  const friends = fighters.some((f) => f.team === 0 && f.hp > 0),
    enemies = fighters.some((f) => f.team === 1 && f.hp > 0);
  if (!friends) return "lose";
  if (!enemies) return "win";
  if (elapsed >= 60) return "lose";
  return null;
}
