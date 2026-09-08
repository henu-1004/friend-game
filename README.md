# 친구 샌드백 / FriendSmash

A Korean, local-first sandbag game. Open the page and punch immediately, or add a face photo. Build combos, discover silly overlay stickers, reach KO, save a reaction card, and retry with the same face.

The original five-stage spectator game remains available as **Classic** at `classic.html`. Its rules, roster, kits, upgrades, and local progress are preserved. See [Classic instructions](docs/CLASSIC.md).

## Run

Node.js 20.19+ or 22.12+:

```sh
npm ci
npm run dev
```

## Build and verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
node scripts/performance.mjs
```

`dist/index.html` and `dist/classic.html` are separate production entries. Serve the whole `dist/` directory on any static host; assets use relative paths, including under a project subdirectory. `npm run preview` serves the built game locally.

Browser tests start their own preview server on port 4173 and cover desktop Chromium and a Pixel 7 viewport/touch emulation. The performance script uses port 4183 and includes an approximately three-minute continuous replay run. `--soak=30000` shortens that final run. Emulation does not establish physical phone performance.

## Play

- Click or tap the bag, press Space/Enter on the focused bag, or use **한 방 날리기**. Space also works when focus is outside a control. Holding a key does not auto-punch.
- Hits within 850 ms continue the combo. Base damage is 8; every four combo hits adds 1 damage, capped at +6. Starting HP is 360.
- At 3 / 6 / 10 combo, unlock star eyes / spiral eyes / a moustache. Select an unlocked sticker or keep automatic reactions.
- KO shows hit count, best combo, elapsed time, PNG download, and **한 판 더!**. Retry restores HP and resets this round's combo/stickers; the face stays.
- Sound is opt-in. **움직임 줄이기** reduces motion and defaults to the operating system preference.

Photos are decoded locally, bounded to a 1600px source, and cropped to 320×320. Use drag or labeled sliders to align the face. Accepted formats: JPG, PNG, WebP, AVIF, GIF (flattened); maximum 12 MB and 40 million decoded pixels. Unsupported/corrupt files show a recoverable message. No photo upload endpoint, external assets, analytics, or face-detection service is used. Reload clears photos and session KO counts; the completed-round best combo is the only Sandbag value stored locally. Storage failure does not block play.

See [DESIGN.md](DESIGN.md), [screenshots and measurements](docs/artifacts), and [Phase 1 reports](docs/FINAL_REPORT.md). No Friend Cannon development or playtest is part of this change.
