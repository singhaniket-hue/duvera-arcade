# Arcade expansion progress

## Current handoff — 2026-09-24
- LIVE: Stack, Four solo (easy/normal bots), Dash, Smash, plus the three existing games.
- Production source: `creator/moosher` at `24b90eaa7c56f452182398662cbffcc7b9a0259d`. Documentation/screenshot commits after this revision are not automatically deployed.
- Four online: implemented and tested against the local Worker, NOT deployed. Cloudflare CLI OAuth renewal requires owner consent; the previous attempt expired. Do not reuse the stale consent page. Start a fresh narrowly scoped login when the owner is available, then follow `multiplayer/README.md` through preview and public two-context tests before enabling online mode.
- Draw and Quiz Party: implemented and tested locally in the follow-up below. Neither is deployed. Next task is a human local party playtest, then renew authorization and validate hosted multiplayer before any later release.
- No new paid services, plan upgrades, DNS changes or media generation. Existing manually reviewed audio retained unchanged; new reaction mappings need a short human playtest.

The entries below record the implementation and release sequence; earlier "in progress" entries are historical.

## Release method and baseline
- Existing production: `duvera-moosher` Cloudflare Pages direct upload. No automatic Git deployment.
- Baseline production: `22491d262bba4754334935399efbca0c3d2f5459`; working branch `creator/moosher`, PR #2 open, baseline checkout `594b2a3`.
- Preserve prior production deployment for rollback in Pages → Deployments → Rollback. Never change DNS for these releases.
- User confirms existing audio has been manually reviewed. Keep clips unchanged; new event mappings need a brief human playtest.

## 1. Stack — implementation in progress
Plan: original pure timing engine; responsive canvas with falling overhang, bounded tower history and perfect streaks; shared configurable creator UI, safe local scores, pause on hide. Test mechanics and browser inputs/resize/storage failures, run existing regressions, commit, preview, release and verify.

## Queue
2. Four: solo bot plus authoritative private rooms on a Cloudflare Durable Object, subject to free-plan availability/access.
3. Draw: private drawing rooms; begin after Four release or documented infrastructure blocker.
4. Dash; 5. Smash; 6. Quiz Party: unstarted backlog.

Stack pre-release validation: 47 focused browser checks; mechanics including 1,000 placements; 100 original mobile, 122 creator mobile and 38 existing desktop checks passed. Static/creator checks passed. Screenshots: output/playwright/stack/. Next: upload tested commit to Pages preview, then production.

## Stack — LIVE
Commit: f6cb166b76c1bde20284ccf546acda2a22abc65a. Preview: https://stack-f6cb166.duvera-moosher.pages.dev/. Public: https://moosher.duvera.app/play.html?game=stack. Both passed all 47 focused browser checks; all 195 files hash-match. Prior production rollback: 5965bf0a-b9e0-4246-9783-4a5ca069d580 (22491d2).

## Four — implementation started
Plan: original shared pure rules and depth-limited tactical bot; accessible 7x6 board with distinct circle/star tokens; SQLite Durable Object per private room, hibernating WebSockets, opaque seat tokens, revision checks, bounded rate/payload/storage, reconnect and timeout. Separate Worker backend; existing static Pages retained. No plan upgrade.

Four: 47 browser checks passed locally (desktop/touch, complete solo game, real two-context rooms, rejection/reconnect/rematch/leave), plus rules and lifecycle/security suites. Worker dry-run builds successfully. Stack's 47 browser checks still pass.

**Blocker:** Wrangler's existing OAuth token is expired and unrefreshable; an owner consent request timed out. The dashboard confirms Workers Free ($0). No backend was deployed and no paid upgrade was introduced. Four will release solo with explicit online-unavailable text; full multiplayer code remains reviewable under `multiplayer/`. Draw is unstarted and deferred behind the same access blocker; next static game is Dash.

## Four solo — LIVE; multiplayer NOT deployed
Commit: 7b97048d594f05d6ef1c1f2acc789dff9484bd7e. Preview: https://four-7b97048.duvera-moosher.pages.dev/. Public: https://moosher.duvera.app/play.html?game=four. Preview/public each passed all 32 solo browser checks; all 200 static files match. Local full suite: 47 browser checks, plus rules/lifecycle/security tests. Existing regressions: 100 + 122 mobile, 38 desktop, 47 Stack.

## Dash — implementation started
Plan: original fixed-step runner with an illustrated body and unchanged, uniformly scaled creator face assets; jump/hold-duck controls, fair isolated obstacle sequence, introductory grace, stars, capped increasing speed, isolated best and visibility pause. Test collisions, obstacle spacing across speed range, touch/keyboard, all three viewport shapes, storage failure, resize and resume; preview/release only once those and regressions pass.

Dash pre-release: mechanics passed (276 generated encounters over ten minutes, legal responses at all speeds), 44 desktop/touch checks passed at 320px/short landscape/desktop. Visual review enlarged the portrait view without scaling the avatar out of proportion. Stack 47, Four full local 47, existing desktop 38, static and creator checks passed. A Linux CI race in Four's test was corrected by waiting for both clients' authoritative playing state; no rejection assertion was weakened (c91d13b).

## Dash — LIVE
Commit: c28d19743b1b3a68fb368083816fdf53ee5b9ba1. Preview: https://dash-c28d197.duvera-moosher.pages.dev/. Public: https://moosher.duvera.app/play.html?game=dash. Preview/public 44 browser checks passed; all 204 files hash-match. Full CI run 35953455800 passed, including existing 100/122 mobile and 38 desktop suites, Stack 47, Four 47 with local Worker, and Dash mechanics/browser checks.

## Smash — implementation started
Plan: original fixed-step brick physics, five original layouts, three lives, bounded wide/slow/extra-life bonuses, isolated level unlocks, portrait outside playfield. Verify all five levels and collision/life/power-up boundaries, mouse/keys/touch drag, short screens, pause, resize and storage failure. No new assets required.

Smash pre-release validation: all five layouts clear through real collision logic; rebounds, shallow-angle guard, all bonuses, expiry, lives and stalled frames passed. 47 browser checks passed, including mouse/keyboard/touch drag, five-level UI victory, saved unlocks and storage failure. Stack 47, Dash 44 and existing desktop 38 still pass.

## Smash — LIVE
Commit: 24b90eaa7c56f452182398662cbffcc7b9a0259d. Preview: https://smash-24b90ea.duvera-moosher.pages.dev/. Public: https://moosher.duvera.app/play.html?game=smash. Preview/public each passed all 47 browser checks; all 208 static files hash-match. Full CI run [35954429421](https://github.com/singhaniket-hue/duvera-arcade/actions/runs/35954429421) passed: original mobile 100, creator mobile 122, original desktop 38, Stack 47, Four 47 against the local Worker, Dash 44, Smash 47, plus mechanics, room security/lifecycle, static/creator checks and build.

Final production regression passes: original mobile 100, creator mobile 122, original desktop 38, Stack 47, Four solo 32, Dash 44, Smash 47. Multiplayer tests are local only; no public room verification is claimed. Mobile tests use Chromium touch emulation at 320px portrait and short landscape, not physical Safari. Rare high-tower, score and level outcomes use explicit fixtures through real game logic; Four browser matches use complete legal moves.

Representative screenshots: `docs/screenshots/expansion/` (desktop/phone for all four additions, plus Smash landscape). Full ignored captures are under `output/playwright/`. Sound review: https://moosher.duvera.app/creators/moosher/sounds.html.

Rollback: in Cloudflare Pages → duvera-moosher → Deployments, roll back to the previous production deployment containing c28d197 (Dash release). Alternatively re-upload the retained, previously verified `D:\Work\duvera-arcade\output\dash-release.zip` as Production. It removes Smash while retaining Stack, Four solo, Dash and the original three games. `smash-release.zip` retains the current build. Verify `/deployment.json` after rollback; do not rebuild a ZIP from a later checkout or modify DNS. No Worker migration is deployed to roll back.

Current production deployment ID: `0097dfa6-9968-4a55-8ccb-d286fbca75c8`. Verified rollback deployment ID: `38f8a9f7-e032-4d73-8b90-41559f338364`; its immutable URL https://38f8a9f7.duvera-moosher.pages.dev/deployment.json confirms c28d197. Cloudflare's direct-upload "main" source label is provider metadata, not the Git branch; use the deployed manifest above.

## Draw — locally implemented, not deployed (2026-09-24)
User confirms deployed solo games work after manual playtesting; requested Draw and Quiz implementation/local testing only. Public production remains 24b90ea.

Draw adds original 3–8-player private rooms, three secret choices, 75-second rounds, server scoring/aliases, fair one-turn-per-player rotation, rematch, six existing avatars, mouse/touch strokes, palette/brush/eraser/undo/clear, English/Hindi/custom packs, host lock/kick/skip, reconnect grace and host transfer. Streamer mode explicitly requires hiding the broadcast capture before revealing the secret.

Validation: 20 rules/privacy cases, 11 actual room-method lifecycle/security cases, 30 independent-browser checks, static/creator checks and build. Browser scenarios include full three-player rotation, duplicate/stale/unauthorized inputs, secret isolation, touch drawing, 320px and short landscape, refresh/host departure, disabled storage, kick and ninth-player rejection. Fake-clock tests cover deadlines, hibernation restore and expiry; no hosted latency/quota behavior claimed. Screenshots: output/playwright/draw/.

Next: implement and locally test Quiz Party using this bounded room service. No production release authorized by this follow-up.

## Quiz Party — locally implemented, not deployed (2026-09-24)
Original ten-question matches for 2–8 players; host start/advance/rematch, server deadlines and scoring, answer secrecy until closure, private seats/reconnect, host transfer and final standings. Separate static practice has keyboard/touch answers, pause on hide, retry and creator-isolated local best. Two editable original JSON packs link to checked primary sources in docs/QUIZ-SOURCES.md.

Final local validation: Draw 22 rule/security + 33 browser checks; shared PartyRoom 11 lifecycle/transport checks; Quiz 53 scoring/rules/practice + 59 browser checks; Four 47 browser checks and existing mechanics/security checks. The isolated check:multiplayer runner passed against real local Wrangler. Tests include full matches, simultaneous/duplicate/stale input, host departure, reconnect/refresh, secret isolation, actual 20-second timeout, blocked storage, 320px portrait, short landscape and keyboard/touch. Existing regressions passed: 100 generic mobile, 122 creator mobile, 38 desktop, Stack 47, Dash 44, Smash 47. Static/creator checks, build and Worker dry-run passed. Generic-navigation assertions now require all nine exact cards and creator opt-out, reflecting the two new local entries.

Remaining: physical mobile/Safari and human multi-person playtesting, new audio event timing, hosted network/quota validation and any eventual deployment authorization. No hosting or DNS changes were made; production remains 24b90ea. Existing user-reviewed clips remain unchanged. The local development server rejects access to server-only question/word source folders; static dist excludes them.

Run locally using README.md's two-terminal instructions or the already-started preview at http://127.0.0.1:4173/. Use independent browser profiles/private contexts for participants. Draw needs three people; Quiz needs two, or choose Solo practice. The local service remains limited to this computer and configured origins.

Implementation commits: Draw `66876f0`, Quiz `e38e567`. Two generated source-only dry-run bundles under `multiplayer/multiplayer/output/party-dry-run/` remain tracked: automatic approval review blocked the attempted untracking command. The ignore rule now covers future nested dry-run outputs. No runtime credentials occur in these commits, and the entire multiplayer folder is excluded from the static build. The established draft PR #2 contains the changes; production still points to `24b90eaa7c56f452182398662cbffcc7b9a0259d`.
