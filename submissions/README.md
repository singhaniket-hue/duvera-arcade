# Private audio submission inbox

Visitors submit a short candidate at `/creators/moosher/submit-audio.html`. The owner opens `/creators/moosher/review-submissions.html` with a private review key to listen, approve for later, download audio/source notes, or reject/delete. **Approval does not publish or modify game configuration.** All existing game audio and controls remain unchanged.

## Isolation and bounds

This is a separate `duvera-arcade-submissions` Worker with one SQLite-backed `AudioInbox` per configured creator. It does not change the game-room Worker, room limits, DNS or accounts. Keeping this small review queue in SQLite avoids introducing an R2 billing activation. No paid upgrade is authorized.

- MP3 / uncompressed PCM WAV only, 0.2–15 seconds, maximum 1 MiB. Both client and server inspect bytes and calculate duration. This is structural validation, not speaker verification, malware scanning, or rights approval.
- Source HTTPS URL and timestamps required; source URLs are never fetched by the server. Suggested reaction, optional nickname/note and permission confirmation are stored. No email/account required.
- Six submission attempts per daily salted IP digest per UTC day, 60 global attempts and 20 accepted files/day per creator; maximum 100 queued files (at most 100 MiB). Invalid attempts count. Identical retained files are deduplicated. Client-supplied internal headers are overwritten; raw IPs are not persisted. Unknown creators cannot allocate objects.
- Pending files expire in 30 days; approved candidates expire in 90 days from first approval. Daily alarms remove expired records, binary data and rate-gate rows. Deletion removes live data; Cloudflare's recovery backups may retain it for up to 30 more days.
- Metadata lists and binary downloads require the owner bearer key. The private key is a Worker secret, never embedded in static files. Authorization is checked before touching storage; missing keys fail closed. The review page retains the key in memory only and clears it, fetched audio and private content on lock/page exit. Do not enter it on untrusted preview builds.
- No public list, playback, moderation endpoint or automatic game import. Safe text rendering, bounded bodies, prepared SQL bindings, restrictive CORS, no-store responses and no URL credentials. Downloads use generated filenames and source-note JSON. Public forms contain no credential.

The Free SQLite Durable Object limits currently include 1 GiB per object and 5 GB account storage, shared request/write allowances, and a 2 MB row limit. A 1 MiB file fits with metadata. This queue adds low daily write volume relative to continuous multiplayer drawing, but all account workloads share quotas. No guarantee of uninterrupted Free service; exhaustion produces a retry message. Sources checked 2026-09-24: [limits](https://developers.cloudflare.com/durable-objects/platform/limits/), [pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [recovery/storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).

## Local development and tests

Install the existing Worker toolchain with `npm ci --prefix multiplayer`, root Playwright 1.56.1 and Chromium. `npm run check:submissions` starts isolated Wrangler/static servers, runs byte/security/expiry/rate tests and desktop/320px/landscape upload-review-download-delete flows, and stops only its own processes. Tests use temporary generated keys and ignored `output/submission-test-*` state. CI runs the same suite.

For manual work, supply `ADMIN_KEY` through an ignored `submissions/.dev.vars` file, run `node multiplayer/node_modules/wrangler/bin/wrangler.js dev --config submissions/wrangler.jsonc --port 8788`, and start the static server with `SUBMISSION_ENDPOINT=http://127.0.0.1:8788`. PowerShell: `$env:SUBMISSION_ENDPOINT='http://127.0.0.1:8788'` then `npm start`. Never put a production key in a test fixture.

## Release and key recovery

Deploy this Worker with the existing Free account; set `ADMIN_KEY` using `wrangler secret put ADMIN_KEY --config submissions/wrangler.jsonc` over stdin. Use a cryptographically random key of at least 32 bytes. Retain an owner-only copy outside tracked source and never print it in logs, PRs, screenshots or chat. Rotate it with the same secret command if lost/shared; existing submissions remain intact. The secret also salts daily network hashes, so rotation resets that day's per-IP bucket but not global limits.

Set only the public Worker URL in `assets/submission-config.js`. Test a Pages preview, release through the existing Pages workflow and verify the public form and authenticated inbox. Delete only explicitly identified QA uploads. Do not run rate/flood tests against production. To disable submissions, set the frontend endpoint to null and deploy, and remove/rotate the Worker key if server-side shutdown is needed. Preserve live review data and the existing arcade-room Worker.

Approved downloads are candidates only: verify speaker, cut, loudness, background music and permission, then add selected files and source notes to creator configuration in a separate tested release.
