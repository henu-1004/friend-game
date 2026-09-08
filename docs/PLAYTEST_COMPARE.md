# PLAYTEST_COMPARE — Sandbag and preserved Classic

2026-09-08. The user overrode Concept Analysis's original two-concept comparison with **SANDBAG ONLY**. Friend Cannon was neither opened for play nor modified. The only comparison here is the new Sandbag slice versus the existing Classic entry in this repository.

## Method

Automated Chromium browser walkthroughs, actual desktop/mobile screenshots inspected by the implementer, rule tests, an eight-second loaded-photo performance sample per profile, a first-stage Classic sample, and a continuous Sandbag replay soak. Browser tests use a synthetic local face illustration. No recruited human participants, real friend photos, laugh counts, retention telemetry or physical phone measurements were collected.

## Observed differences

| Question | Sandbag | Classic |
| --- | --- | --- |
| What can I do immediately? | Tap one large bag; visible HP responds on the same input | Start an automatic team fight; roster setup and kit choices are available |
| Who causes a hit? | Player's tap, Space/Enter or punch button | Automatic fighters; spectator interventions have a shared cooldown |
| Where is the face? | One close-up photo with prominent comic overlays | Multiple small face pucks and oversized props in an arena |
| How does a round progress? | 360 HP → KO → one-click retry, preserving the face | Five stages, bosses and post-stage upgrade cards |
| What changes in a few seconds? | Combo milestones at 3, 6 and 10; star/spiral/moustache reactions | Moving teams, shots and interventions; boss starts later |
| How do I keep a moment? | Local 720×800 PNG download | No new export feature was added |
| What does the entry load? | Sandbag Canvas/rendering only | Separate legacy bundle and simulation |
| What was actually verified? | Full photo/punch/combo/KO/retry path on two viewport profiles | First-stage launch, wind intervention, navigation, existing rule suite |

## Performance interpretation

The short desktop and mobile Sandbag samples both averaged 60 FPS; mobile emulation with four-times CPU slowdown also averaged 60 FPS. The Classic first-stage sample also averaged 60 FPS. This run did **not** reproduce the historical “laggy Smash” feedback; it does not justify a measured claim that Sandbag is faster than Classic across the full five-stage run. The new slice's advantage demonstrated here is immediate player control, face scale and a smaller gameplay scope.

See `artifacts/performance.json` for frame interval percentiles, callback cost, KO counts, canvas sizes, durations and the soak result. The FPS counter reports observed cadence. Neither emulation nor the shared Linux runner establishes a 60 FPS guarantee on every device.

## Next human playtest

Use 5–8 willing participants with pictures they can comfortably joke about. Give the page without explanation for five seconds and record the first action. Let each person play for 30 seconds, then offer continued play up to three minutes. Record photo setup completion, moments they laugh or point out, voluntary retries, which reaction gets noticed, and whether they choose to save a card. Ask a brief handfeel question on their actual phone. Report raw counts and observations before assigning comparative scores.

Sandbag remains the selected implementation because the user explicitly requested it. The available evidence supports readiness for that playtest, not a universal product winner or validated retention.
