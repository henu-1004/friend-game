import "./style.css";
import {
  MAX_HP,
  COMBO_MS,
  REACTIONS,
  newRound,
  punch,
  expireCombo,
  roundSeconds,
  cropPosition,
} from "./sandbag.js";
import { SandbagRenderer } from "./sandbag-renderer.js";
import { PunchAudio } from "./punch-audio.js";
const audio = new PunchAudio();

const $ = (selector) => document.querySelector(selector);
$("#app").innerHTML = `
<header class="topbar">
  <a class="brand" href="./"><span class="brand-mark" aria-hidden="true">✳</span> 친구 때리기 <small>우정은 무사함</small></a>
  <div class="settings"><button id="sound" class="icon-button" aria-pressed="false">소리 꺼짐</button><button id="motion" class="icon-button" aria-pressed="false">움직임 줄이기</button><a class="classic-link" href="./classic.html">Classic ↗</a></div>
</header>
<main>
  <nav class="mode-hub" aria-label="게임 모드">${[["sandbag", "01", "샌드백"], ["finisher", "02", "필살기"], ["punchout", "03", "펀치아웃"], ["lottery", "04", "무기 뽑기"]].map(([id, n, name]) => `<button data-mode="${id}" aria-pressed="${id === "sandbag"}"><small>${n}</small>${name}</button>`).join("")}</nav>
  <section class="playroom" aria-label="친구 펀치 놀이터">
    <div class="arena-top"><div class="round-label"><b>●</b> <span id="mode-name">샌드백</span> <span id="round-number" data-sandbag>01</span></div><span id="hp-label" data-sandbag>체력 ${MAX_HP} / ${MAX_HP}</span><span id="mode-score" hidden>성공 0</span></div>
    <div id="hp" class="health" data-sandbag role="progressbar" aria-label="샌드백 체력" aria-valuemin="0" aria-valuemax="${MAX_HP}" aria-valuenow="${MAX_HP}"><i></i></div>
    <div class="arena">
      <div class="gym-lettering" aria-hidden="true">친구야<br>미안ㅋㅋ</div>
      <button id="target" class="target" aria-label="샌드백 펀치. 클릭하거나 스페이스 또는 엔터를 누르세요."><canvas id="bag" aria-hidden="true"></canvas></button>
      <div class="combo-box" data-sandbag aria-label="현재 콤보"><small>연속으로 갈겨!</small><strong id="combo">0<span> 콤보</span></strong><div class="combo-clock"><i id="combo-fill"></i></div></div>
      <div id="mode-overlay" hidden><strong id="mode-callout"></strong><div id="mode-meter" class="mode-meter" hidden><span class="sweet-spot"></span><i></i></div><span id="mode-prop" aria-hidden="true"></span></div>
      <div class="arena-help" id="arena-help">얼굴을 톡! <kbd>SPACE</kbd> 도 가능</div>
    </div>
    <div class="punchbar"><div class="punch-copy"><strong id="bag-status">어디 한 번 쳐 보시지.</strong><span id="play-hint">4번째는 묵직하게 · 3콤보부터 눈물샘 개방</span></div><button id="punch" class="punch-button">한 방 날리기 <span>↗</span></button></div>
  </section>
  <div class="toy-shelf">
    <section class="sticker-tray" data-sandbag aria-label="표정 수집"><div class="reactions">${REACTIONS.map((r, i) => `<button class="reaction" data-reaction="${i}" data-unlocked="${i === 0}" aria-label="${r.name}, ${i ? r.unlock + "콤보 달성 후 선택" : "자동 표정"}" aria-pressed="${i === 0}" ${i ? "disabled" : ""}>${r.icon}<small>${i ? r.unlock + "콤보" : "자동"}</small></button>`).join("")}</div><p id="reaction-caption">어디 한 번 쳐 보시지.</p></section>
    <section class="face-tools" aria-label="친구 얼굴"><div class="face-row"><div id="avatar" class="avatar" aria-hidden="true">☺</div><span id="face-name" class="sr-only">연습 친구, 말랑이</span><button id="upload" class="upload-button">＋ 친구 얼굴 붙이기</button><input id="photo" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" tabindex="-1" aria-label="친구 얼굴 사진 선택"></div><div class="photo-options" id="photo-options" hidden><button id="recrop" class="text-button">위치 조절</button><button id="remove-photo" class="text-button">기본 얼굴로</button></div><p id="photo-status" class="local-note" role="status">사진은 이 기기에만. 함께 웃을 친구로!</p></section>
  </div>
  <footer><span>최고 <b id="best">0</b> 콤보 · 오늘 <b id="kos">0</b> KO</span><span id="fps">부드러움 측정 중</span></footer>
</main>
<div id="announcement" class="sr-only" role="status" aria-live="polite"></div>
<dialog id="crop-dialog" aria-labelledby="crop-title"><div class="dialog-top"><span class="eyebrow">얼굴 준비 중</span><button id="cancel-crop" class="close-button" aria-label="얼굴 편집 취소">×</button></div><h2 id="crop-title">동그라미 안에 쏙.</h2><p>얼굴이 가운데 오도록 사진을 드래그해요.<br>아래 슬라이더로도 위치를 조절할 수 있어요.</p><canvas id="crop" class="crop-canvas" width="320" height="320" aria-label="얼굴 자르기 미리보기"></canvas><div class="crop-controls"><label>확대<input id="zoom" type="range" min="1" max="4" step="0.01" value="1"></label><label>가로 위치<input id="crop-x" type="range" min="-480" max="480" value="0"></label><label>세로 위치<input id="crop-y" type="range" min="-480" max="480" value="0"></label></div><button id="save-crop" class="primary" style="width:100%">이 얼굴로 놀기 ↗</button></dialog>
<dialog id="result" class="result-dialog" aria-labelledby="result-title"><div class="eyebrow">웃다가 한 판 끝!</div><div class="ko-symbol" aria-hidden="true">K.O.!</div><h2 id="result-title">얼굴이 퇴근했어요.</h2><p>영혼 복귀까지 0초. 한 판 더?</p><div class="result-stats"><div><strong id="result-hits">0</strong><span>펀치</span></div><div><strong id="result-combo">0</strong><span>최고 콤보</span></div><div><strong id="result-time">0</strong><span>플레이 초</span></div></div><button id="retry" class="primary">한 판 더! ↻</button><button id="save-card" class="secondary">웃긴 순간 사진 저장 ↓</button><p id="save-status" role="status">사진은 저장 버튼을 누를 때만 만들어져요.</p></dialog>
`;

const renderer = new SandbagRenderer($("#bag"));
let state = newRound(),
  rounds = 1,
  kos = 0,
  best = 0,
  forcedReaction = null;
let sound = false,
  resultTimer,
  raf = 0,
  previous = 0,
  frames = [],
  fpsTime = 0;
let activeMode = "sandbag", mini = null, switchVersion = 0, loading = false;
const loopCounts = { sandbag: 0, finisher: 0, punchout: 0, lottery: 0 };
const modeLoaders = {
  finisher: () => import("./modes/finisher.js"),
  punchout: () => import("./modes/punchout.js"),
  lottery: () => import("./modes/lottery.js"),
};
const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
renderer.reduced = reducedQuery.matches;
$("#motion").setAttribute("aria-pressed", String(renderer.reduced));
try {
  best = Math.min(
    99999,
    Math.max(0, Number(localStorage.getItem("sandbag-best")) || 0),
  );
} catch {}
$("#best").textContent = best;
const ui = {
  hp: $("#hp"),
  fill: $("#hp i"),
  label: $("#hp-label"),
  combo: $("#combo"),
  comboFill: $("#combo-fill"),
  caption: $("#reaction-caption"),
  hint: $("#play-hint"),
  status: $("#bag-status"),
  target: $("#target"),
  punch: $("#punch"),
};
function announce(message) {
  $("#announcement").textContent = message;
}
function updateUI() {
  ui.label.textContent = `체력 ${state.hp} / ${MAX_HP}`;
  ui.hp.setAttribute("aria-valuenow", state.hp);
  ui.fill.style.transform = `scaleX(${state.hp / MAX_HP})`;
  ui.combo.firstChild.textContent = state.combo;
  renderer.reaction = forcedReaction ?? state.reaction;
  ui.caption.textContent = REACTIONS[renderer.reaction].caption;
  for (const button of document.querySelectorAll("[data-reaction]")) {
    const i = Number(button.dataset.reaction),
      unlocked = i <= state.unlocked;
    button.disabled = !unlocked;
    button.dataset.unlocked = unlocked;
    const selected = i === (forcedReaction ?? 0);
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected);
  }
  ui.status.textContent =
    state.hp === 0
      ? "KO! 잠깐 웃고 가실게요."
      : state.hits
        ? state.combo >= 10
          ? "얼굴이 점점 퇴근 중ㅋㅋ"
          : "좋아. 반대쪽도 한 대!"
        : "어디 한 번 쳐 보시지.";
  const next = REACTIONS[state.unlocked + 1];
  ui.hint.textContent = state.hp === 0 ? "이번 판 완료 · 바로 다시 도전!"
    : state.unlocked === REACTIONS.length - 1 ? "표정 전부 발견! 친구 얼굴이 바빠졌다"
      : `${next?.unlock ?? 23}콤보에 ${next?.name ?? "별 천지"} · 4번째는 묵직하게`;
  ui.target.disabled = ui.punch.disabled = state.hp === 0;
  $("#upload").disabled = $("#recrop").disabled = state.hp === 0;
}
function playSound(ko = false, heavy = false, event = null, prop = null) {
  if (sound) audio.hit({ ko, heavy, event, prop });
}

function performPunch(direction = state.hits % 2 ? 1 : -1) {
  if ($("#crop-dialog").open || $("#result").open || document.hidden || loading) return;
  if (activeMode !== "sandbag") { mini?.action(); return; }
  const oldUnlock = state.unlocked,
    hit = punch(state, performance.now());
  if (!hit) return;
  updateUI();
  renderer.hit(direction, hit.ko, hit.heavy, hit.event);
  playSound(hit.ko, hit.heavy, hit.event);
  if (hit.event) {
    ui.status.textContent = hit.event === "sneeze" ? "에취!! 콧방울이 탈출했다" : "잠깐, 영혼만 퇴근할게";
    announce(ui.status.textContent);
  }
  if (state.bestCombo > best) {
    best = state.bestCombo;
    $("#best").textContent = best;
  }
  if (state.unlocked > oldUnlock)
    announce(
      `${REACTIONS[state.unlocked].name} 표정 발견! ${state.combo} 콤보`,
    );
  if (hit.ko) {
    kos++;
    $("#kos").textContent = kos;
    try {
      localStorage.setItem("sandbag-best", String(best));
    } catch {}
    $("#result-hits").textContent = state.hits;
    $("#result-combo").textContent = state.bestCombo;
    $("#result-time").textContent = roundSeconds(state).toFixed(1);
    announce(
      `KO! ${state.hits}번 펀치, 최고 ${state.bestCombo} 콤보. 한 판 더 도전해요.`,
    );
    resultTimer = setTimeout(() => {
      if (activeMode !== "sandbag") return;
      $("#result").showModal();
      $("#retry").focus();
    }, 900);
  }
}
ui.target.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || !renderer.hitTest(event.clientX, event.clientY))
    return;
  event.preventDefault();
  ui.target.focus({ preventScroll: true });
  performPunch(
    event.clientX <
      renderer.canvas.getBoundingClientRect().left + renderer.width / 2
      ? -1
      : 1,
  );
});
ui.target.addEventListener("click", (event) => {
  if (event.detail === 0) performPunch();
});
ui.punch.onclick = () => performPunch();
for (const button of [ui.target, ui.punch])
  button.addEventListener("keydown", (event) => {
    if (event.repeat && [" ", "Enter"].includes(event.key))
      event.preventDefault();
  });
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "Space" ||
    event.repeat ||
    /INPUT|BUTTON|A|TEXTAREA|SELECT/.test(event.target.tagName) ||
    $("#crop-dialog").open ||
    $("#result").open
  )
    return;
  event.preventDefault();
  performPunch();
});
$("#retry").onclick = () => {
  clearTimeout(resultTimer);
  $("#result").close();
  state = newRound();
  forcedReaction = null;
  rounds++;
  $("#round-number").textContent = String(rounds).padStart(2, "0");
  renderer.reset();
  updateUI();
  ui.comboFill.style.transform = "scaleX(0)";
  $("#save-status").textContent = "사진은 저장 버튼을 누를 때만 만들어져요.";
  ui.punch.focus({ preventScroll: true });
  announce("새 샌드백 준비 완료!");
};
$("#result").addEventListener("cancel", (event) => {
  event.preventDefault();
  $("#retry").click();
});
for (const button of document.querySelectorAll("[data-reaction]"))
  button.onclick = () => {
    const i = Number(button.dataset.reaction);
    forcedReaction = i === 0 ? null : i;
    updateUI();
    renderer.draw();
  };
$("#sound").onclick = () => {
  sound = !sound;
  $("#sound").textContent = sound ? "소리 켜짐" : "소리 꺼짐";
  $("#sound").setAttribute("aria-pressed", sound);
  if (sound) { audio.unlock(); playSound(false); }
  else audio.stop();
};
$("#motion").onclick = () => {
  renderer.reduced = !renderer.reduced;
  mini?.setReduced(renderer.reduced);
  $("#motion").setAttribute("aria-pressed", renderer.reduced);
};
reducedQuery.addEventListener("change", (event) => {
  renderer.reduced = event.matches;
  mini?.setReduced(renderer.reduced);
  $("#motion").setAttribute("aria-pressed", renderer.reduced);
});
new ResizeObserver(() => { renderer.resize(); renderer.draw(); }).observe(renderer.canvas);
function frame(now) {
  raf = 0;
  if (document.hidden || loading) return;
  const elapsed = previous ? now - previous : 16.67;
  previous = now;
  const dt = Math.min(elapsed / 1000, .033);
  loopCounts[activeMode]++;
  if (!$("#crop-dialog").open && !$("#result").open) {
    if (activeMode === "sandbag") {
      if (state.hp > 0 && expireCombo(state, now)) {
        ui.comboFill.style.transform = "scaleX(0)";
        ui.combo.firstChild.textContent = 0;
        ui.hint.textContent = "숨 한 번 쉬고… 다시 갈겨!";
      }
      if (state.combo && state.hp > 0)
        ui.comboFill.style.transform = `scaleX(${Math.max(0, 1 - (now - state.lastHit) / COMBO_MS)})`;
    } else mini?.frame(dt);
    renderer.frame(dt);
  }
  frames.push(elapsed);
  if (frames.length > 180) frames.shift();
  if (now - fpsTime > 1000) {
    fpsTime = now;
    const observedFps = 1000 / (frames.reduce((a, b) => a + b, 0) / frames.length);
    // Keep scheduling at display cadence; shed pixels and cosmetics on a slow device.
    if (frames.length >= 45 && observedFps < 57) renderer.reduceEffects();
    $("#fps").textContent = `${Math.round(observedFps)} FPS`;
  }
  raf = requestAnimationFrame(frame);
}
function startLoop() {
  cancelAnimationFrame(raf); raf = 0; previous = 0;
  if (!document.hidden && !loading) raf = requestAnimationFrame(frame);
}
const modeHost = {
  show({ status, hint, button, callout = "", score = "", meter = false, prop = "" }) {
    ui.status.textContent = status; ui.hint.textContent = hint;
    ui.punch.textContent = button; $("#mode-callout").textContent = callout;
    $("#mode-score").textContent = score;
    $("#mode-meter").hidden = !meter; $("#mode-prop").textContent = prop;
    announce(status);
  },
  meter(value) { $("#mode-meter i").style.transform = `translateX(${value * 244}px)`; },
  impact({ heavy = false, ko = false, reaction = 3, event = null, prop = null } = {}) {
    renderer.reaction = reaction;
    renderer.hit(Math.random() < .5 ? -1 : 1, ko, heavy, event, prop);
    playSound(ko, heavy, event, prop);
  },
  reset() { renderer.reset(); },
  pose(value) { $("#mode-overlay").dataset.pose = value; },
};
async function selectMode(id) {
  if (id === activeMode && !loading) return;
  const version = ++switchVersion;
  loading = true; cancelAnimationFrame(raf); raf = 0;
  clearTimeout(resultTimer); audio.stop(); mini?.dispose(); mini = null;
  $("#result").close(); renderer.reset();
  activeMode = id;
  $("#mode-meter").hidden = true; $("#mode-callout").textContent = ""; $("#mode-prop").textContent = "";
  $("#mode-overlay").dataset.pose = "";
  document.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === id));
  document.querySelectorAll("[data-sandbag]").forEach(el => { el.hidden = id !== "sandbag"; });
  $("#mode-overlay").hidden = $("#mode-score").hidden = id === "sandbag";
  ui.target.disabled = ui.punch.disabled = true;
  ui.status.textContent = "장난감 꺼내는 중…";
  try {
    const module = id === "sandbag" ? null : await modeLoaders[id]();
    if (version !== switchVersion) return;
    loading = false;
    ui.target.disabled = ui.punch.disabled = false;
    $("#upload").disabled = $("#recrop").disabled = false;
    $("#mode-name").textContent = { sandbag: "샌드백", finisher: "필살기", punchout: "펀치아웃", lottery: "무기 뽑기" }[id];
    ui.target.setAttribute("aria-label", id === "sandbag" ? "샌드백 펀치. 클릭하거나 스페이스 또는 엔터를 누르세요." : "모드 액션. 클릭하거나 스페이스 또는 엔터를 누르세요.");
    $("#arena-help").textContent = id === "sandbag" ? "얼굴을 톡! SPACE 도 가능" : "얼굴 또는 아래 버튼 · SPACE 도 가능";
    if (module) { mini = module.createMode(modeHost); mini.setReduced(renderer.reduced); }
    else {
      ui.punch.innerHTML = "한 방 날리기 <span>↗</span>";
      updateUI(); renderer.ko = state.hp === 0;
      if (!state.hp) $("#result").showModal();
    }
    renderer.draw(); startLoop();
  } catch (error) {
    if (version !== switchVersion) return;
    activeMode = "failed"; loading = false;
    await selectMode("sandbag");
    ui.hint.textContent = "장난감을 못 불러왔어요. 다시 눌러 주세요.";
  }
}
for (const button of document.querySelectorAll("[data-mode]")) button.onclick = () => selectMode(button.dataset.mode);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(raf); raf = 0; audio.stop(); frames = [];
    state.combo = 0; ui.combo.firstChild.textContent = 0; ui.comboFill.style.transform = "scaleX(0)";
    mini?.suspend();
  } else startLoop();
});
// Read-only diagnostics for reproducible lifecycle/cache/performance assertions.
window.__toyDebug = () => ({ activeMode, loading, scheduledLoops: raf ? 1 : 0,
  loopCounts: { ...loopCounts }, particles: renderer.particles.length,
  renderer: { ...renderer.stats, quality: renderer.lite ? "lite" : "full", dpr: renderer.dpr }, freezeMs: renderer.freeze * 1000,
  audioVoices: audio.voices.size, mode: mini?.snapshot() ?? null });
updateUI(); startLoop();

// Photos stay in memory. The source is bounded once; every game frame uses a 320px crop.
let source = null,
  candidate = null,
  cropOffset = { x: 0, y: 0 },
  cropZoom = 1,
  drag = null,
  photoVersion = 0;
const cropCanvas = $("#crop"),
  cropCtx = cropCanvas.getContext("2d");
const cropDialog = $("#crop-dialog");
function cropRect() {
  return cropPosition(
    candidate.width,
    candidate.height,
    cropZoom,
    cropOffset.x,
    cropOffset.y,
  );
}
function paintCrop() {
  if (!candidate) return;
  const rect = cropRect();
  cropCtx.clearRect(0, 0, 320, 320);
  cropCtx.drawImage(candidate, rect.x, rect.y, rect.w, rect.h);
  cropCtx.strokeStyle = "#ffffff90";
  cropCtx.lineWidth = 1;
  cropCtx.setLineDash([4, 4]);
  cropCtx.beginPath();
  cropCtx.moveTo(160, 0);
  cropCtx.lineTo(160, 320);
  cropCtx.moveTo(0, 160);
  cropCtx.lineTo(320, 160);
  cropCtx.stroke();
  cropCtx.setLineDash([]);
}
function syncCropControls() {
  const scale =
    Math.max(320 / candidate.width, 320 / candidate.height) * cropZoom;
  for (const [axis, length] of [
    ["x", candidate.width],
    ["y", candidate.height],
  ]) {
    const limit = Math.max(0, (length * scale - 320) / 2);
    cropOffset[axis] = Math.max(-limit, Math.min(limit, cropOffset[axis]));
    $(`#crop-${axis}`).min = -limit;
    $(`#crop-${axis}`).max = limit;
    $(`#crop-${axis}`).value = cropOffset[axis];
  }
}
function openCrop(image) {
  candidate = image;
  cropOffset = { x: 0, y: 0 };
  cropZoom = 1;
  $("#zoom").value = 1;
  syncCropControls();
  paintCrop();
  cropDialog.showModal();
}
$("#upload").onclick = () => $("#photo").click();
$("#photo").onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const version = ++photoVersion;
  $("#photo").value = "";
  if (
    !/^image\/(jpeg|png|webp|avif|gif)$/.test(file.type) ||
    file.size > 12 * 1024 * 1024
  ) {
    $("#photo-status").textContent =
      "12MB 이하의 JPG, PNG, WebP, AVIF, GIF 사진을 골라 주세요.";
    return;
  }
  $("#photo-status").textContent = "사진을 준비하고 있어요…";
  $("#upload").disabled = true;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (version !== photoVersion || (activeMode === "sandbag" && state.hp === 0)) {
      $("#photo-status").textContent = "한 판 더 시작한 뒤 사진을 골라 주세요.";
      return;
    }
    if (img.naturalWidth * img.naturalHeight > 40_000_000)
      throw new Error("large");
    const bounded = document.createElement("canvas"),
      scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    bounded.width = Math.max(1, Math.round(img.naturalWidth * scale));
    bounded.height = Math.max(1, Math.round(img.naturalHeight * scale));
    bounded
      .getContext("2d")
      .drawImage(img, 0, 0, bounded.width, bounded.height);
    openCrop(bounded);
    $("#photo-status").textContent =
      "위치를 맞추고 이 얼굴로 놀기를 눌러 주세요.";
  } catch {
    $("#photo-status").textContent =
      "사진을 열 수 없어요. 4천만 화소 이하의 다른 사진으로 다시 시도해 주세요.";
  } finally {
    URL.revokeObjectURL(url);
    $("#upload").disabled = activeMode === "sandbag" && state.hp === 0;
  }
};
$("#zoom").oninput = (event) => {
  cropZoom = Number(event.target.value);
  syncCropControls();
  paintCrop();
};
for (const axis of ["x", "y"])
  $(`#crop-${axis}`).oninput = (event) => {
    cropOffset[axis] = Number(event.target.value);
    paintCrop();
  };
cropCanvas.onpointerdown = (event) => {
  if (event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
  cropCanvas.setPointerCapture(event.pointerId);
};
cropCanvas.onpointermove = (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  const ratio = 320 / cropCanvas.getBoundingClientRect().width;
  cropOffset.x += (event.clientX - drag.x) * ratio;
  cropOffset.y += (event.clientY - drag.y) * ratio;
  drag.x = event.clientX;
  drag.y = event.clientY;
  syncCropControls();
  paintCrop();
};
cropCanvas.onpointerup =
  cropCanvas.onpointercancel =
  cropCanvas.onlostpointercapture =
    () => {
      drag = null;
    };
$("#save-crop").onclick = () => {
  if (!candidate) return;
  const face = document.createElement("canvas");
  face.width = face.height = 320;
  const r = cropRect();
  face.getContext("2d").drawImage(candidate, r.x, r.y, r.w, r.h);
  source = candidate;
  renderer.face = face;
  const avatar = new Image();
  avatar.src = face.toDataURL("image/png");
  avatar.alt = "";
  $("#avatar").replaceChildren(avatar);
  $("#face-name").textContent = "오늘의 말랑한 친구";
  $("#photo-options").hidden = false;
  cropDialog.close();
  renderer.draw();
  announce("친구 얼굴 준비 완료. 샌드백을 톡 눌러 보세요.");
};
$("#cancel-crop").onclick = () => cropDialog.close();
cropDialog.addEventListener("close", () => {
  candidate = null;
  drag = null;
  $("#photo-status").textContent = renderer.face
    ? "얼굴 준비 완료! 사진은 서버로 전송되지 않아요."
    : "사진 없이도 바로 놀 수 있어요. 사진은 이 기기 안에서만 사용해요.";
});
$("#recrop").onclick = () => {
  if (source) openCrop(source);
};
$("#remove-photo").onclick = () => {
  photoVersion++;
  source = null;
  renderer.face = null;
  $("#avatar").textContent = "☺";
  $("#face-name").textContent = "연습 친구, 말랑이";
  $("#photo-options").hidden = true;
  $("#photo-status").textContent =
    "기본 얼굴로 돌아왔어요. 사진은 이 기기 안에서만 사용해요.";
  renderer.draw();
};
$("#save-card").onclick = () => {
  const card = document.createElement("canvas");
  card.width = 720;
  card.height = 800;
  const c = card.getContext("2d");
  c.fillStyle = "#f5f2e9";
  c.fillRect(0, 0, 720, 800);
  c.fillStyle = "#262720";
  c.textAlign = "center";
  c.font = "900 24px sans-serif";
  c.fillText("FRIENDSMASH / 친구 샌드백", 360, 61);
  c.font = "900 47px sans-serif";
  c.fillText("툭 치면, 빵 터진다.", 360, 123);
  renderer.draw();
  // Center-crop the stage so the friend's face stays large on the souvenir.
  const sourceWidth = Math.min(
    renderer.canvas.width,
    renderer.canvas.height * 1.25,
  );
  const ratio = Math.min(620 / sourceWidth, 500 / renderer.canvas.height);
  const w = sourceWidth * ratio,
    h = renderer.canvas.height * ratio;
  c.drawImage(
    renderer.canvas,
    (renderer.canvas.width - sourceWidth) / 2,
    0,
    sourceWidth,
    renderer.canvas.height,
    (720 - w) / 2,
    151 + (500 - h) / 2,
    w,
    h,
  );
  c.fillStyle = "#f86236";
  c.font = "900 31px sans-serif";
  c.fillText(`${state.hits} 펀치  ·  최고 ${state.bestCombo} 콤보`, 360, 704);
  c.fillStyle = "#73766b";
  c.font = "18px sans-serif";
  c.fillText("장난은 가볍게. 친구는 소중하게.", 360, 752);
  card.toBlob((blob) => {
    if (!blob) {
      $("#save-status").textContent =
        "사진을 만들지 못했어요. 다시 눌러 주세요.";
      return;
    }
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "friend-sandbag-ko.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    $("#save-status").textContent =
      "사진 저장을 요청했어요. 다운로드를 확인해 주세요.";
  }, "image/png");
};
