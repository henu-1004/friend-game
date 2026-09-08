const TAU = Math.PI * 2;
const INK = "#25281e";
export const PARTICLE_CAP = 32;
export const HITSTOP_MS = { normal: 38, heavy: 58, ko: 82 };
function oval(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
}
function line(c, points, color = INK, width = 4) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round";
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
function star(c, x, y, r, color = "#ffe66a", angle = 0) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = angle + i * Math.PI / 5 - Math.PI / 2, radius = i % 2 ? r * .44 : r;
    c.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  c.closePath(); c.fillStyle = color; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
}
function rounded(c, x, y, w, h, r, fill, stroke = true) {
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); }
}
function texture(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width * 2; canvas.height = height * 2;
  const c = canvas.getContext("2d"); c.scale(2, 2); paint(c);
  return canvas;
}
// Authored approximate eye/nose/mouth offsets relative to the face center.
// All masks and sticker paths are rasterized once, never in frame().
function sticker(c, mode) {
  c.translate(140, 140);
  if (mode === 1 || mode === 7) { // tears
    for (const x of [-36, 36]) {
      line(c, [[x - 17, -19], [x, -27], [x + 17, -19]]);
      rounded(c, x - 9, -13, 18, 73, [3, 3, 10, 10], "#6bd8f2");
      line(c, [[x - 3, 0], [x - 3, 42]], "#e6fcff", 3);
    }
  }
  if (mode === 2 || mode === 7) { // snot bubble
    oval(c, 9, 6, 12, 8, "#e5a860");
    line(c, [[10, 10], [15, 30]], "#67762f", 5);
    oval(c, 24, 40, 21, 26, "#c4e66d");
    line(c, [[14, 30], [14, 43]], "#fbffd7", 5);
  }
  if (mode === 3 || mode === 7) { // grimace
    rounded(c, -39, 30, 78, 30, 9, "#fff9da");
    line(c, [[-35, 45], [35, 45]], INK, 2);
    for (const x of [-20, 0, 20]) line(c, [[x, 33], [x, 57]], INK, 2);
    if (mode === 3) for (const x of [-36, 36]) line(c, [[x - 16, -30], [x + 16, -17]], INK, 6);
  }
  if (mode === 4 || mode === 7) { // X eyes + drool
    for (const x of [-36, 36]) {
      line(c, [[x - 16, -37], [x + 16, -8]], "#fff8df", 11);
      line(c, [[x + 16, -37], [x - 16, -8]], "#fff8df", 11);
      line(c, [[x - 16, -37], [x + 16, -8]], INK, 6);
      line(c, [[x + 16, -37], [x - 16, -8]], INK, 6);
    }
    rounded(c, 21, 47, 15, 39, [3, 3, 9, 9], "#79d5e4");
    oval(c, 26, 83, 12, 7, "#79d5e4");
  }
  if (mode === 5) { // deliberately flat, tiny cartoon nosebleed
    line(c, [[-52, -26], [-23, -19]], INK, 6);
    line(c, [[23, -19], [52, -26]], INK, 6);
    rounded(c, 2, 8, 9, 29, 4, "#f66b6f", false);
    oval(c, 7, 42, 5, 7, "#f66b6f");
    rounded(c, -32, 34, 25, 16, 3, "#fffbe9");
  }
  if (mode === 6 || mode === 7) {
    star(c, -85, -93, 22); star(c, 81, -78, 16, "#ff8756", .3);
    star(c, 8, -115, 13, "#f9f2bf", -.2);
    if (mode === 6) {
      star(c, -36, -23, 25); star(c, 36, -23, 25);
      oval(c, 0, 43, 20, 14, INK);
      oval(c, 3, 50, 11, 6, "#f5998c");
    }
  }
}
export class SandbagRenderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this._face = null; this._reaction = 0; this._reduced = false; this.lite = false;
    this.particles = []; this.stats = { draws: 0, cacheBuilds: 0, maxParticles: 0, hitstops: 0, clearedPixels: 0 };
    this.stickers = Array.from({ length: 8 }, (_, i) => texture(280, 280, c => sticker(c, i)));
    this.glove = texture(100, 85, c => {
      rounded(c, 3, 21, 36, 48, 6, "#fff4d4");
      rounded(c, 24, 5, 69, 65, [26, 23, 18, 12], "#f25e36");
      rounded(c, 32, 47, 29, 29, 14, "#e24b2a");
      line(c, [[40, 17], [69, 17]], "#ffa473", 5);
      line(c, [[12, 30], [12, 60]], INK, 2);
    });
    this.rebuildBag(); this.reset(); this.resize();
  }
  get face() { return this._face; }
  set face(value) { this._face = value; this.rebuildBag(); this.dirty = true; }
  get reaction() { return this._reaction; }
  set reaction(value) { if (this._reaction !== value) this.dirty = true; this._reaction = value; }
  get reduced() { return this._reduced; }
  set reduced(value) { this._reduced = value; this.dirty = true; }
  rebuildBag() {
    this.stats.cacheBuilds++;
    this.bag = texture(270, 350, c => {
      c.translate(135, 170);
      rounded(c, -120, -155, 240, 323, [43, 43, 60, 60], "#b5c478");
      rounded(c, 90, -128, 24, 263, 12, "#96a65f", false);
      rounded(c, -111, -120, 14, 238, 7, "#dce5a5", false);
      rounded(c, -107, -151, 214, 29, 10, "#505e39");
      rounded(c, -97, 113, 194, 41, 13, "#505e39");
      c.strokeStyle = "#e4edb7"; c.lineWidth = 1.5; c.setLineDash([4, 6]);
      c.strokeRect(-109, -112, 218, 214); c.setLineDash([]);
      c.save(); c.rotate(-.045);
      rounded(c, -37, 122, 74, 20, 1, "#f5eed4", false);
      c.fillStyle = INK; c.font = "900 10px sans-serif"; c.textAlign = "center"; c.fillText("때려도 친구", 0, 136);
      c.restore();
      oval(c, 0, -4, 105, 105, INK); oval(c, 0, -6, 101, 101, "#f8d36f");
      c.save(); c.beginPath(); c.arc(0, -6, 98, 0, TAU); c.clip();
      if (this.face) c.drawImage(this.face, -98, -104, 196, 196);
      else {
        oval(c, -66, 22, 17, 11, "#efac67"); oval(c, 66, 22, 17, 11, "#efac67");
        oval(c, -36, -24, 8, 13, INK); oval(c, 36, -24, 8, 13, INK);
        line(c, [[-51, -51], [-25, -47]], INK, 5); line(c, [[25, -47], [51, -51]], INK, 5);
        c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(0, 3, 40, .2, Math.PI - .2); c.stroke();
      }
      c.restore();
    });
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width); this.height = Math.max(1, rect.height);
    this.dpr = Math.min(devicePixelRatio || 1, this.lite ? 1 : matchMedia("(pointer: coarse)").matches ? 1.25 : 1.5, Math.sqrt(1_000_000 / (this.width * this.height)));
    this.canvas.width = Math.floor(this.width * this.dpr); this.canvas.height = Math.floor(this.height * this.dpr);
    this.scale = Math.min(this.height / 440, this.width / 335);
    this.offsetY = (this.height - 440 * this.scale) / 2;
    this.dirty = true;
  }
  reduceEffects() {
    if (this.lite) return;
    this.lite = true;
    if (this.particles.length > 16) this.particles.length = 16;
    this.resize(); this.draw();
  }
  hitTest(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const x = (clientX - r.left - this.width / 2) / this.scale;
    const y = (clientY - r.top - this.offsetY) / this.scale;
    return Math.abs(x) < 145 && y > 66 && y < 408;
  }
  hit(direction, ko = false, heavy = false, event = null, prop = null) {
    this.direction = direction; this.ko = ko; this.heavy = heavy || ko;
    this.impact = 1; this.impactAge = 0; this.kick = direction * (this.heavy ? 9 : 5);
    this.velocity = direction * (this.heavy ? 115 : 85);
    this.freeze = this.reduced ? 0 : HITSTOP_MS[ko ? "ko" : heavy ? "heavy" : "normal"] / 1000;
    this.stats.hitstops++; this.prop = prop;
    if (event) { this.event = event; this.eventAge = 0; }
    const cap = this.lite ? 16 : PARTICLE_CAP;
    const count = this.reduced ? 3 : this.lite ? (this.heavy ? 6 : 4) : this.heavy ? 13 : 7;
    for (let i = 0; i < count; i++) {
      if (this.particles.length === cap) this.particles.shift();
      const a = Math.random() * TAU;
      this.particles.push({ x: direction * 80, y: 210, vx: Math.cos(a) * 180,
        vy: Math.sin(a) * 160 - 70, age: 0, life: .32 + Math.random() * .22, size: 3 + i % 4,
        color: ["#ff7948", "#f7df7c", "#f9f5dd"][i % 3] });
    }
    this.stats.maxParticles = Math.max(this.stats.maxParticles, this.particles.length);
    this.dirty = true; this.draw();
  }
  reset() {
    Object.assign(this, { ko: false, kick: 0, velocity: 0, impact: 0, impactAge: 10,
      direction: 1, freeze: 0, event: null, eventAge: 10, prop: null, dirty: true, heavy: false });
    this.particles.length = 0; this.reaction = 0;
  }
  frame(dt) {
    if (this.freeze > 0) { this.freeze = Math.max(0, this.freeze - dt); return; }
    const moving = this.impact > 0 || Math.abs(this.kick) > .015 || Math.abs(this.velocity) > .03 || this.particles.length || this.event;
    if (!moving && !this.dirty) return;
    this.impactAge += dt; this.impact = Math.max(0, this.impact - dt * (this.heavy ? 3.8 : 5.4));
    // One damped scalar recoil; no body physics, face warping, or allocations in the spring.
    this.velocity += (-this.kick * 170 - this.velocity * 17) * dt; this.kick += this.velocity * dt;
    if (Math.abs(this.kick) < .015 && Math.abs(this.velocity) < .03) this.kick = this.velocity = 0;
    if (this.event) { this.eventAge += dt; if (this.eventAge > 1.05) this.event = null; }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += dt * 380;
      if (p.age > p.life || Math.abs(p.x) > 195 || p.y > 420 || p.y < 20) this.particles.splice(i, 1);
    }
    this.draw();
  }
  draw() {
    const c = this.ctx, s = this.scale;
    if (!s) return;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Only the bounded actor/effect envelope is cleared; CSS owns the static gym.
    const left = Math.max(0, this.width / 2 - 232 * s), top = Math.max(0, this.offsetY - 8 * s);
    const width = Math.min(this.width, this.width / 2 + 232 * s) - left;
    const height = Math.min(this.height, this.offsetY + 448 * s) - top;
    c.clearRect(left, top, width, height);
    this.stats.draws++; this.stats.clearedPixels += width * height * this.dpr ** 2; this.dirty = false;
    c.save();
    // Clip the effect envelope, not the face; no stale pixels can escape it.
    c.beginPath(); c.rect(left, top, width, height); c.clip();
    c.translate(this.width / 2, this.offsetY); c.scale(s, s);
    const shake = this.reduced ? 0 : Math.max(0, 1 - this.impactAge / .17) * (this.heavy ? 6 : 3);
    c.translate(Math.sin(this.impactAge * 125 + 1) * shake, Math.cos(this.impactAge * 97) * shake * .55);
    oval(c, 0, 423, 119 - this.impact * 8, 10, "#25281e20");
    c.save();
    const recoil = this.reduced ? 0 : this.kick;
    c.translate(recoil * 1.4, 0); c.rotate(recoil * .006 + (this.ko && !this.reduced ? .09 : 0));
    line(c, [[-28, -15], [-48, 82]], "#68724e", 5); line(c, [[28, -15], [48, 82]], "#68724e", 5);
    c.translate(0, 239);
    const squash = this.reduced ? 0 : this.impact * (this.heavy ? .29 : .21);
    c.transform(1 + squash, 0, -this.direction * squash * .25, 1 - squash * .76, 0, squash * 20);
    c.drawImage(this.bag, -135, -170, 270, 350);
    c.drawImage(this.stickers[this.ko ? 7 : this.reaction], -140, -144, 280, 280);
    c.restore();
    if (this.impactAge < .23 && !this.reduced) {
      const fade = Math.max(0, 1 - this.impactAge / .23);
      c.globalAlpha = fade;
      for (let i = 0; i < (this.lite ? 0 : 6); i++) {
        const a = i * TAU / 6 + .2;
        line(c, [[Math.cos(a) * 149, 232 + Math.sin(a) * 115], [Math.cos(a) * 181, 232 + Math.sin(a) * 145]], INK, this.heavy ? 5 : 3);
      }
      c.globalAlpha = 1;
      c.save(); c.translate(-this.direction * (130 + this.impactAge * 160), 239); c.scale(this.direction, 1);
      c.rotate(-.15);
      if (this.prop) this.drawProp(c, this.prop);
      else c.drawImage(this.glove, -49, -42, 100, 85);
      c.restore();
    }
    for (const p of this.particles) {
      c.globalAlpha = 1 - p.age / p.life; c.fillStyle = p.color;
      c.fillRect(p.x, p.y, p.size, p.size * 1.7);
    }
    c.globalAlpha = 1;
    if (this.impactAge < .38 || this.ko) {
      c.save(); c.translate(this.direction * 50, 114 - Math.min(.38, this.impactAge) * 25); c.rotate(-this.direction * .12);
      c.textAlign = "center"; c.font = `900 italic ${this.heavy ? 53 : 40}px sans-serif`;
      c.lineWidth = 8; c.strokeStyle = "#fff8df";
      const word = this.ko ? "기절ㅋㅋ" : this.heavy ? "빠아악!!" : ["퍽!", "뽁!", "쨥!"][this.reaction % 3];
      c.strokeText(word, 0, 0); c.fillStyle = "#e94d2c"; c.fillText(word, 0, 0); c.restore();
    }
    if (this.event) this.drawEvent(c);
    c.restore();
  }
  drawEvent(c) {
    const age = this.reduced ? .3 : this.eventAge;
    if (this.event === "sneeze") {
      c.save(); c.translate(55 + Math.min(age, .5) * 90, 275);
      c.rotate(age * 2); rounded(c, -20, -20, 40, 37, 3, "#fffbe9");
      line(c, [[-12, -8], [9, 7], [-7, 12]], "#c2bba1", 2); c.restore();
    } else {
      // One tiny spirit sprite. No emitter, no independent timer or physics body.
      c.save(); c.translate(-32, 180 - Math.min(age, .8) * 95); c.globalAlpha = Math.max(0, 1 - age * .7);
      rounded(c, -27, -36, 54, 62, [28, 28, 4, 4], "#faf8e4");
      oval(c, -10, -10, 3, 5, INK); oval(c, 10, -10, 3, 5, INK); oval(c, 0, 8, 5, 7, INK); c.restore();
    }
    c.textAlign = "center"; c.font = "900 22px sans-serif"; c.lineWidth = 5; c.strokeStyle = "#fff8df";
    const text = this.event === "sneeze" ? "에취!! 휴지 좀…" : "영혼 잠깐 외출 중";
    c.strokeText(text, 0, 393); c.fillStyle = INK; c.fillText(text, 0, 393);
  }
  drawProp(c, prop) {
    if (prop === "bread") {
      c.rotate(-.7); rounded(c, -65, -18, 128, 37, 18, "#e7ad55");
      for (const x of [-35, -9, 17, 43]) line(c, [[x, -10], [x - 10, 7]], "#fff1ba", 4);
    } else if (prop === "leek") {
      line(c, [[-55, 25], [21, -8]], "#fffad9", 18);
      for (let i = 0; i < 3; i++) line(c, [[12, -5], [65, -35 + i * 22]], "#5e883f", 11);
    } else {
      oval(c, 0, 0, 21, 40, "#f8d257"); oval(c, 0, -38, 16, 19, "#f8d257");
      oval(c, 5, -42, 3, 4, INK); rounded(c, 10, -33, 22, 12, 5, "#ee6d35");
      line(c, [[-9, 32], [-18, 54]], "#ee6d35", 8); line(c, [[9, 32], [18, 54]], "#ee6d35", 8);
    }
  }
}
