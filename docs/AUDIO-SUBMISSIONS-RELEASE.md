# Private audio submissions — 2026-09-24

Visitors can submit a clip at https://moosher.duvera.app/creators/moosher/submit-audio.html. The owner reviews privately at https://moosher.duvera.app/creators/moosher/review-submissions.html using the locally delivered review key. Approval only marks a candidate for a later game update; no uploaded clip becomes a public asset or game reaction automatically.

Release source: `71ebd68cababe38deb7d182ea36b7186aeb5b93f`, branch `feature/audio-submissions`, merged through PR #5 into `creator/moosher`. The exact tested build was promoted from https://4363273d.duvera-moosher.pages.dev. Pages production deployment `2d1b8ad9-006a-4154-82e5-826e1db1260c`, immutable URL https://2d1b8ad9.duvera-moosher.pages.dev. `/deployment.json` on the creator domain confirms the source revision. PR #5 merged as `b94e05a`; the uploaded artifact retains its tested feature-branch manifest.

Separate Worker `duvera-arcade-submissions`, https://duvera-arcade-submissions.singhaniket2019a.workers.dev, version `27c7a527-e337-4fc7-b57f-66ca7ca29276` (the secret-setting deployment; code `3521b53`, unchanged in `71ebd68`). Existing multiplayer Worker and all game/audio code remain unchanged. No paid upgrade or DNS changes.

Tests: 38 format/security/rate/expiry checks plus 43 local browser checks; full arcade CI at https://github.com/singhaniket-hue/duvera-arcade/actions/runs/36028669301. Hosted preview passed 14 upload/private-access/playback/approval/download/delete checks. All 224 public files hash-match; 14 security-header checks pass. The first preview caught clean-URL redirects dropping header rules; both extension and clean routes are now covered. Only explicitly identified QA submissions were deleted. The owner key was verified absent from static assets and release logs.

Pending review candidates expire after 30 days, approved candidates after 90 days; deletion removes live data (Cloudflare recovery copies may persist up to 30 days). Format limits: MP3/PCM WAV, 0.2–15 seconds, 1 MiB. Six attempts per daily salted IP, 60 global attempts/20 successful files daily and 100 retained files per creator. See [architecture and operations](../submissions/README.md). There are no visitor accounts, emails or paid storage services.

Owner workflow: open the private page, paste the owner key, load/play a preview, check the linked source, then approve/download or reject. Download both audio and source JSON before expiry. Keep the private key outside source control; rotating the Worker's ADMIN_KEY preserves existing submissions. Human source/speaker/rights/audio-quality judgment is still required. Existing reviewed clips are unchanged.

Rollback frontend to Pages production deployment `0402dd4b-808d-4811-bc3e-f03917856792`, revision `757fe7150f931b615ffc0a13a52468caef451974`. This restores the nine-game site before upload links without touching multiplayer. To stop the upload API too, remove the new Worker's ADMIN_KEY secret; requests fail closed. Preserve review data and leave the existing game-room service alone.

Public verification also passed all 14 hosted submission checks, 224 file hashes and 14 header checks. Original desktop/gameplay/audio regression: 38 passed. QA uploads were removed; the review inbox contains no retained test clips. Human visitors are never deleted by the test runner.

Screenshots: [320px visitor form](screenshots/audio-submissions/visitor-mobile.png) · [private QA review card](screenshots/audio-submissions/owner-review-card.png). The latter is synthetic test metadata around the existing reviewed hello clip, not a visitor submission; the key is not shown.
