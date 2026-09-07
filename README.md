# FriendSmash

Browser-only physics arena for 2–6 friends. Add names and optional face photos, watch collisions, and intervene with wind, snacks, or chaos. Every match assigns one absurd Korean trait per fighter; rematches guarantee a different trait. Matches end with one survivor or after 60 seconds and highlight the most active lore alongside the winner.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

`npm run build` produces `dist/`; `npm test` checks trait mechanics.

## Faces and privacy

Photos are decoded and cropped entirely in the browser; no upload or remote detection service is used. The native `FaceDetector` API is attempted when available. Browser support varies, so the local drag-and-zoom crop editor is always available for confirmation, and is the manual fallback when detection is unavailable or fails. Cropped circular faces attach to the arena bodies. Photos exist only in page memory and disappear on reload.

## MVP scope

Canvas arena with equal-mass collision response, six mechanical traits (escape, theft, resurrection, healing, rage, attraction), Korean proc announcements, and spectator interventions with a five-second cooldown. No duel or zombie modes. No persistence or multiplayer backend.
