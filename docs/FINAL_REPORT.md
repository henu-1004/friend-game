# FINAL_REPORT — FriendSmash Sandbag vertical slice

2026-09-08 · Delivery target: `main` → `origin/main` (`henu-1004/friend-game`).

## Delivered

The default page is a Korean sandbag game with immediate punch input, local face selection and drag/zoom crop, combo-scaled damage and HP, whole-bag squash and recoil, three unlockable flat overlay stickers, KO results, one-click retry retaining the face, optional sound, reduced motion, and a local PNG souvenir. Classic remains a separate working production entry with its original five-stage game logic.

Work follows Concept B and the explicit Sandbag-only scope. No Friend Cannon code or gameplay work was performed. Application and test changes are under `/workspace/friend-smash`; the three requested report copies are written to `/workspace/friend-game-briefs`.

## Verification

- `npm test`: **10/10** passing, covering existing Classic rules plus input rate limits, combo boundaries, reaction milestones, KO lock/reset, and crop coverage.
- `npm run build`: passing. Static output includes `dist/index.html`, `dist/classic.html` and separate bundles.
- `npm run test:browser`: **14/14** passing across desktop Chromium and Pixel 7 touch/viewport emulation. Includes local photo editing/cancel/removal, invalid inputs, no outbound upload requests, pointer/keyboard input, reduced motion, blocked storage, KO/card download/retry, narrow and landscape layouts, and Classic navigation/play.
- Classic source preservation was checked against the original commit: only the imported CSS path, Classic label, return link and its CSS were changed.
- Actual browser screenshots and the downloaded PNG were visually inspected.
- Performance script exercised an uploaded synthetic face. All five measured profiles reported zero runtime errors.

## Measured performance

Headless Chromium 153.0.8010.12 on the shared Linux runner. Frame cadence and callback cost are different quantities; measurements are observations, not guarantees for every device.

| Profile | Duration | Average FPS | Frame p95 | Callback p95 | Frames >25 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop Sandbag | 8 s | 60.00 | 16.7 ms | 0.6 ms | 0 |
| Mobile emulation | 8 s | 60.00 | 16.8 ms | 0.4 ms | 0 |
| Mobile emulation, 4× CPU slowdown | 8 s | 60.00 | 16.7 ms | 1.6 ms | 0 |
| Classic, first stage | 8 s | 60.00 | 16.7 ms | 0.5 ms | 0 |
| Mobile Sandbag continuous replay | 180 s | 60.00 | 16.7 ms | 0.3 ms | 0 |

The three-minute soak completed **39 KO/retry cycles**, with 10,810 sampled frame intervals and no runtime errors. The observed DOM size remained 161 nodes, matching the short Sandbag profiles. Particle count is capped at 48 by implementation. This verifies a stable automated replay path; it does not establish human retention or a formal memory-leak audit.

Sandbag production JS is 24.07 kB / 9.38 kB gzip; CSS is 11.26 kB / 3.24 kB gzip, plus a 0.40 kB gzip shared preload helper. The default page does not fetch the Classic bundle.

## Artifacts

Repository paths:

- `DESIGN.md` — mechanics, flow, visuals, limits, architecture and artifact index.
- `docs/PHASE1_SCORECARD.md` — acceptance and explicitly provisional product assessment.
- `docs/PLAYTEST_COMPARE.md` — Sandbag vs preserved Classic; no Cannon comparison or unsupported winner claim.
- `docs/artifacts/` — desktop/mobile ready, combo, KO and exported card images; Classic capture; raw performance JSON; unit/browser/build logs.
- `tests/` and `scripts/performance.mjs` — reproducible verification.

Requested copies: `/workspace/friend-game-briefs/PHASE1_SCORECARD.md`, `PLAYTEST_COMPARE.md`, `FINAL_REPORT.md`.

## Remaining validation

Physical low-end Android, iOS/Safari, full screen-reader usage and voluntary human replay are untested. This run did not reproduce the historical Classic lag in its short first-stage sample, so no cross-device performance superiority claim is made. The decoded-image dimension guard runs after browser decode; the original image can briefly occupy memory before downsampling.

The next product step is a brief human playtest of the delivered Sandbag loop. Finisher systems, new combat modes, video capture and additional arenas remain outside this slice.
