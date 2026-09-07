import "./style.css";
import {
  traits,
  rollTrait,
  stages,
  upgrades,
  upgradeChoices,
  stageResult,
} from "./lore.js";
const $ = (s) => document.querySelector(s);
$("#app").innerHTML =
  `<header><div class="brand">friend<b>smash</b> ✳ <small>VOL. 02</small></div><span id="meta" class="pill"></span></header>
<main><div class="intro"><div><div class="eyebrow">작은 얼굴 · 커다란 소동</div><h1>친구 얼굴로, 세계를 뒤집자.</h1><p>무기는 크게. 우정은 아슬아슬하게. 다섯 아레나를 함께 돌파하세요.</p></div><button id="start" class="primary">5 스테이지 시작 ↗</button></div>
<nav id="route" aria-label="스테이지 진행"></nav><div class="layout"><section><div class="arena"><div class="arena-head"><span id="status" class="live">● 입장 대기</span><span id="timer">60초</span></div><div class="stage"><canvas id="arena" width="900" height="600" aria-label="얼굴 퍽과 커다란 장난감의 자동 전투"></canvas><div id="overlay" class="overlay"><div class="eyebrow">얼굴만 있으면 준비 완료</div><h2>오늘의 전설은 누구?</h2><p>친구들은 한 팀! 적과 보스를 함께 쓰러뜨려요.</p></div></div><div class="controls"><button data-action="wind">💨 돌풍</button><button data-action="heal">🍪 친구에게 간식</button><button data-action="chaos">⚡ 대혼란</button></div></div><p id="hazard" class="hint"></p><div id="toys" class="toys"></div><p class="hint">자동 전투 · 개입 재사용 5초 · 패배해도 업그레이드를 골라 계속 진행해요.</p></section>
<aside><div class="panel"><h2>우리 팀 <span id="count"></span></h2><p>2–6명 · 능력을 눌러 장난감을 바꿔보세요.</p><div id="roster"></div><form id="add"><input id="name" placeholder="친구 이름" maxlength="16" required aria-label="친구 이름"><label class="upload">얼굴 사진 (선택)<input id="photo" type="file" accept="image/*"></label><button id="add-button">+ 친구 입장</button></form><p id="photo-status" role="status">사진은 이 브라우저 안에서만 처리돼요.</p></div><div class="panel feed"><h2>📣 친구 전설 생중계</h2><div id="events" aria-live="polite"></div></div></aside></div><div class="footer"><span>얼굴은 로컬에. 전설은 아레나에.</span><span>FRIENDSMASH / V2</span></div></main>
<dialog id="result"><div class="eyebrow" id="result-label"></div><h2 id="result-title"></h2><p id="result-copy"></p><div id="cards"></div></dialog>
<dialog id="crop-dialog"><h2>친구 얼굴 맞추기</h2><p id="crop-message"></p><canvas id="crop" width="360" height="360"></canvas><p>사진을 드래그해서 얼굴을 원 안에 맞추세요.</p><label>확대<input id="zoom" type="range" min="1" max="4" step="0.01" value="1"></label><div class="actions"><button id="save-crop" class="primary">이 얼굴로 입장</button><button id="cancel-crop">취소</button></div></dialog>`;
const colors = [
  "#d5ff63",
  "#b6a1ff",
  "#ff987f",
  "#7bdbe6",
  "#ffce69",
  "#ed99d9",
];
let roster = ["민수", "지우", "수빈", "준호"].map((name, i) => ({
  name,
  emoji: ["😎", "😈", "🥸", "🥹"][i],
  trait: traits[[0, 2, 5, 7][i]],
  color: colors[i],
}));
let fighters = [],
  shots = [],
  pets = [],
  particles = [],
  running = false,
  inRun = false,
  elapsed = 0,
  last = 0,
  cooldown = 0,
  pendingFace = null,
  events = [],
  stageIndex = 0,
  owned = [],
  carry = [],
  wins = 0,
  shake = 0;
let hype = 0;
try {
  hype = Math.max(
    0,
    Number(JSON.parse(localStorage.getItem("friendsmash-v2") || "{}").hype) ||
      0,
  );
} catch {}
function saveMeta() {
  try {
    localStorage.setItem("friendsmash-v2", JSON.stringify({ hype }));
  } catch {}
  $("#meta").textContent =
    `HYPE ${hype} · ${hype >= 100 ? "위성 장난감 해금" : "100 HYPE → 위성 해금"}`;
}
saveMeta();
const stacks = (id) => owned.filter((x) => x === id).length;
const canvas = $("#arena"),
  ctx = canvas.getContext("2d"),
  W = 900,
  H = 600;
function log(message) {
  events.unshift(message);
  events = events.slice(0, 5);
  $("#events").replaceChildren(
    ...events.map((t) => {
      const el = document.createElement("div");
      el.className = "event";
      el.textContent = t;
      return el;
    }),
  );
}
function renderRoster() {
  $("#count").textContent = `${roster.length}/6`;
  $("#roster").replaceChildren();
  roster.forEach((f, i) => {
    const row = document.createElement("div");
    row.className = "fighter";
    const avatar = document.createElement(f.face ? "img" : "span");
    avatar.className = "avatar";
    if (f.face) {
      avatar.src = f.face.src;
      avatar.alt = f.name;
    } else avatar.textContent = f.emoji;
    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = f.name;
    const kit = document.createElement("select");
    kit.setAttribute("aria-label", `${f.name} 능력`);
    kit.disabled = inRun;
    for (const t of traits) {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = `${t.prop} ${t.name}`;
      option.selected = t.id === f.trait.id;
      kit.append(option);
    }
    kit.onchange = () => {
      f.trait = traits.find((t) => t.id === kit.value);
      renderRoster();
    };
    const desc = document.createElement("div");
    desc.className = "trait";
    desc.textContent = f.trait.description;
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("i");
    const live = fighters.find((x) => x.rosterIndex === i);
    fill.style.width = `${live ? (100 * live.hp) / live.maxHp : 100}%`;
    bar.append(fill);
    info.append(name, kit, desc, bar);
    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `${f.name} 제외`);
    remove.disabled = inRun || roster.length <= 2;
    remove.onclick = () => {
      roster.splice(i, 1);
      fighters = [];
      renderRoster();
    };
    row.append(avatar, info, remove);
    $("#roster").append(row);
  });
  $("#add-button").disabled = inRun || roster.length >= 6;
  $("#start").disabled = inRun;
  $("#photo").disabled = inRun;
  $("#name").disabled = inRun;
}
function renderRoute() {
  $("#route").replaceChildren(
    ...stages.map((s, i) => {
      const d = document.createElement("div");
      d.className = i === stageIndex ? "current" : "";
      d.textContent = `${i < stageIndex ? "✓" : `0${i + 1}`} ${s.icon} ${s.name}`;
      return d;
    }),
  );
  $("#hazard").textContent = stages[stageIndex].hazard;
  $("#toys").textContent = owned.length
    ? `이번 런의 장난감: ${owned.map((id) => upgrades.find((u) => u.id === id)?.icon).join(" ")}`
    : "스테이지가 끝날 때마다 새로운 장난감을 하나 골라요.";
}
function makeFighter(f, team, i, total) {
  return {
    ...f,
    team,
    rosterIndex: team === 0 ? i : undefined,
    x: team === 0 ? 160 : 720,
    y: 95 + ((i + 0.5) * 410) / total,
    vx: 0,
    vy: 0,
    r: f.boss ? 55 : 30,
    angle: team ? Math.PI : 0,
    spin: 0,
    hp: f.boss ? 180 + stageIndex * 25 : team ? 80 : 150,
    maxHp: f.boss ? 180 + stageIndex * 25 : team ? 80 : 150,
    next: 1 + i * 0.25,
    hit: 0,
    slow: 0,
    guard: team === 0 && owned.includes("halo") ? 3 * stacks("halo") : 0,
  };
}
let pendingBoss = null;
function startStage() {
  elapsed = 0;
  cooldown = 0;
  shots = [];
  pets = [];
  particles = [];
  const s = stages[stageIndex];
  fighters = roster.map((f, i) => makeFighter(f, 0, i, roster.length));
  const friend = roster[stageIndex % roster.length];
  const enemies = Array.from(
    { length: Math.max(1, roster.length - 2) },
    (_, i) => ({
      name: `${s.name} 수비대 ${i + 1}`,
      emoji: s.icon,
      color: s.color,
      trait: traits.find((t) => t.id === s.npc),
    }),
  );
  enemies.push({
    name: stageIndex >= 3 ? `${s.boss} ${friend.name}` : s.boss,
    emoji: stageIndex >= 3 ? friend.emoji : "👹",
    face: stageIndex >= 3 ? friend.face : null,
    color: s.color,
    trait: traits.find((t) => t.id === s.kit),
    boss: true,
  });
  pendingBoss = enemies.pop();
  fighters.push(...enemies.map((f, i) => makeFighter(f, 1, i, enemies.length)));
  for (const f of fighters) {
    for (
      let n = 0;
      n < Number(f.trait.id === "wolf") + (f.team === 0 ? stacks("summon") : 0);
      n++
    )
      pets.push({ owner: f, kind: "wolf", x: f.x, y: f.y, next: 0 });
    for (
      let n = 0;
      n < Number(f.trait.id === "drone") + (f.team === 0 ? stacks("orbit") : 0);
      n++
    )
      pets.push({
        owner: f,
        kind: "drone",
        phase: n * 2,
        x: f.x,
        y: f.y,
        next: 0,
      });
  }
  running = true;
  $("#overlay").classList.add("hidden");
  $("#status").textContent = `● ${s.name} · 40초 생존 후 ${s.boss} 출현`;
  renderRoute();
  renderRoster();
  log(`${s.name} 입장! ${s.hazard}`);
}
$("#start").onclick = () => {
  inRun = true;
  stageIndex = 0;
  wins = 0;
  owned = [...carry];
  carry = [];
  events = [];
  startStage();
};
function finish(result) {
  running = false;
  wins += result === "win" ? 1 : 0;
  hype += result === "win" ? 30 : 10;
  saveMeta();
  $("#result-label").textContent =
    `STAGE ${stageIndex + 1} / 5 · ${result === "win" ? "+30" : "+10"} HYPE`;
  $("#result-title").textContent =
    result === "win" ? "친구들이 해냈다!" : "쓰러져도 전설은 계속!";
  $("#result-copy").textContent =
    stageIndex === 4
      ? `런 완료 · ${wins}/5 승리. 다음 런에 가져갈 장난감을 고르세요.`
      : "세 장 중 하나를 고르면, 모두 회복하고 다음 아레나로 이동해요.";
  let choices = upgradeChoices(owned).filter(
    (u) => u.id !== "orbit" || hype >= 100,
  );
  if (choices.length < 3)
    choices = upgrades
      .filter((u) => u.id !== "orbit" || hype >= 100)
      .sort(
        (a, b) => Number(owned.includes(a.id)) - Number(owned.includes(b.id)),
      )
      .slice(0, 3);
  $("#cards").replaceChildren(
    ...choices.map((u) => {
      const b = document.createElement("button");
      b.className = "upgrade";
      const icon = document.createElement("span");
      icon.textContent = u.icon;
      const title = document.createElement("strong");
      title.textContent = u.name;
      const desc = document.createElement("p");
      desc.textContent =
        u.description +
        (owned.includes(u.id) ? " (중복 선택: 효과가 한 겹 더 추가돼요)" : "");
      b.append(icon, title, desc);
      b.onclick = () => {
        owned.push(u.id);
        $("#result").close();
        if (stageIndex < 4) {
          stageIndex++;
          startStage();
        } else {
          carry = [u.id];
          inRun = false;
          $("#overlay").classList.remove("hidden");
          $("#overlay").textContent =
            `${wins}/5 승리 · ${u.name} 준비 완료! 새 런을 시작하세요.`;
          $("#start").textContent = "새로운 5 스테이지 ↗";
          renderRoster();
          renderRoute();
        }
      };
      return b;
    }),
  );
  $("#result").showModal();
  renderRoster();
}
$("#result").oncancel = (e) => e.preventDefault();
function burst(x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * (50 + Math.random() * 150),
      vy: Math.sin(a) * (50 + Math.random() * 150),
      life: 0.4,
      color,
    });
  }
}
function hit(target, amount, source, force = 90) {
  if (target.hp <= 0) return;
  if (target.guard) {
    target.guard--;
    burst(target.x, target.y, "#99f5ff");
    return;
  }
  if (target.trait.id === "shield") amount *= 0.55;
  target.hp = Math.max(0, target.hp - amount);
  target.hit = 0.18;
  const a = Math.atan2(target.y - source.y, target.x - source.x);
  target.vx += Math.cos(a) * force;
  target.vy += Math.sin(a) * force;
  target.spin += (Math.random() - 0.5) * 10;
  if (
    (source.team === 0 && owned.includes("ice")) ||
    source.trait?.id === "ice"
  )
    target.slow = 2 + (source.team === 0 ? stacks("ice") : 0);
  burst(target.x, target.y, target.slow ? "#9fefff" : target.color);
  shake = 4;
  if (!target.hp) log(`${target.name} 퇴장!`);
}
function shoot(f, target, kind = f.trait.id, origin = f) {
  const a = Math.atan2(target.y - origin.y, target.x - origin.x);
  shots.push({
    x: origin.x + Math.cos(a) * 42,
    y: origin.y + Math.sin(a) * 42,
    vx: Math.cos(a) * (kind === "gun" ? 400 : 260),
    vy: Math.sin(a) * (kind === "gun" ? 400 : 260),
    owner: f,
    kind,
    life: 4,
    bounces:
      f.team === 0 && owned.includes("ricochet") ? 2 * stacks("ricochet") : 0,
  });
  f.vx -= Math.cos(a) * 45;
  f.vy -= Math.sin(a) * 45;
  f.spin += 2;
}
function step(dt) {
  elapsed += dt;
  const alive = fighters.filter((f) => f.hp > 0);
  for (const f of alive) {
    const targets = alive.filter((t) => t.team !== f.team);
    const target = targets.sort(
      (a, b) =>
        Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y),
    )[0];
    if (!target) continue;
    const dx = target.x - f.x,
      dy = target.y - f.y,
      d = Math.hypot(dx, dy) || 1;
    const ranged = ["ranged", "magic", "freeze", "blast", "drone"].includes(
      f.trait.behavior,
    );
    const retreat = (ranged && d < 220) || (f.trait.id === "shield" && d < 180);
    const speed =
      (f.slow > 0 ? 42 : f.trait.id === "axe" ? 130 : 85) * (retreat ? -1 : 1);
    f.vx += ((dx / d) * speed - f.vx) * dt * 2;
    f.vy += ((dy / d) * speed - f.vy) * dt * 2;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.slow = Math.max(0, f.slow - dt);
    f.hit = Math.max(0, f.hit - dt);
    f.angle +=
      Math.atan2(
        Math.sin(Math.atan2(dy, dx) - f.angle),
        Math.cos(Math.atan2(dy, dx) - f.angle),
      ) *
        dt *
        3 +
      f.spin * dt;
    f.spin *= Math.exp(-dt * 4);
    for (const [p, v, max] of [
      ["x", "vx", W],
      ["y", "vy", H],
    ])
      if (f[p] < f.r + 15 || f[p] > max - f.r - 15) {
        f[p] = Math.max(f.r + 15, Math.min(max - f.r - 15, f[p]));
        f[v] *= -0.8;
        f.spin += f[v] * 0.015;
      }
    if (elapsed >= f.next) {
      f.next = elapsed + (f.trait.id === "gun" ? 0.65 : 1.6);
      if (ranged) shoot(f, target);
      if (f.team === 0 && owned.includes("ricochet") && !ranged)
        shoot(f, target, "gun");
      if (f.trait.id === "axe") {
        f.vx += (dx / d) * 300;
        f.vy += (dy / d) * 300;
        burst(f.x, f.y, f.color, 4);
      }
      if (f.trait.id === "magnet")
        for (const t of targets) {
          t.vx -= (t.x - f.x) * 0.8;
          t.vy -= (t.y - f.y) * 0.8;
          burst(t.x, t.y, "#ee95cf", 3);
        }
      if (f.trait.id === "snack") {
        f.hp = Math.min(f.maxHp, f.hp + 9);
        burst(f.x, f.y, "#d5ff63");
      }
      const reach =
        f.r +
        target.r +
        (f.team === 0 && owned.includes("giant")
          ? 45 + 40 * stacks("giant")
          : 45);
      if (d < reach) {
        hit(target, f.boss ? 14 : 10, f, f.trait.id === "pan" ? 380 : 100);
        f.spin += 5;
      }
    }
  }
  for (let i = 0; i < alive.length; i++)
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i],
        b = alive[j],
        dx = b.x - a.x,
        dy = b.y - a.y,
        d = Math.hypot(dx, dy) || 1,
        over = a.r + b.r - d;
      if (over > 0) {
        a.x -= ((dx / d) * over) / 2;
        b.x += ((dx / d) * over) / 2;
        a.y -= ((dy / d) * over) / 2;
        b.y += ((dy / d) * over) / 2;
        const impulse = ((b.vx - a.vx) * dx) / d + ((b.vy - a.vy) * dy) / d;
        if (impulse < 0) {
          a.vx += (impulse * dx) / d;
          b.vx -= (impulse * dx) / d;
          a.vy += (impulse * dy) / d;
          b.vy -= (impulse * dy) / d;
          a.spin += 2;
          b.spin -= 2;
        }
      }
    }
  for (const p of pets) {
    if (p.owner.hp <= 0) continue;
    const target = alive
      .filter((t) => t.team !== p.owner.team)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0];
    if (!target) continue;
    if (p.kind === "drone") {
      p.x = p.owner.x + Math.cos(elapsed * 2 + p.phase) * 70;
      p.y = p.owner.y + Math.sin(elapsed * 2 + p.phase) * 70;
      if (elapsed > p.next) {
        shoot(p.owner, target, "laser", p);
        p.next = elapsed + 1.4;
      }
    } else {
      const d = Math.hypot(target.x - p.x, target.y - p.y) || 1;
      p.x += ((target.x - p.x) / d) * 160 * dt;
      p.y += ((target.y - p.y) / d) * 160 * dt;
      if (d < target.r + 20 && elapsed > p.next) {
        hit(target, 6, p.owner);
        p.next = elapsed + 1;
      }
    }
  }
  for (const s of shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.x < 8 || s.x > W - 8 || s.y < 8 || s.y > H - 8) {
      if (s.bounces > 0) {
        if (s.x < 8 || s.x > W - 8) s.vx *= -1;
        if (s.y < 8 || s.y > H - 8) s.vy *= -1;
        s.bounces--;
        burst(s.x, s.y, "#fff", 5);
      } else s.life = 0;
    }
    for (const f of alive) {
      if (f.hp <= 0 || f.team === s.owner.team || s.life <= 0) continue;
      if (Math.hypot(s.x - f.x, s.y - f.y) < f.r + 8) {
        hit(f, s.kind === "wand" ? 12 : 7, s.owner);
        if (s.kind === "bomb")
          for (const other of alive.filter(
            (t) =>
              t !== f &&
              t.team !== s.owner.team &&
              Math.hypot(t.x - f.x, t.y - f.y) < 110,
          ))
            hit(other, 10, s.owner, 180);
        s.life = 0;
      }
    }
  }
  shots = shots.filter((s) => s.life > 0);
  const active = elapsed % 8 >= 6;
  for (const f of alive) {
    if (stageIndex === 0 && active && Math.abs(f.x - 450) < 65)
      f.vy -= 250 * dt;
    if (stageIndex === 4) {
      f.vx += (450 - f.x) * dt * 0.35;
      f.vy += (300 - f.y) * dt * 0.35;
    }
    const danger =
      stageIndex === 1
        ? Math.abs(f.x - 450) < 65
        : stageIndex === 2 || stageIndex === 4
          ? Math.hypot(f.x - 450, f.y - 300) < 100
          : stageIndex === 3
            ? Math.abs(f.y - 300) < 45
            : false;
    if (active && danger) {
      f.hp = Math.max(0, f.hp - 7 * dt);
      f.hit = 0.08;
    }
  }
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
  shake *= Math.exp(-dt * 12);
  if (pendingBoss && elapsed >= 40) {
    const boss = makeFighter(pendingBoss, 1, 0, 1);
    boss.next = elapsed + 1;
    fighters.push(boss);
    if (boss.trait.id === "wolf" || boss.trait.id === "drone")
      pets.push({
        owner: boss,
        kind: boss.trait.id,
        phase: 0,
        x: boss.x,
        y: boss.y,
        next: elapsed + 1,
      });
    log(`${boss.name} 출현! 최종 공세를 막으세요.`);
    $("#status").textContent = `● ${stages[stageIndex].name} · ${boss.name}`;
    pendingBoss = null;
  }
  const result = stageResult(fighters, elapsed);
  if (result === "win" && pendingBoss) {
    const s = stages[stageIndex];
    const guard = makeFighter(
      {
        name: `${s.name} 지원군`,
        emoji: s.icon,
        color: s.color,
        trait: traits.find((t) => t.id === s.npc),
      },
      1,
      0,
      1,
    );
    guard.next = elapsed + 1;
    fighters.push(guard);
    log("적 지원군 도착 · 보스가 다가오고 있어요!");
  } else if (result) finish(result);
}
function circle(x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
function draw() {
  const s = stages[stageIndex];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = s.color + "24";
  for (let x = 25; x < W; x += 40)
    for (let y = 25; y < H; y += 40) ctx.fillRect(x, y, 2, 2);
  ctx.strokeStyle = s.color + "50";
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.textAlign = "center";
  ctx.font = "900 65px sans-serif";
  ctx.fillStyle = s.color + "13";
  ctx.fillText(s.english.toUpperCase(), 450, 330);
  const active = elapsed % 8 >= 6;
  ctx.fillStyle = active ? "#ff715955" : s.color + "15";
  if (stageIndex === 1) ctx.fillRect(385, 15, 130, 570);
  else if (stageIndex === 3) ctx.fillRect(15, 255, 870, 90);
  else circle(450, 300, stageIndex === 0 ? 65 : 100, ctx.fillStyle);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = s.color;
  ctx.fillText(
    active ? "⚠ 위험 구역 활성" : "위험 구역 · 점멸 후 활성",
    450,
    570,
  );
  const visible = fighters.length
    ? fighters
    : roster.map((f, i) => ({
        ...f,
        x: 170 + i * 180,
        y: 300,
        r: 33,
        angle: Math.sin(performance.now() / 1500 + i) * 0.3,
        hp: 150,
        maxHp: 150,
        team: 0,
      }));
  for (const f of visible) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = f.hp > 0 ? 1 : 0.18;
    ctx.rotate(f.angle || 0);
    if (f.hit > 0) ctx.scale(1.18, 0.84);
    ctx.shadowColor = "#0009";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 9;
    circle(0, 0, f.r + 5, "#101318");
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    circle(0, 0, f.r, f.color);
    ctx.save();
    circle(0, 0, f.r - 6, "#373c46");
    ctx.clip();
    if (f.face)
      ctx.drawImage(f.face, -f.r + 6, -f.r + 6, (f.r - 6) * 2, (f.r - 6) * 2);
    else {
      ctx.font = `${f.r * 1.25}px sans-serif`;
      ctx.fillText(f.emoji, 0, f.r * 0.44);
    }
    if (f.hit > 0) {
      ctx.fillStyle = "#ffffffa0";
      ctx.fillRect(-f.r, -f.r, f.r * 2, f.r * 2);
    }
    ctx.restore();
    const big = f.team === 0 && owned.includes("giant");
    ctx.font = `${big ? 56 + 22 * stacks("giant") : f.boss ? 76 : 56}px sans-serif`;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 5;
    ctx.strokeText(f.trait.prop, f.r + 21, 18);
    ctx.fillText(f.trait.prop, f.r + 21, 18);
    if (f.guard > 0) {
      ctx.strokeStyle = "#97f3ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, f.r + 13, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (f.slow > 0) {
      ctx.font = "22px sans-serif";
      ctx.fillText("❄️", -f.r, 0);
    }
    ctx.restore();
    ctx.fillStyle = f.team === 1 ? "#ffb2a3" : "#fff";
    ctx.font = `${f.boss ? "bold " : ""}14px sans-serif`;
    ctx.fillText(f.name, f.x, f.y - f.r - 23);
    ctx.fillStyle = "#0008";
    ctx.fillRect(f.x - 30, f.y - f.r - 16, 60, 4);
    ctx.fillStyle = f.color;
    ctx.fillRect(f.x - 30, f.y - f.r - 16, (60 * f.hp) / f.maxHp, 4);
  }
  for (const p of pets)
    if (p.owner.hp > 0) {
      ctx.font = "32px sans-serif";
      ctx.fillText(p.kind === "wolf" ? "🐺" : "🛸", p.x, p.y);
    }
  for (const s of shots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    if (["bomb", "ice"].includes(s.kind)) {
      ctx.font = "23px sans-serif";
      ctx.fillText(s.kind === "bomb" ? "💣" : "❄️", 0, 8);
    } else {
      ctx.shadowBlur = 12;
      ctx.shadowColor = s.owner.color;
      ctx.fillStyle = s.owner.color;
      ctx.fillRect(
        -10,
        -3,
        s.kind === "bow" ? 30 : 17,
        s.kind === "wand" ? 13 : 6,
      );
    }
    ctx.restore();
  }
  for (const p of particles) {
    ctx.globalAlpha = p.life / 0.4;
    circle(p.x, p.y, 3, p.color);
  }
  ctx.restore();
}
let ui = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.035);
  last = now;
  if (running) step(dt);
  draw();
  if (now - ui > 250) {
    ui = now;
    $("#timer").textContent = `${Math.max(0, Math.ceil(60 - elapsed))}초`;
    document.querySelectorAll("[data-action]").forEach((b) => {
      b.disabled = !running || elapsed < cooldown;
      b.title =
        elapsed < cooldown ? `${Math.ceil(cooldown - elapsed)}초 후 사용` : "";
    });
    if (running)
      roster.forEach((f, i) => {
        const live = fighters.find((x) => x.rosterIndex === i);
        const bar = $("#roster").children[i]?.querySelector(".bar i");
        if (bar && live) bar.style.width = `${(100 * live.hp) / live.maxHp}%`;
      });
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
renderRoster();
renderRoute();
for (const button of document.querySelectorAll("[data-action]"))
  button.onclick = () => {
    if (!running || elapsed < cooldown) return;
    cooldown = elapsed + 5;
    for (const f of fighters.filter((f) => f.hp > 0)) {
      if (button.dataset.action === "heal") {
        if (f.team === 0) {
          f.hp = Math.min(f.maxHp, f.hp + 25);
          burst(f.x, f.y, "#d5ff63");
        }
      } else if (button.dataset.action === "wind") f.vx += 330;
      else {
        const angle = Math.random() * Math.PI * 2;
        f.vx = Math.cos(angle) * 450;
        f.vy = Math.sin(angle) * 450;
        f.spin += 12;
      }
    }
    log(`관전자 개입 · ${button.textContent}`);
  };
$("#add").onsubmit = (e) => {
  e.preventDefault();
  if (inRun || roster.length >= 6) return;
  const name = $("#name").value.trim();
  if (!name) return;
  roster.push({
    name,
    emoji: "🤩",
    face: pendingFace,
    color: colors.find((c) => !roster.some((f) => f.color === c)) || colors[0],
    trait: rollTrait(),
  });
  pendingFace = null;
  $("#add").reset();
  $("#photo-status").textContent = "사진은 이 브라우저 안에서만 처리돼요.";
  fighters = [];
  renderRoster();
};
// FaceDetector never sends image pixels to a server. Unsupported browsers use the same local crop editor.
let source,
  scale = 1,
  base = 1,
  offset = { x: 0, y: 0 },
  drag;
const crop = $("#crop"),
  cc = crop.getContext("2d");
function paintCrop() {
  cc.clearRect(0, 0, 360, 360);
  cc.fillStyle = "#101318";
  cc.fillRect(0, 0, 360, 360);
  const s = base * scale;
  cc.drawImage(source, offset.x, offset.y, source.width * s, source.height * s);
  cc.fillStyle = "#0009";
  cc.beginPath();
  cc.rect(0, 0, 360, 360);
  cc.arc(180, 180, 140, 0, Math.PI * 2, true);
  cc.fill("evenodd");
  cc.strokeStyle = "#d5ff63";
  cc.lineWidth = 2;
  cc.beginPath();
  cc.arc(180, 180, 140, 0, Math.PI * 2);
  cc.stroke();
}
$("#photo").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pendingFace = null;
  $("#add-button").disabled = true;
  $("#photo-status").textContent = "얼굴 확인 중…";
  const url = URL.createObjectURL(file);
  try {
    source = new Image();
    source.src = url;
    await source.decode();
    base = Math.max(360 / source.width, 360 / source.height);
    scale = 1;
    offset = {
      x: (360 - source.width * base) / 2,
      y: (360 - source.height * base) / 2,
    };
    let detected = false;
    if ("FaceDetector" in window) {
      try {
        const faces = await new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        }).detect(source);
        if (faces.length) {
          const b = faces[0].boundingBox;
          base = 280 / (Math.max(b.width, b.height) * 1.35);
          offset = {
            x: 180 - (b.x + b.width / 2) * base,
            y: 180 - (b.y + b.height / 2) * base,
          };
          detected = true;
        }
      } catch {}
    }
    $("#crop-message").textContent = detected
      ? "얼굴을 찾았어요! 위치를 확인하고 조절하세요."
      : "자동 감지를 사용할 수 없어요. 직접 얼굴을 맞춰주세요.";
    $("#zoom").value = 1;
    paintCrop();
    $("#crop-dialog").showModal();
  } catch {
    $("#photo-status").textContent =
      "사진을 열 수 없어요. 다른 이미지로 다시 시도하세요.";
  } finally {
    URL.revokeObjectURL(url);
    renderRoster();
  }
};
crop.onpointerdown = (e) => {
  drag = { x: e.clientX, y: e.clientY };
  crop.setPointerCapture(e.pointerId);
};
crop.onpointermove = (e) => {
  if (!drag) return;
  const ratio = 360 / crop.getBoundingClientRect().width;
  offset.x += (e.clientX - drag.x) * ratio;
  offset.y += (e.clientY - drag.y) * ratio;
  drag = { x: e.clientX, y: e.clientY };
  paintCrop();
};
crop.onpointerup = crop.onpointercancel = () => (drag = null);
$("#zoom").oninput = (e) => {
  const next = Number(e.target.value);
  offset.x = 180 + ((offset.x - 180) * next) / scale;
  offset.y = 180 + ((offset.y - 180) * next) / scale;
  scale = next;
  paintCrop();
};
$("#save-crop").onclick = async () => {
  const out = document.createElement("canvas");
  out.width = out.height = 280;
  const c = out.getContext("2d");
  c.beginPath();
  c.arc(140, 140, 140, 0, Math.PI * 2);
  c.clip();
  c.drawImage(
    source,
    offset.x - 40,
    offset.y - 40,
    source.width * base * scale,
    source.height * base * scale,
  );
  pendingFace = new Image();
  pendingFace.src = out.toDataURL("image/png");
  await pendingFace.decode();
  $("#photo-status").textContent = "얼굴 준비 완료 · 친구 입장을 눌러주세요.";
  $("#crop-dialog").close();
};
$("#cancel-crop").onclick = () => $("#crop-dialog").close();
$("#crop-dialog").onclose = () => {
  if (!pendingFace) {
    $("#photo").value = "";
    $("#photo-status").textContent =
      "사진 선택 취소 · 이름만으로도 입장할 수 있어요.";
  }
};
