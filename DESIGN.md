# 친구 때리기 — densify pass

2026-09-08 · Sandbag first, light toy hub · supersedes the previous Sandbag-only slice boundary

## Play surface and hit feel

The first screen is the toy. A narrow Korean mode bar sits above a large bag; the photo picker and reaction shelf sit below it. There is no headline block, setup sidebar, onboarding sequence, or marketing footer. Warm paper, olive canvas, blunt orange gloves, thick comic strokes, and deliberately stupid expressions keep the existing art direction.

A hit immediately changes HP, draws the contact pose, and starts its sound in the same input handler. Hitstop freezes only the rendered reaction state; it never blocks JavaScript, input, or rAF. After the freeze, one damped scalar spring drives the bag's recoil. The bag, cached photo, and sticker receive a single affine transform. No face deformation is computed.

| Feel component | Normal | Every fourth combo hit | KO |
| --- | --- | --- | --- |
| Freeze | 38 ms | 58 ms | 82 ms |
| Maximum horizontal squash/stretch | +21% | +29% | +29% |
| Vertical compression | 76% of horizontal amount | Same | Same |
| Camera translation amplitude | 3 virtual pixels | 6 | 6 |
| New particles | 7 | 13 | 13 |
| Sound | Low thump + short noise snap | Stronger thump, lower snap | Thump + comic squeak |

The first impact is drawn synchronously, before waiting for the next frame. Freeze duration is quantized to display callbacks, so the last held frame may extend by one callback. rAF still targets 60 FPS during the pose hold. The punch glove lasts at most 230 ms, impact type at most 380 ms, and recoil settles to zero. A static settled bag causes no further canvas draws.

## Reaction and comedy contract

Overlay anchors are authored in the cached face's local coordinate system: eyes around `(±36, -24)`, nose `(7, 8)`, mouth `(0, 43)`. They are approximate across photos; the crop editor supplies alignment. All six overlays and the final stacked KO overlay are rasterized once at startup. The round begins with no added overlay.

| Combo | Overlay | Korean punchline |
| --- | --- | --- |
| 3 | Tears below the eyes | 눈에서 땀이 나는데? |
| 6 | Oversized snot bubble | 콧방울 보존 법칙 |
| 10 | Clenched cartoon teeth | 치과에서는 꽉 물라던데 |
| 14 | X-eyes plus drool | 침은 정상 작동 |
| 18 | A tiny, flat pink nosebleed mark | 휴지 한 장만 |
| 23 | Eye stars and orbiting-looking static stars | 별점 다섯 개 |
| KO | X-eyes, tears, grimace, drool, snot, stars | 얼굴이 퇴근했어요 |

Unlocked reactions remain selectable until retry. Manual selection persists until automatic is selected again. Exactly two surprises use hit count, so breaking a combo cannot farm them: hit 8 draws one flying tissue (“에취!”); hit 20 draws one escaping spirit (“영혼 잠깐 외출 중”). Each lasts 1.05 seconds of active animation after hitstop. They share a single event slot, allocate no physics bodies, start no timers, and create no extra particles.

Rules retained: 360 HP, 850 ms combo window including the exact deadline, 70 ms minimum accepted-input interval, damage `8 + min(6, floor(combo / 4))`, 32 continuous hits to KO. KO ignores additional punches, shows the pose for 900 ms, then opens the result with local PNG export/retry. Retry resets reactions, effects, and round timing but keeps the face, settings, and session records.

## Hub, mode lifecycle, and prototypes

`src/main.js` owns the only game rAF and routes each frame and input to the selected mode. Sandbag rules are eagerly loaded. `import()` loads `src/modes/finisher.js`, `punchout.js`, or `lottery.js` only when selected. A mode receives a shared stage interface; it cannot schedule its own loop. These modules use no timers or event listeners.

| Mode | One input and reward | Timing / retry |
| --- | --- | --- |
| Finisher | Stop a moving cursor; orange-zone hit earns 999-point KO, miss earns comic 12-point misfire | Success within ±0.13 of meter center; next press resets |
| Punchout | Duck during the visible tell; automatically land a counter and increment success count | 1.15s anticipation, 0.8s tell; early/late gives a comic fail; retry |
| Weapon lottery | Draw once; baguette, squeaky chicken, or leek automatically lands a hit with a named score | 780ms draw; repeat input during draw is ignored; draw again |

Mode change cancels the current scheduled callback, clears the pending Sandbag result timeout, stops sound voices, disposes the old prototype, and resets the renderer's cosmetic state. An import-generation token discards late loads. Failed imports restore playable Sandbag with a retry hint. Once ready, the single scheduler resumes. Sandbag round state and the shared photo survive; prototype scores/state restart on revisit.

Hidden pages cancel rAF and voices and clear the Sandbag combo. Punchout restarts anticipation on return; other prototype clocks pause. Native photo/result dialogs pause game animation and prototype clocks. A mode switch during Sandbag's KO delay cannot open that result over another mode; returning to a completed Sandbag opens its result.

`classic.html`, `src/classic.js`, `src/classic.css`, and `src/lore.js` remain unchanged. The default document imports none of Classic's simulation. The Classic entry remains a separate Vite bundle and page.

## Rendering and sound budgets

- Transparent game canvas; CSS owns the static gym marks/floor. Only the actor/effect envelope is cleared, clipped to the visible stage. On a narrow phone the bag legitimately occupies almost that whole canvas; settled frames skip drawing entirely.
- At most 1,000,000 backing pixels; maximum DPR 1.5 on desktop or 1.25 for coarse-pointer phones. Two-times cached bag/stickers keep outlines legible without rebuilding paths during animation.
- One bag texture rebuild at startup and on photo change/removal. The circular photo mask is applied during that rebuild only. Play uses `drawImage`, with no per-frame crop/mask/photo decode.
- Seven nonempty cached overlay variants, one cached glove, one bounded active gag, maximum 32 particles. Expired/out-of-envelope particles are removed; cap is enforced before insertion.
- If observed cadence drops below 57 FPS after at least 45 samples, the renderer switches to DPR 1, a 16-particle cap, 4/6 new particles per normal/heavy hit, and no radial impact lines. The scheduler keeps running at display cadence; lower quality persists for the page session.
- One scalar spring, capped 33ms integration step. No full-body physics, blur/shadow filter, mesh warp, external fonts, or remote play requests.
- DOM text updates on actions and phase changes; timing bars use transforms. FPS text updates once a second; cadence sample storage caps at 180.
- Opt-in Web Audio: one cached 120ms noise buffer, no more than six concurrent short voices, all disconnected on completion or mode/page suspension. Sound scheduling shares the input with the frozen contact pose; actual speaker latency depends on the device.
- OS or manual reduced motion removes squash, recoil and camera shake, reduces new particles to three, removes glove/radial flashes, slows Finisher, extends Punchout's tell to 1.1s, and removes lottery cycling. Static overlays and rewards remain readable.

`window.__toyDebug()` exposes copied counters and snapshots for verification: selected mode, scheduled loop, per-mode frame counts, cache builds, draw counts, particle high-water mark, freeze duration, and active voices. It does not expose a photo or state mutation API.

## Verification and boundaries

`npm test` covers round rules, all reaction thresholds, heavy rhythm/gag budgets, crop bounds, and prototype timing/reward behavior. `npm run test:browser` covers desktop/mobile touch and keyboard, photo crop/edit/remove/invalid inputs, storage failures, KO/save/retry, cache/idle budgets, all mode rewards, lazy network imports, late-import races, KO cancellation, hidden-page lifecycle, and Classic isolation.

`npm run test:performance` records cadence and callback cost separately, with uploaded synthetic face and audio on. It fails below 57 average FPS, over 20ms p95 cadence, over 16.67ms p95 callback cost, browser errors, extra loops, idle repaint, face rebuild during play, or particle/audio/canvas budget violations. Profiles include desktop, Pixel 7 emulation, mobile 4× CPU slowdown, all three prototypes, Classic, and 180 seconds of mobile Sandbag replays. See [raw metrics](docs/artifacts/performance.json) and [current report](docs/DENSIFY_REPORT.md).

Photos remain local and bounded: 12MB file limit, decoded 40MP limit, retained source at most 1600px on its long side, 320×320 crop. Browser decode briefly allocates the source before the pixel check. No landmark ML, persistent photo storage, accounts, rankings, multiplayer, human-cannon, engine migration, or realistic gore.

Real-device Android/iOS/Safari performance, speaker latency, full screen-reader behavior, and human laughter/retry evidence remain unverified. The three extra modes deliberately have one challenge and one reward, without campaigns or progression.

## Play evidence

- [Desktop ready](docs/artifacts/desktop-ready.png), [mobile ready](docs/artifacts/mobile-ready.png), [heavy impact](docs/artifacts/desktop-dense-impact.png).
- [Mobile tissue gag](docs/artifacts/mobile-sneeze.png), [mobile spirit gag](docs/artifacts/mobile-spirit.png), [KO card](docs/artifacts/desktop-ko-card.png).
- [Finisher reward](docs/artifacts/desktop-finisher.png), [Punchout reward](docs/artifacts/desktop-punchout.png), [weapon reward](docs/artifacts/desktop-lottery.png); matching mobile captures are in the same folder.
- [Actual play video](docs/artifacts/party-play.webm) and [timestamped diagnostics](docs/artifacts/play-proof.json). WebM is silent; the app's sound is enabled during recording.
- [Classic running](docs/artifacts/classic-play.png), [test output](docs/artifacts/browser-tests.txt), [performance output](docs/artifacts/performance-run.txt).
