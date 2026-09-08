# FriendSmash — a pocket party toy

Open `/` and hit the face. Sandbag is the default, and takes most of the screen. This pass replaces the landing-page/sidebar hierarchy with four compact mode picks, a big punch surface, and a small face/sticker shelf.

The main reward is the hit itself: an immediate glove, a short freeze, asymmetric squash, recoil, camera kick, and an optional synchronized thump/snap. Every fourth combo hit is heavier. Tears, snot, clenched teeth, X-eyes, drool, tiny cartoon nosebleed, and stars replace the moustache/monocle. The eighth hit sneezes out one tissue; the twentieth briefly loses its spirit. KO stacks the expressions before retry.

| Pick | Input | Reward |
| --- | --- | --- |
| 샌드백 / Sandbag, default | Tap the face or punch button | Escalating face comedy, combo, KO, saved card |
| 필살기 / Finisher | Tap when the cursor crosses the orange zone | 999-point knockout or a comic misfire; retry |
| 펀치아웃 / Punchout | Duck on the visible tell | Automatic counterpunch and success count; early/late comic failure |
| 무기 뽑기 / Weapon lottery | Tap once to draw | Baguette, squeaky chicken, or leek automatically strikes; draw again |

The three extra modes are small playable prototypes, dynamically imported only when selected. They share the cached stage and face, own no animation loop, and restart when revisited. Sandbag's round and local photo survive switching. Classic stays a separate document and bundle at `classic.html`.

**Hard budget:** one active rAF owner, 32 particles, six audio voices, one-million-pixel stage ceiling, cached face mask and stickers, no idle repaint, no background repaint in the game canvas. Prefer fewer effects over fewer frames. The performance script enforces cadence, callback, cache, particle, audio, and loop budgets.

Photos stay in memory; no upload, landmark detection, mesh warp, or per-frame decoding. UI is Korean. Sound is opt-in; reduced motion removes shake/squash and reduces effects. No human-cannon, realistic gore, multiplayer, rankings, external engine, or heavy Sandbag physics.

Evidence: [design and budgets](DESIGN.md), [play recording](docs/artifacts/party-play.webm), [measured performance](docs/artifacts/performance.json). Automated play establishes functionality and measured runner performance; physical-device performance, perceived sound latency, and whether friends actually laugh still need human playtesting.
