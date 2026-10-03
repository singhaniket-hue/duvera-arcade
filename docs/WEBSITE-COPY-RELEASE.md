# Website copy release — 2026-09-25

Source: `019c7dfb77f088ddcaceb943acead1c41d726189`, branch `content/visitor-ready`, PR #6 targeting `creator/moosher`. Final preview: https://9ed44877.duvera-moosher.pages.dev. Prior production retained for rollback: `2d1b8ad9-006a-4154-82e5-826e1db1260c` (source `71ebd68cababe38deb7d182ea36b7186aeb5b93f`).

All 17 public HTML pages pass the pinned SlopMonster copy checker. The new visitor audit passes 215 checks at 1440×1000, 320×568 and 667×375, including menu cards, nine direct game routes, hard refreshes, artwork, sound persistence, the clip form/private inbox and 404 navigation. No unfinished copy or form placeholders remain in those pages. Meaningful loading/empty states and zero initial scores remain functional UI.

Local regression: original mobile 100, creator mobile 122, desktop/audio 38, Stack 47, Four 47, Draw 34, Quiz 60, Dash 44, Smash 47, party edge 24, protocol 31, party phone 27, submission security/format 38 and submission browser 43. All rule/mechanics suites pass. A separate 6,000-game × 400-step fuzz run holds all invariants.

Hosted final preview: 215 visitor checks; Four 47, Draw 34 and Quiz 60 using independent browser contexts and the live room Worker. All 224 public files hash-match and all 14 security-header checks pass. The initial Draw full-room API probe incorrectly defaulted to localhost; setting ROOM_ENDPOINT to the existing public Worker fixed the harness invocation, and the full Draw/Quiz suites passed without changing assertions. The earlier preview of identical form/runtime files passed 14 real private submission checks; its QA clip was deleted.

Existing game rules, artwork, reviewed audio and event mappings are unchanged. Public source notices now reflect the owner's completed audio review. SlopMonster's Claude editing pass could not authenticate; it is not claimed complete. See WEBSITE-COPY.md for the exact tool revision and scope.

No Worker deployments, DNS changes or paid-plan upgrades. Physical iOS/Safari and a large live audience load test are outside this Chromium desktop/mobile-emulation verification. New visitor uploads still require the owner's source, quality and rights review before use in a future update.

Rollback: in Cloudflare Pages → duvera-moosher → Deployments, restore `2d1b8ad9-006a-4154-82e5-826e1db1260c`. Leave both Workers and DNS unchanged. The retained deployment includes the working audio submission flow.


Production is live at https://moosher.duvera.app. Pages deployment `06d74c94-efa1-4584-a6f2-6c12166f41f2`, immutable URL https://06d74c94.duvera-moosher.pages.dev. The production branch label is `main`; the uploaded Git source remains `content/visitor-ready` at `019c7dfb77f088ddcaceb943acead1c41d726189`, merged through [PR #6](https://github.com/singhaniket-hue/duvera-arcade/pull/6) as `1712b3a60a5c4ce3d0b2c0e7a13d0fab1868c348`. [Exact-revision CI](https://github.com/singhaniket-hue/duvera-arcade/actions/runs/36129818642) passed every job.

Public-domain verification passed: 215 visitor checks, 224 file hashes, 14 security headers, desktop/gameplay/audio 38, Stack 47, Dash 44, Smash 47, Four solo 32, real multiplayer phone 27 and private submission 14. HTTPS root routing, source timestamp links and decoding of all four reaction files passed too. The private QA upload was deleted; no visitor submissions were changed. Public sound settings: https://moosher.duvera.app/creators/moosher/sounds.html.

Screenshots captured on the public domain: [desktop](screenshots/website-copy/desktop.png), [320px mobile](screenshots/website-copy/mobile.png), [clip submission](screenshots/website-copy/clip-submission.png).

No work remains to deploy this content update. Next optional work is physical-device Safari testing and normal owner review of visitor-submitted clips. Existing reviewed audio and mappings require no new approval for this copy release.
