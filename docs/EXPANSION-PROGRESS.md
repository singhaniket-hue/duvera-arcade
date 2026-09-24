# Arcade expansion progress

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
