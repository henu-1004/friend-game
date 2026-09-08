# Friend-game densify delivery

2026-09-08 · base `0415b5e` · default Sandbag plus three lazy toy modes

Sandbag now occupies most of the play surface. Every fourth hit gets heavier contact freeze, squash, camera kick, glove impact and synchronized synthesized audio. Cached tears/snot/grimace/X-eyes/drool/cartoon nosebleed/stars replace the old moustache and monocle. A tissue sneeze and one escaping spirit provide two bounded surprise beats; the final KO stacks the expressions.

The Korean hub offers Sandbag, Finisher, Punchout, and Weapon lottery. All three extra modes are playable input/reward/retry prototypes in separate dynamic chunks. A shared scheduler owns exactly one rAF loop. Switching disposes the previous mode and cancels pending KO/audio work; the photo and Sandbag round survive. Late-import, hidden-page, keyboard/touch, and photo flows have browser coverage.

Classic's entry and all three legacy source files are byte-for-byte unchanged from `0415b5e`; it loads only at `classic.html`. No cannon, multiplayer, rankings, mesh warp, landmark service, heavy Sandbag physics, or realistic gore was added.

## Validation

The first measurement with sound enabled found 53.5 FPS under 4× CPU throttling. The fix lowers phone raster density and sheds pixels/particles/radial effects if measured cadence drops below 57 FPS; it preserves the display-rate scheduler, face cache, core reaction, and input. A focused repeat of that profile measured 60 FPS with a 1.2 ms p95 callback. The final full-run numbers are recorded below and in the raw artifact.

The performance harness counts scheduled game callbacks only during the measured workload, excluding Playwright's import-loading polling callback. It distinguishes rAF cadence from JavaScript callback time, checks idle drawing and cache reuse, and fails on budget violations. No browser screenshot/video workload runs alongside the timing pass.

Final full run: **all eight profiles passed**. Sound and the synthetic photo were enabled for every new-game profile.

| Profile | Average FPS | Frame p95 (ms) | Callback p95 (ms) | Quality |
| --- | ---: | ---: | ---: | --- |
| desktop-sandbag | 60 | 16.7 | 0.4 | full |
| mobile-sandbag | 60 | 16.7 | 0.4 | full |
| mobile-4x-cpu-sandbag | 59.88 | 16.8 | 1.4 | lite |
| classic-first-stage | 60 | 16.7 | 0.4 | Classic |
| mobile-finisher | 60 | 16.7 | 0.2 | full |
| mobile-punchout | 60 | 16.8 | 0.1 | full |
| mobile-lottery | 60 | 16.7 | 0.2 | full |
| mobile-3-minute-soak | 60 | 16.7 | 0.3 | full |

The 180-second soak completed **43 KOs / 10,809 measured frame intervals**. Every new-game profile recorded zero idle redraws, zero face-cache rebuilds during play, at most one scheduled loop, and no browser errors. Particle high-water stayed at or below 32; audio at or below six voices. The slowed mobile profile used the automatic lighter effect budget.

Build and all 14 unit tests passed. All 22 desktop/mobile browser cases passed, including an injected slow-cadence test for the effects fallback.

## Artifacts and reproduction

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run test:browser
npm run test:performance
node scripts/play-proof.mjs
npm run dev
```

- [Evidence gallery](artifacts/index.html), [actual play WebM](artifacts/party-play.webm), [play timestamps and counters](artifacts/play-proof.json), [heavy contact frame](artifacts/desktop-dense-impact.png).
- [Phone ready](artifacts/mobile-ready.png), [tissue](artifacts/mobile-sneeze.png), [spirit](artifacts/mobile-spirit.png), [KO export](artifacts/desktop-ko-card.png).
- [Finisher](artifacts/desktop-finisher.png), [Punchout](artifacts/desktop-punchout.png), [weapon lottery](artifacts/desktop-lottery.png), [Classic](artifacts/classic-play.png).
- [Performance JSON](artifacts/performance.json), [performance log](artifacts/performance-run.txt), [unit tests](artifacts/unit-tests.txt), [browser tests](artifacts/browser-tests.txt), [build output](artifacts/build.txt).

The 16.36-second video uses actual browser inputs and is silent because Playwright does not record audio; app sound is enabled during the capture. Reaction/photo tests use a local synthetic face, not a participant photo. Production extra-mode chunks are about 1.1–1.6 kB each before gzip; the Sandbag JS entry is about 32 kB before gzip. No new runtime dependency was added.

## Gaps

The timings are headless Chromium on a shared Linux runner. Pixel 7 emulation and 4× CPU slowdown do not establish physical Android/iOS or Safari performance. Speaker latency and whether people find the denser toy funny need a real-device friend playtest. Approximate photo anchors require a sensible manual crop. The extra modes have one challenge/reward each, no campaigns or persistent progression. Full screen-reader auditing remains future work.
