# 친구 때리기 / FriendSmash

A lightweight Korean party toy: a big face on a sandbag, heavy fourth hits, ridiculous cartoon reactions, and two tiny surprise gags. Add a local photo, punch with touch/mouse/Space, reach KO, save a card, and retry.

The hub also offers three lazy-loaded one-button prototypes: **필살기** (time one finisher), **펀치아웃** (dodge and auto-counter), and **무기 뽑기** (draw a silly weapon and strike). Switching keeps the photo and Sandbag round. Extra modes restart when revisited. The original game remains isolated at [classic.html](classic.html), with [Classic instructions](docs/CLASSIC.md).

## Run

Node.js 20.19+ or 22.12+:

```sh
npm ci
npm run dev
```

Open the Vite URL. No photo or sound setup is required to play.

## Verify and capture

```sh
npx playwright install chromium
npm test
npm run build
npm run test:browser
npm run test:performance
node scripts/play-proof.mjs
```

Browser tests cover desktop Chromium and Pixel 7 touch emulation, use port 4173, and save screenshots under `docs/artifacts/`. Performance uses port 4183, enables sound and a local synthetic face, measures all modes plus Classic, and includes a full 180-second mobile replay soak. For a quick development check use `npm run test:performance -- --soak=30000`; that replaces the JSON with a shorter measurement. The proof script uses port 4185 and produces a silent WebM of actual browser play plus timestamped diagnostics. Run the performance script without other browser workloads for comparable results.

`npm run build` creates separate `dist/index.html` and `dist/classic.html` entries plus one small dynamic chunk per extra mode. Serve the whole `dist/` directory; relative assets support a project subdirectory. `npm run preview` serves the production build locally.

## Play

- Hit the face or **한 방 날리기**; Space/Enter works on the focused game/button. Empty corners do not damage the bag. Holding a key does not auto-punch.
- Continue within 850 ms for a combo. Every fourth hit gets stronger freeze/squash/sound. HP starts at 360; damage is `8 + min(6, floor(combo / 4))`. A continuous combo reaches KO in 32 hits.
- At 3 / 6 / 10 / 14 / 18 / 23 combo, unlock tears / snot / grimace / X-eyes and drool / tiny cartoon nosebleed / stars. Choose an unlocked overlay or leave automatic selection on. KO combines the nonsense.
- Hit 8 sneezes out a tissue; hit 20 releases one tiny spirit. Each gag appears once per round.
- **소리 켜짐** enables synthesized audio. **움직임 줄이기** disables camera kick and squash, reduces particles, and slows/widens timing challenges; initially follows the OS preference.
- Finisher: hit the orange timing zone. Punchout: duck only when **지금 피해!** appears. Lottery: one tap draws and strikes. Each has a reward and immediate retry.

Photos use a local crop editor with drag, zoom, and position sliders. JPG/PNG/WebP/AVIF/GIF up to 12 MB and 40 million decoded pixels; GIF is flattened. The source is bounded to 1600px and the crop to 320×320. Only crop changes rebuild the cached face mask. There is no upload endpoint, analytics, remote asset, face ML, or stored photo. Reload clears the photo; only Sandbag's completed-round best combo is persisted. Storage failure is tolerated.

See [DESIGN.md](DESIGN.md), [PRODUCT.md](PRODUCT.md), [current pass report](docs/DENSIFY_REPORT.md), and [play evidence gallery](docs/artifacts/index.html). Earlier phase reports remain historical.
