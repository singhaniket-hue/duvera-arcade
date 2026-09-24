# Cloudflare release — 2026-09-24

All nine games are live at https://moosher.duvera.app. The six-game expansion queue is complete; no completed game is waiting for deployment.

| Addition | Public link | Modes |
| --- | --- | --- |
| Moosh Stack | https://moosher.duvera.app/play.html?game=stack | Solo |
| Moosh Four | https://moosher.duvera.app/play.html?game=four | Solo bots / private two-player |
| Moosh Draw | https://moosher.duvera.app/play.html?game=draw | Private 3–8-player |
| Moosh Dash | https://moosher.duvera.app/play.html?game=dash | Solo |
| Moosh Smash | https://moosher.duvera.app/play.html?game=smash | Solo |
| Moosh Quiz Party | https://moosher.duvera.app/play.html?game=quiz | Practice / private 2–8-player |

Moosh Flap, 2048 and Spin remain available. Sound review: https://moosher.duvera.app/creators/moosher/sounds.html.

## Exact release

- Git branch `creator/moosher`, source commit [`757fe7150f931b615ffc0a13a52468caef451974`](https://github.com/singhaniket-hue/duvera-arcade/commit/757fe7150f931b615ffc0a13a52468caef451974).
- Existing Pages project `duvera-moosher`, direct upload production branch label `main`. This provider label is not the Git source branch. Git pushes alone do not deploy this project; PR #2 remains draft against `master`.
- Preview: https://fc45d002.duvera-moosher.pages.dev.
- Production deployment `0402dd4b-808d-4811-bc3e-f03917856792`, immutable URL https://0402dd4b.duvera-moosher.pages.dev. `/deployment.json` on the custom domain confirms the Git revision above.
- Separate Worker: `duvera-arcade-rooms`, https://duvera-arcade-rooms.singhaniket2019a.workers.dev, version `e1cdfd7a-15f7-4e29-b543-d2929ecc273d`. Worker source last changed in `8705c42`; it is byte-identical in `757fe71`. SQLite migrations v1 FourRoom and v2 PartyRoom deployed.
- [PR #4](https://github.com/singhaniket-hue/duvera-arcade/pull/4) merged normally as `f22795a`, incorporating all eleven fixes and the credited PR #3 tests. `f20d82c` connects the public endpoint; `757fe71` adds Pages 404 handling and network-aware test synchronization.
- Existing Workers Free / $0 plan verified in the dashboard. No DNS, nameserver, unrelated project or paid-plan changes. No new media or replacement audio.

## Verification

Exact-release [CI run 36022642589](https://github.com/singhaniket-hue/duvera-arcade/actions/runs/36022642589) passed static/creator checks, build, original and creator mobile checks, desktop/audio, all six additions, multiplayer rules/lifecycle, eight-player protocol, phone regressions and 6,000 randomized games of 400 steps each. Assertions were not relaxed.

| Location | Result |
| --- | --- |
| Hosted preview, real independent browsers | Four 47, Draw 34, Quiz 60, original desktop/audio 38 passed |
| Public Worker, eight independent WebSockets | 12 Draw/Quiz full-match checks passed, including simultaneous input, secrets, scores, rematch and full rooms |
| Public creator domain, phone touch | 27 Draw/Quiz checks passed: live stroke/dot delivery, guesses, two-player answers, practice, 320px portrait and short landscape |
| Public creator domain, regressions | Original desktop/audio 38, Four solo 32, Stack 47, Dash 44, Smash 47 passed |
| Public files | All 217 files hash-match `dist`; HTTPS root opens creator landing; all nine player links survive hard refresh; no script/asset errors |

Four's complete online two-context match, win, rematch and reconnect were verified on the hosted preview with the public Worker. Its public-domain rerun intentionally selected solo tests to preserve the shared ten-rooms/hour creation quota. Draw and Quiz verified the actual creator origin with real online rooms. Hostile/flood/quota tests remain local; only `ONLY=match` is permitted by the hosted protocol runner.

The first preview revealed Pages' default SPA fallback returning home HTML with HTTP 200 for absent server paths. No secret question JSON was exposed. The root `404.html` now makes these paths return 404. A Quiz test also required waiting for module initialization before inspecting its title on a real network. The final corrected preview passed. Immediately after production upload the domain briefly returned mixed old/new files; verification was repeated after propagation and all hashes passed. The early phone attempt failed before creating rooms; the subsequent complete public phone suite passed.

Screenshots below are from actual public pages unless explicitly marked preview:

- [Draw desktop lobby](screenshots/party-live/draw-desktop.png)
- [Draw mobile, real touch ink](screenshots/party-live/draw-mobile.png)
- [Quiz desktop lobby](screenshots/party-live/quiz-desktop.png)
- [Quiz 320px question](screenshots/party-live/quiz-mobile.png)
- [Draw completed match — hosted preview](screenshots/party-live/draw-preview-result.png)
- [Quiz completed match — hosted preview](screenshots/party-live/quiz-preview-result.png)

Browser touch checks emulate Chromium devices. Physical Safari/mobile and a human group playtest remain useful. Existing clips were manually reviewed by the owner and are unchanged; only the new reaction-to-event timing needs human judgment. Automated playback verifies controls and audio behavior, not comedic quality.

## Cost and operation

The frontend remains static. Hibernating WebSockets use a separate Worker with SQLite Durable Objects; there are no accounts, paid servers or external databases. Rooms expire and erase their data. Tokens are private, and deployment credentials are absent from browser code and commits.

Draw's accepted drawing batches are the main cost driver. Conservative continuous-drawing estimate: about 15,000 row writes per busy eight-turn match including alarm writes, before guesses and cleanup. Five such matches could approach 75,000 writes against the Free daily 100,000-row-write allowance, shared with other account workloads. This is an estimate, not a production usage measurement. Four and Quiz write much less. Free quota exhaustion can interrupt service; it does not automatically enable paid overages. Measure usage before a large stream and obtain approval before a paid upgrade. Full [limits and cost assumptions](../multiplayer/README.md).

## Rollback

In Cloudflare Pages → **duvera-moosher → Deployments**, roll back to production deployment **`0097dfa6-9968-4a55-8ccb-d286fbca75c8`**. Its immutable manifest at https://0097dfa6.duvera-moosher.pages.dev/deployment.json identifies **`24b90eaa7c56f452182398662cbffcc7b9a0259d`**. That restores the previous seven-game site with Four solo and no public room endpoint. Confirm `/deployment.json` on the creator domain after propagation; do not change DNS.

This is the first Worker release, so there is no earlier Worker application version to restore. Frontend rollback disables public room entry while leaving existing room data to expire. Do not delete Durable Object migrations or active data. For a later Worker update, record its current version and use the supported Worker rollback if required.

Ignored local evidence is under `output/cloudflare-release/` and `output/playwright/cloudflare-public/` on D:. The tested `dist` was uploaded unchanged from preview to production. Later documentation/test-only commits do not change this deployed revision.
