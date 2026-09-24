# Draw and Quiz defect follow-up — 2026-09-24

This report records the local fix phase. The fixes subsequently merged through PR #4 and were deployed with hosted verification; see the [Cloudflare release record](CLOUDFLARE-RELEASE.md) for current status.

Scope: local fixes and regression tests for the eleven issues reported in [PR #3](https://github.com/singhaniket-hue/duvera-arcade/pull/3). No Pages upload, Worker deployment, DNS change, plan upgrade, or media replacement. Production remains `24b90eaa7c56f452182398662cbffcc7b9a0259d`.

Branch: `fix/party-edge-cases`, based on verified remote `creator/moosher` at `de423c0ffd7d597c33d50fc25beb1932ff758ebc`. PR #3 test commit `405d6c9` was cherry-picked as `13010cc`, retaining its author. PR #3 itself and its branch were not modified. Commit `8705c42` contains the fixes and evidence.

## Changes

| Report | Correction |
| --- | --- |
| 1. Draw stuck below three players | An unlocked paused room admits replacements, adds them to the drawer queue, and resumes with three connected participants. |
| 2. Quiz stuck below two players | Permanent departure ends the match with earned scores intact, unlocks invitations, and enables a new match. |
| 3. Departed players hold rounds open | Permanent departure immediately rechecks eligible answers/guesses. Temporary disconnections retain the existing grace period. |
| 4. Repeated secret words | Selected words and overlapping aliases cannot recur in a match. Default-pack choices are fresh; short custom packs shrink choices and end on exhaustion. |
| 5. Near-miss spoilers | Punctuation and spacing variants count as correct and produce only the neutral success message. |
| 6. Hindi text and hints | Custom words accept combining marks; hints count graphemes and never reveal a one-grapheme answer. |
| 7. Valid packs exceed message limit | Authenticated host pack commands have a bounded 64 KiB envelope; gameplay remains 16 KiB. Limits count UTF-8 bytes. Client preflight explains oversized input without sending it. |
| 8. Rejections write storage | Unsuccessful commands do not record IDs, mutate state, write storage, or broadcast. A real deadline transition is still persisted even when accompanying input is rejected. |
| 9. Guesses resend the canvas | Ordinary updates omit canvas history; ordered ink deltas continue. Only canvas replacements and participant-specific reconnect/sync send full history. |
| 10. Phone question off-screen | Quiz scrolls a newly opened question into view, without scrolling on ordinary answer updates. |
| 11. Small palette buttons | Colour buttons are at least 44 × 44 CSS pixels and wrap at narrow widths. |

The full-canvas wrong-guess fixture fell from approximately 2.6 MB to 9.8 KB total across eight recipients (over 99% less). Accepted ink still persists on every batch; the existing storage-cost estimate remains applicable. No claim is made about measured hosted costs or latency.

## Verification

All commands below passed on the final code locally:

- `npm run check:party-rigor`: **24 edge checks, 31 real-WebSocket protocol checks, 27 phone checks**; **6,000 games × 400 randomized steps** with no broken invariants. Set `FUZZ_GAMES=6000` to reproduce the larger batch; the default is 400 games. Command sequences are seeded; cryptographic word/question shuffling is still random.
- `npm run check:multiplayer`: Four rules/lifecycle and 47 browser checks; 22 Draw rules, 11 shared transport/lifecycle checks, 34 Draw browser checks; 54 Quiz rules/practice checks and 60 Quiz browser checks. Independent browser contexts, replacement joins, restart, refresh, input rejection, secrecy, timers, and storage failures included.
- Original mobile **100**, creator mobile **122**, existing desktop **38**, Stack **47**, Dash **44**, Smash **47** browser checks, plus their mechanics suites.
- Static checks, creator logic checks, and static build.

The rigorous suite now runs in GitHub CI with 6,000 fuzzed games and uploaded phone screenshots. Existing assertions about active-room join rejection remain; two old departure expectations were updated to assert the new recoverable state and an actual replacement/restart.

One intermediate phone run lost sockets when the agent edited Worker source during the run; its Worker log confirms a hot reload. The clean rerun with unchanged source passed all 27 phone checks. No failures were suppressed, and the initial failing suite was run before fixes.

Screenshots from local Chromium (touch emulation, not physical Safari):

- [Draw desktop result](screenshots/party-fixes/draw-desktop.png)
- [Moosh Draw narrow phone and 44 px palette](screenshots/party-fixes/draw-phone.png)
- [Quiz question visible at 320 px](screenshots/party-fixes/quiz-phone.png)
- [Quiz short landscape](screenshots/party-fixes/quiz-landscape.png)

## Next task / rollback

Review and merge the fix branch into `creator/moosher`; human local multiplayer playtest remains worthwhile. Existing clips remain manually reviewed and unchanged; new Draw/Quiz event mappings still need subjective listening. Draw, Quiz, and all multiplayer remain **not deployed**. Cloudflare authorization and a tested hosted preview are still required for a later release; do not reuse an expired OAuth consent link.

No production rollback is necessary. Revert the fix commit to undo these changes on the development branch; keep the tests to expose the original failures. If a later release occurs, retain the previous Pages deployment and follow the Worker rollback instructions in `multiplayer/README.md`, preserving SQLite migrations and room data.
