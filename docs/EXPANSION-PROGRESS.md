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
