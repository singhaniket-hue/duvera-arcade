# Website copy audit — 2026-09-25

The public copy follows [SlopMonster](https://github.com/ItsssssJack/SlopMonster), pinned at `f261dbf11c2a206ecd8780c070a46dae64edd8be`. Its unmodified Python checker and MIT license are in `scripts/vendor/slopmonster/`; neither ships in the website build.

Scope: both arcade menus, all nine game pages and their custom instructions/status copy, player shell, 404, credits, sound settings, visitor clip form and private review page. Existing game names, artwork, reviewed audio, source captions and upstream attribution remain intact. Source-caption text is labeled as automatic, not a verified transcript.

Changes remove repetitive promotional fragments and describe actual controls. Room capacities now include the host. Downloading does not extend an approved clip's 90-day retention. The old missing-reactions section now links to the working submission form. Hextris starts its unpopulated score displays at zero instead of sample scores. Form instructions are visible beside the fields rather than disappearing as input placeholders.

All 17 HTML pages pass the pinned checker at 5/5. `--allow-proof` is used for tested game counts, room capacities, file limits and retention periods; there are no testimonials or invented audience figures. This is a style check, not proof that prose was written by a human.

The required rival-model editing pass was attempted through Claude CLI twice, but returned `Not logged in`. It did not run successfully. The copy was manually reviewed and checked with the original linter; no claim is made that the full rival-model workflow completed.

Run `python scripts/check-copy.py` and `node scripts/visitor-browser-check.mjs`. The browser check covers the visible copy, all menu links, loaded artwork, 320px and short landscape layouts, direct links/hard refreshes, sound settings and the upload/inbox pages. The existing gameplay and security suites remain separate and unchanged.

Release tracking and the retained production rollback are recorded in `EXPANSION-PROGRESS.md`.
