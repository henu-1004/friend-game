# FriendSmash v2

A Korean, browser-only spectator brawler: 2–6 friends form one team for a five-stage run. Characters are circular face pucks with thick color rings, soft shadows, and one oversized edge-mounted prop. Whole pucks rotate, squash, flash, recoil, and throw sparks on impact, with light camera shake.

## Run and verify

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
npm test
npm run build
```

Vite produces `dist/`. Tests cover kit coverage, rerolls, stage definitions, upgrade offers, and victory/defeat/timeout rules.

## Play

Choose each friend's visible kit in the roster, optionally add local face photos, then start. Friends automatically fight stage NPCs and reinforcements; the boss arrives at 40 seconds. Each fight lasts up to 60 seconds (ends early on team elimination); budget roughly 5–8 minutes including roster setup and card choices. A timeout counts as defeat. Both wins and losses offer three upgrade cards, restore the team, and advance. After the Rift, choose a toy to carry into your next run in the current session.

- **Backyard:** sprinkler knockback, snack guards, frying-pan lawn king.
- **Castle:** timed gate trap, archers, shield knight.
- **Beast Pit:** timed poison pool, axe rushers, wolf lord with companion.
- **Neon Lab:** pulsing laser lane, gun guards, a mecha boss using a friend's face.
- **Rift:** gravitational pull and damaging core, ice guards, an oversized friend wizard boss.

Twelve selectable kits: charging axe, fleeing shield, bow, rapid gun, magic wand, wolf companion, orbiting laser drone, knockback pan, pulling magnet, slowing ice, splash bomb, and healing lollipop. Every kit has a visible prop and distinct behavior. Spectators can push everyone with wind, heal friends, or launch everyone into chaos, sharing a five-second cooldown.

Upgrade cards add larger weapons and melee reach, ricocheting projectiles for all friends, wolves, drones, freezing hits, or visible three-hit shields. Repeated upgrades stack. No inventory or skill tree. Wins earn 30 Hype, losses 10; at 100 Hype, the drone upgrade joins the card pool. The base drone kit is always selectable. Hype persists in `localStorage`; the roster, photos, current run, and next-run carry card are session-only. Storage failure does not block play.

## Faces and privacy

Images are decoded and cropped entirely in the browser. Native `FaceDetector` is attempted when available; the drag-and-zoom crop editor is always shown for confirmation and serves as the fallback. Nothing uploads and no remote detection service is used. Crops are circular and photos disappear on reload.

Desktop and mobile layouts, native accessible dialogs, labeled roster controls, and keyboard-accessible upgrade cards. Canvas combat is visual; the event feed announces eliminations and interventions. No backend, PvP, loot bags, or additional currencies.
