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

const $ = (selector) => document.querySelector(selector);
$("#app").innerHTML = `
<header class="topbar">
  <a class="brand" href="./"><span class="brand-mark" aria-hidden="true">✳</span> friend<span>smash</span></a>
  <nav aria-label="게임 모드"><a class="nav-link active" href="./" aria-current="page">샌드백</a><a class="nav-link" href="./classic.html">Classic ↗</a></nav>
  <span class="edition">작은 장난, 큰 웃음.</span>
</header>
<main>
  <section class="intro"><div><div class="eyebrow"><span class="dot"></span> 우정 테스트 말고, 펀치 테스트</div><h1>툭 치면, <span>빵 터진다.</span></h1><p>친구 얼굴을 붙이고 톡톡. 오늘의 스트레스를 말랑하게 날려요.</p></div><div class="intro-note">준비는 5초면 충분해요.<br>사진 없이도 바로 한 판!</div></section>
  <div class="game-layout">
    <section aria-label="샌드백 놀이터">
      <div class="playroom">
        <div class="arena-top"><div class="round-label"><b>●</b> 샌드백 <span id="round-number">01</span></div><div class="settings"><button id="sound" class="icon-button" aria-pressed="false">소리 꺼짐</button><button id="motion" class="icon-button" aria-pressed="false">움직임 줄이기</button></div></div>
        <div class="health-row"><strong id="bag-status">말랑이, 준비 완료!</strong><span id="hp-label">체력 ${MAX_HP} / ${MAX_HP}</span></div>
        <div id="hp" class="health" role="progressbar" aria-label="샌드백 체력" aria-valuemin="0" aria-valuemax="${MAX_HP}" aria-valuenow="${MAX_HP}"><i></i></div>
        <div class="arena">
          <button id="target" class="target" aria-label="샌드백 펀치. 클릭하거나 스페이스 또는 엔터를 누르세요."><canvas id="bag" aria-hidden="true"></canvas></button>
          <div class="side-stamp">얼굴은 말랑 · 우정은 단단</div>
          <div class="combo-box" aria-label="현재 콤보"><small>연속 펀치</small><strong id="combo">0<span> 콤보</span></strong><div class="combo-clock"><i id="combo-fill"></i></div></div>
          <div class="arena-help" id="arena-help">얼굴을 톡! 또는 <kbd>SPACE</kbd> 로 펀치</div>
        </div>
        <div class="punchbar"><button id="punch" class="punch-button">한 방 날리기 <span>↗</span></button><p>빠르게 이으면 콤보!<br>콤보가 쌓일수록 더 우스워져요.</p></div>
      </div>
      <div class="below-arena"><span><span class="dot"></span> <b id="play-hint">연속 3번이면 첫 표정 등장</b></span><span id="fps">부드러움 측정 중</span></div>
    </section>
    <aside aria-label="얼굴과 플레이 기록">
      <section class="panel face-panel"><div class="panel-heading"><h2>오늘의 주인공</h2><span class="step-number">01 / 얼굴</span></div><div class="face-content"><div class="face-row"><div id="avatar" class="avatar" aria-hidden="true">☺</div><div><strong id="face-name">연습 친구, 말랑이</strong><p>준비됐어? 난 말랑해.</p></div></div><div><button id="upload" class="upload-button">＋ 친구 얼굴 붙이기</button><input id="photo" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" tabindex="-1" aria-label="친구 얼굴 사진 선택"><div class="photo-options" id="photo-options" hidden><button id="recrop" class="text-button">위치 조절</button><button id="remove-photo" class="text-button">기본 얼굴로</button></div></div><p id="photo-status" class="local-note" role="status">사진은 이 기기 안에서만 사용해요.<br>함께 웃을 수 있는 사진으로 골라 주세요.</p></div></section>
      <section class="panel"><div class="panel-heading"><h2>표정 수집</h2><span class="step-number">02 / 리액션</span></div><div class="reactions">${["☺", "✦", "◎", "〰"].map((icon, i) => `<button class="reaction" data-reaction="${i}" data-unlocked="${i === 0}" aria-label="${REACTIONS[i].name}, ${i ? REACTIONS[i].unlock + "콤보 달성 후 선택" : "자동 표정"}" aria-pressed="${i === 0}" ${i ? "disabled" : ""}>${icon}<small>${i ? REACTIONS[i].unlock + " 콤보" : "자동"}</small></button>`).join("")}</div><p id="reaction-caption" class="reaction-caption">어? 방금 뭐 지나갔어?</p><p class="reaction-hint">콤보로 열고, 눌러서 붙여요.<br>사진 위에 우스운 표정이 착!</p></section>
      <section class="panel session"><div class="panel-heading"><h2>나의 작은 기록</h2><span class="step-number">03 / 한 판 더</span></div><div class="session-stats"><div><strong id="best">0</strong><small>최고 연속 콤보</small></div><div><strong id="kos">0</strong><small>오늘의 KO · 이번 접속</small></div></div><p>잘 때리는 것보다, 웃기는 게 우선.<br>KO 뒤에도 얼굴은 그대로, 바로 한 판 더!</p></section>
    </aside>
  </div>
  <div class="steps"><p><b>01</b> 얼굴을 붙여요 <span>· 선택</span></p><p><b>02</b> 톡톡 치고 콤보를 이어요</p><p><b>03</b> 웃긴 얼굴로 KO, 한 판 더!</p></div>
  <footer><strong>FRIENDSMASH / 샌드백 클럽</strong><span>장난은 가볍게. 친구는 소중하게.</span></footer>
</main>
<div id="announcement" class="sr-only" role="status" aria-live="polite"></div>
<dialog id="crop-dialog" aria-labelledby="crop-title"><div class="dialog-top"><span class="eyebrow">얼굴 준비 중</span><button id="cancel-crop" class="close-button" aria-label="얼굴 편집 취소">×</button></div><h2 id="crop-title">동그라미 안에 쏙.</h2><p>얼굴이 가운데 오도록 사진을 드래그해요.<br>아래 슬라이더로도 위치를 조절할 수 있어요.</p><canvas id="crop" class="crop-canvas" width="320" height="320" aria-label="얼굴 자르기 미리보기"></canvas><div class="crop-controls"><label>확대<input id="zoom" type="range" min="1" max="4" step="0.01" value="1"></label><label>가로 위치<input id="crop-x" type="range" min="-480" max="480" value="0"></label><label>세로 위치<input id="crop-y" type="range" min="-480" max="480" value="0"></label></div><button id="save-crop" class="primary" style="width:100%">이 얼굴로 놀기 ↗</button></dialog>
<dialog id="result" class="result-dialog" aria-labelledby="result-title"><div class="eyebrow">오늘도 사이좋게 한 판 끝!</div><div class="ko-symbol" aria-hidden="true">K.O.!</div><h2 id="result-title">우정은 끄떡없지?</h2><p>말랑한 샌드백은 벌써 다음 판 준비 중.</p><div class="result-stats"><div><strong id="result-hits">0</strong><span>펀치</span></div><div><strong id="result-combo">0</strong><span>최고 콤보</span></div><div><strong id="result-time">0</strong><span>플레이 초</span></div></div><button id="retry" class="primary">한 판 더! ↻</button><button id="save-card" class="secondary">웃긴 순간 사진 저장 ↓</button><p id="save-status" role="status">사진은 저장 버튼을 누를 때만 만들어져요.</p></dialog>
`;

const renderer = new SandbagRenderer($("#bag"));
let state = newRound(),
  rounds = 1,
  kos = 0,
  best = 0,
  forcedReaction = null;
let sound = false,
  audioContext,
  resultTimer,
  raf = 0,
  previous = 0,
  frames = [],
  fpsTime = 0;
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
          ? "콤보 폭발! 우정은 안전해요."
          : "좋아, 한 번 더 톡!"
        : "말랑이, 준비 완료!";
  ui.hint.textContent =
    state.hp === 0
      ? "이번 판 완료 · 바로 다시 도전!"
      : state.combo >= 10
        ? "표정 모두 발견! 콤보를 이어 보세요"
        : state.combo >= 6
          ? "10콤보면 콧수염이 짠!"
          : state.combo >= 3
            ? "6콤보면 눈이 빙글빙글"
            : "연속 3번이면 첫 표정 등장";
  ui.target.disabled = ui.punch.disabled = state.hp === 0;
  $("#upload").disabled = $("#recrop").disabled = state.hp === 0;
}
function playSound(ko) {
  if (!sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended")
      audioContext.resume().catch(() => {});
    const osc = audioContext.createOscillator(),
      gain = audioContext.createGain(),
      t = audioContext.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(ko ? 440 : 155 + state.combo * 3, t);
    osc.frequency.exponentialRampToValueAtTime(ko ? 90 : 45, t + 0.13);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    sound = false;
    $("#sound").textContent = "소리 사용 불가";
    $("#sound").setAttribute("aria-pressed", "false");
  }
}
function performPunch(direction = state.hits % 2 ? 1 : -1) {
  if ($("#crop-dialog").open || $("#result").open || document.hidden) return;
  const oldUnlock = state.unlocked,
    hit = punch(state, performance.now());
  if (!hit) return;
  renderer.hit(direction, hit.ko);
  playSound(hit.ko);
  updateUI();
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
      $("#result").showModal();
      $("#retry").focus();
    }, 650);
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
  if (sound) playSound(false);
};
$("#motion").onclick = () => {
  renderer.reduced = !renderer.reduced;
  $("#motion").setAttribute("aria-pressed", renderer.reduced);
};
reducedQuery.addEventListener("change", (event) => {
  renderer.reduced = event.matches;
  $("#motion").setAttribute("aria-pressed", renderer.reduced);
});
new ResizeObserver(() => {
  renderer.resize();
  renderer.draw();
}).observe(renderer.canvas);
function frame(now) {
  const elapsed = previous ? now - previous : 16.67;
  previous = now;
  if (state.hp > 0 && expireCombo(state, now)) {
    ui.combo.firstChild.textContent = 0;
    ui.hint.textContent = "잠깐 쉬었네요. 다시 톡톡, 콤보 시작!";
  }
  renderer.frame(Math.min(elapsed / 1000, 0.033));
  if (state.combo && state.hp > 0)
    ui.comboFill.style.transform = `scaleX(${Math.max(0, 1 - (now - state.lastHit) / COMBO_MS)})`;
  else ui.comboFill.style.transform = "scaleX(0)";
  frames.push(elapsed);
  if (frames.length > 180) frames.shift();
  if (now - fpsTime > 1000) {
    fpsTime = now;
    const fps = Math.round(
      1000 / (frames.reduce((a, b) => a + b, 0) / frames.length),
    );
    $("#fps").textContent = `${fps} FPS · 가볍게 톡톡`;
  }
  raf = requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange", () => {
  cancelAnimationFrame(raf);
  previous = 0;
  frames = [];
  // Background time never keeps a combo alive; the round remains available on return.
  if (document.hidden) {
    if (state.hp > 0) {
      state.combo = 0;
      ui.combo.firstChild.textContent = 0;
    }
  } else raf = requestAnimationFrame(frame);
});
updateUI();
raf = requestAnimationFrame(frame);

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
    if (version !== photoVersion || state.hp === 0) {
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
    $("#upload").disabled = state.hp === 0;
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
