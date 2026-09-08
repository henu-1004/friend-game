# PHASE1_SCORECARD — Sandbag only

Date: 2026-09-08. Scope authority: Concept B and the explicit override in `/workspace/friend-game-briefs/SCOPE.txt`. This is an implementation acceptance scorecard, not a survey or a claim of proven retention.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Sandbag is the default entry | PASS | `/` opens a full-HP bag with an enabled punch button; no setup gate |
| Local face upload | PASS | Confirm/cancel, drag, zoom, keyboard position sliders, re-edit, remove, reload clearing |
| Recoverable photo failures | PASS | Corrupt and >12 MB files leave play available; size/type messages in Korean |
| Direct punch | PASS | Mouse, real emulated touch, button, Space and Enter; empty floor misses |
| Combo and HP | PASS | 850 ms window, 70 ms input cap, damage progression, zero clamp and post-KO lock |
| Squash and overlay stickers | PASS | Whole-bag affine squash, spring recoil; star/spiral/moustache paths at 3/6/10 combo |
| KO and immediate retry | PASS | Result after 650 ms; reset HP/combo/unlocks, retain selected face |
| Korean interface | PASS | Setup, instructions, controls, errors and results; screenshots inspected |
| 60 FPS target | PASS in measured environment | Desktop, mobile emulation and 4× CPU profiles; raw JSON in artifacts |
| Classic preserved | PASS | Separate built entry, original first stage and spectator intervention run successfully |
| Build and repeatable QA | PASS | Node rules/crop tests and Playwright tests against production output |
| 30 seconds–3 minutes of repeat use | Technical validation only | Automated KO/retry soak; voluntary human replay not measured |
| Real mobile hardware / Safari | NOT TESTED | Chromium emulation does not replace physical devices |

## Product assessment, provisional / 5

These scores express the implementer's judgment from the working slice and captured behavior. There were no recruited participants, and the numbers should not be treated as experimental results.

| Axis | Score | Reason / unresolved question |
| --- | --- | --- |
| Five-second clarity | 5 | One large target and immediate action; optional photo setup is separate |
| Handfeel | 4 | Input-linked recoil, squash, comic text and opt-in sound; needs touch-device evaluation |
| Repeat loop | 3 | Fast retry, combo pursuit and face swapping; only three unlockable overlays |
| Surprise comedy | 3 | A friend's face changes into stars, spirals and a monocled moustache; reactions become predictable |
| Share moment | 4 | Actual local PNG export with face and stats; no video clip capture |
| Expandability | 4 | Flat sticker variants can extend the loop without adding physics systems |
| Complexity / fun | 4 | Small direct loop, bounded visuals; perceived fun remains unvalidated |
| Distinctiveness | 3 | Custom bag art and personal photos help; generic tapper risk still exists |

Decision: ship this bounded Sandbag slice for human playtesting. Do not expand into a new combat system based only on automated success. No comparison or winner claim against Friend Cannon was made.
