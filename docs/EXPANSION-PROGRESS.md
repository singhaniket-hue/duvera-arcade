# Arcade expansion progress

## Current handoff — 2026-09-24
- LIVE: Stack, Four solo (easy/normal bots), Dash, Smash, plus the three existing games.
- Production source: `creator/moosher` at `24b90eaa7c56f452182398662cbffcc7b9a0259d`. Documentation/screenshot commits after this revision are not automatically deployed.
- Four online: implemented and tested against the local Worker, NOT deployed. Cloudflare CLI OAuth renewal requires owner consent; the previous attempt expired. Do not reuse the stale consent page. Start a fresh narrowly scoped login when the owner is available, then follow `multiplayer/README.md` through preview and public two-context tests before enabling online mode.
- Draw and Quiz Party: unstarted. Next task is to unblock and release Four online, then implement Draw. Do not advertise either as playable.
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
