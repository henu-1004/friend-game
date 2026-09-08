const TAU = Math.PI * 2;
const ink = "#293020";
function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}
function star(ctx, x, y, radius, color, angle = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = angle + (i * Math.PI) / 5 - Math.PI / 2,
      r = i % 2 ? radius * 0.45 : radius;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.stroke();
}
export class SandbagRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.face = null;
    this.particles = [];
    this.kick = 0;
    this.velocity = 0;
    this.impact = 0;
    this.impactAge = 10;
    this.direction = 1;
    this.ko = false;
    this.reaction = 0;
    this.reduced = false;
    this.time = 0;
    this.width = 700;
    this.height = 410;
    this.resize();
  }
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      1.5,
      Math.sqrt(1000000 / (this.width * this.height)),
    );
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.dpr = dpr;
    this.scale = this.height / 440;
  }
  hitTest(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const x = (clientX - r.left - this.width / 2) / this.scale;
    const y = (clientY - r.top) / this.scale;
    return Math.abs(x) < 140 && y > 100 && y < 375;
  }
  hit(direction, ko) {
    this.direction = direction;
    this.impact = 1;
    this.impactAge = 0;
    this.velocity = direction * 140;
    this.ko = ko;
    const count = this.reduced ? 4 : ko ? 26 : 9;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU;
      this.particles.push({
        x: direction * 40,
        y: 215,
        vx: Math.cos(angle) * (80 + Math.random() * 190),
        vy: Math.sin(angle) * 190 - 40,
        life: 0.5 + Math.random() * 0.3,
        age: 0,
        color: ["#f86236", "#b6cc6b", "#f6c852", "#f9f7ed"][i % 4],
        size: 3 + Math.random() * 5,
      });
    }
    if (this.particles.length > 48)
      this.particles.splice(0, this.particles.length - 48);
  }
  reset() {
    this.ko = false;
    this.kick = 0;
    this.velocity = 0;
    this.impact = 0;
    this.impactAge = 10;
    this.particles.length = 0;
    this.reaction = 0;
  }
  frame(dt) {
    this.time += dt;
    this.impactAge += dt;
    this.impact = Math.max(0, this.impact - dt * 4.8);
    this.velocity += (-this.kick * 100 - this.velocity * 10) * dt;
    this.kick += this.velocity * dt;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age > p.life) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += dt * 360;
    }
    this.draw();
  }
  draw() {
    const c = this.ctx,
      w = this.width,
      h = this.height,
      s = this.scale;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = "#eceee4";
    c.fillRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, 0);
    c.scale(s, s);
    // Static gym marks: simple paths keep the entire scene cheap to redraw.
    c.strokeStyle = "#dce0d2";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-w / s, 352);
    c.lineTo(w / s, 352);
    c.stroke();
    oval(c, 0, 386, 142, 23, "#dce1d0");
    c.strokeStyle = "#cbd2bb";
    c.beginPath();
    c.ellipse(0, 386, 178, 32, 0, 0, TAU);
    c.stroke();
    c.setLineDash([4, 7]);
    c.beginPath();
    c.ellipse(0, 386, 151, 26, 0, 0, TAU);
    c.stroke();
    c.setLineDash([]);
    c.save();
    const sway = this.reduced
      ? 0
      : Math.sin(this.time * 1.6) * 0.012 + this.kick * 0.006;
    c.translate(0, 4);
    c.rotate(sway + (this.ko && !this.reduced ? 0.12 : 0));
    c.strokeStyle = "#707962";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(-30, -10);
    c.lineTo(-46, 107);
    c.moveTo(30, -10);
    c.lineTo(46, 107);
    c.stroke();
    c.strokeStyle = "#b4bda3";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-32, -10);
    c.lineTo(-48, 107);
    c.moveTo(28, -10);
    c.lineTo(44, 107);
    c.stroke();
    c.translate(0, 229);
    const squash = this.reduced ? 0 : this.impact * 0.15;
    c.scale(1 + squash, 1 - squash);
    // One affine squash of the bag and photo. Stickers are separate flat paths.
    c.fillStyle = "#b6c98a";
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.beginPath();
    c.roundRect(-106, -129, 212, 269, [42, 42, 55, 55]);
    c.fill();
    c.stroke();
    c.save();
    c.beginPath();
    c.roundRect(-104, -127, 208, 265, [40, 40, 53, 53]);
    c.clip();
    c.fillStyle = "#a0b874";
    c.fillRect(78, -140, 36, 290);
    c.fillStyle = "#c5d699";
    c.fillRect(-99, -130, 16, 290);
    c.fillStyle = "#586944";
    c.fillRect(-110, -127, 220, 29);
    c.fillRect(-110, 95, 220, 48);
    c.restore();
    c.strokeStyle = "#eef3db";
    c.lineWidth = 1;
    c.setLineDash([3, 5]);
    c.beginPath();
    c.moveTo(-91, -86);
    c.lineTo(-91, 88);
    c.moveTo(91, -86);
    c.lineTo(91, 88);
    c.moveTo(-83, 107);
    c.lineTo(83, 107);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#f5edda";
    c.save();
    c.rotate(-0.035);
    c.fillRect(-39, 111, 78, 17);
    c.fillStyle = "#586944";
    c.font = "bold 9px sans-serif";
    c.textAlign = "center";
    c.fillText("FRIEND / 001", 0, 123);
    c.restore();
    oval(c, 0, -5, 91, 91, ink);
    oval(c, 0, -7, 87, 87, "#f6d274");
    c.save();
    c.beginPath();
    c.arc(0, -7, 84, 0, TAU);
    c.clip();
    if (this.face) c.drawImage(this.face, -84, -91, 168, 168);
    else {
      oval(c, 0, -7, 84, 84, "#f7d77a");
      oval(c, -57, 15, 14, 9, "#ecab68");
      oval(c, 57, 15, 14, 9, "#ecab68");
      oval(c, -29, -19, 7, 13, ink);
      oval(c, 29, -19, 7, 13, ink);
      c.strokeStyle = ink;
      c.lineWidth = 5;
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 0, 36, 0.17, Math.PI - 0.17);
      c.stroke();
      c.beginPath();
      c.moveTo(-40, -42);
      c.lineTo(-22, -45);
      c.moveTo(22, -45);
      c.lineTo(40, -42);
      c.stroke();
    }
    c.restore();
    this.drawSticker(c);
    c.restore();
    for (const p of this.particles) {
      c.globalAlpha = 1 - p.age / p.life;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.age * 5);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      c.restore();
    }
    c.globalAlpha = 1;
    if (this.impactAge < 0.35 && !this.ko) {
      c.save();
      c.translate(this.direction * 105, 169 - this.impactAge * 35);
      c.rotate(this.direction * 0.15);
      c.font = "900 36px sans-serif";
      c.textAlign = "center";
      c.lineWidth = 6;
      c.strokeStyle = "#f5f2e9";
      const word =
        this.reaction >= 2 ? "빠샤!" : this.reaction === 1 ? "팡!" : "툭!";
      c.strokeText(word, 0, 0);
      c.fillStyle = "#ed592f";
      c.fillText(word, 0, 0);
      c.restore();
    }
    if (this.ko) {
      star(c, -126, 163, 23, "#f7c956", -0.3);
      star(c, 134, 249, 18, "#f86236", 0.3);
      c.save();
      c.translate(72, 111);
      c.rotate(0.13);
      c.fillStyle = "#f86236";
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(-51, -24, 102, 45, 6);
      c.fill();
      c.stroke();
      c.font = "900 italic 28px sans-serif";
      c.fillStyle = "#fff6df";
      c.textAlign = "center";
      c.fillText("K.O.!", 0, 9);
      c.restore();
    }
    c.restore();
  }
  drawSticker(c) {
    c.strokeStyle = ink;
    c.lineWidth = 4;
    c.lineCap = "round";
    const mode = this.ko ? 2 : this.reaction;
    if (mode === 1) {
      star(c, -31, -21, 24, "#fff29a", -0.12);
      star(c, 31, -21, 24, "#fff29a", 0.12);
      star(c, 81, -84, 16, "#f7c956", 0.2);
    } else if (mode === 2) {
      for (const x of [-31, 31]) {
        oval(c, x, -20, 26, 27, "#fff8e6");
        c.strokeStyle = "#534f8a";
        c.lineWidth = 3;
        c.beginPath();
        for (let i = 0; i <= 60; i++) {
          const a = (i / 60) * TAU * 2.4,
            r = 1 + (i / 60) * 21;
          c.lineTo(x + Math.cos(a) * r, -20 + Math.sin(a) * r);
        }
        c.stroke();
      }
      oval(c, 0, 31, 14, 20, ink);
      oval(c, 3, 43, 9, 6, "#f49a8c");
    } else if (mode === 3) {
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(0, 18);
      c.bezierCurveTo(-20, -1, -27, 45, -59, 13);
      c.bezierCurveTo(-58, 52, -18, 48, 0, 30);
      c.bezierCurveTo(18, 48, 58, 52, 59, 13);
      c.bezierCurveTo(27, 45, 20, -1, 0, 18);
      c.fill();
      c.strokeStyle = "#fdf6dd";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(30, -22, 24, 0, TAU);
      c.stroke();
      c.strokeStyle = "#7d6952";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(51, -7);
      c.quadraticCurveTo(78, 22, 61, 56);
      c.stroke();
    }
  }
}
