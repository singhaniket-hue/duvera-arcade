# Private room service

Status: Four, Draw and Quiz implementations tested locally against Wrangler's Durable Object runtime; **none of the multiplayer services is deployed**. The latest follow-up requests local implementation/testing only. Existing CLI OAuth token expired; the scoped renewal consent timed out while awaiting the owner. Static production sets `ArcadeRooms.endpoint` to null and labels rooms unavailable. Do not describe local multiplayer results as public multiplayer verification.

## Architecture and limits

The existing Pages site stays static. A separate `duvera-arcade-rooms` Worker routes random UUID invites to one SQLite-backed `FourRoom` Durable Object. The same original rules module serves solo, bot and authoritative moves. No account, matchmaking or global chat. Tokens contain two cryptographically random UUIDs; they are stored privately in the room and in each browser, sent as the first WebSocket message, never placed in invite URLs or snapshots. Opening the same seat in another tab replaces the old connection. Storage-denied users can play solo; an online seat then lasts only while that tab retains its token.

Hibernating WebSocket callbacks and serialized attachments restore seats after eviction. No polling/game loop. Revisions reject stale/duplicate moves. Server validates turns, columns and terminal states. Both players ready/rematch; starting player alternates. A disconnect reserves the seat, pauses legal input and permits a timeout claim after 60 seconds. Leaving closes the room. Two seats, eight transient sockets, 1 KB incoming messages, 12 messages/second/socket, 10 room creations/hour/hashed IP. Unauthenticated sockets expire after 10 seconds. Rooms expire after 24 hours or 30 minutes with everyone disconnected; alarms delete room data. Rate-gate data expires in one hour. No game history is accumulated.

HTTP quota/service failures show a solo fallback; WebSocket persistence failures close connections with a retry explanation. Browser Origin checks restrict service use to this Pages project, creator domain and local development. Opaque invites are private but anyone you share the link with can take the unclaimed second seat.

## Cost preflight, checked 2026-09-24

The account dashboard shows **Workers Free / $0**. No upgrade was made. [Cloudflare's current pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) includes 100,000 DO requests/day, 13,000 GB-s/day, 100,000 SQLite rows written/day, 5 million read/day and 5 GB storage. Free quota exhaustion fails requests rather than enabling paid overages. Incoming WebSocket messages have a 20:1 billing ratio; outgoing messages are uncharged. State writes and alarm updates consume SQLite writes.

Planning assumption (not measured production traffic): 50 concurrent rooms for one hour, ten-minute matches, roughly 40 moves per match means 300 matches/day. At roughly 50 persisted events × two writes each, allow about 30,000 row writes/day plus rate gates and cleanup. At 100 rooms for eight hours, writes could exceed the free allowance. Reconnect churn, abuse, repeated rooms and active handler duration also matter. Other existing Workers share account allowances. Benchmark hosted usage before promoting a large creator stream; do not upgrade without approval.

## Run and deploy

1. `npm ci --prefix multiplayer`
2. `npm run dev --prefix multiplayer` (port 8787), then at repository root `npm run check:four`.
3. Renew Wrangler login with only account/user read, Workers/script write and Pages write scopes. The owner must approve Cloudflare's consent screen. Never copy tokens into repository files.
4. `npm run deploy --prefix multiplayer` creates the separate Worker and SQLite migration on the Free plan. Verify the returned workers.dev URL and account plan; do not choose a paid upgrade.
5. Set the **public URL only** in `assets/room-config.js`, update landing availability text, commit. Build and upload a Pages preview, then run full `TEST_BASE_URL=<preview> ROOM_ENDPOINT=<worker> npm run check:four` in independent contexts. Release the identical build through existing Pages direct upload only after it passes.
6. Repeat on the public domain. Retain previous Pages deployment for rollback and use `wrangler rollback` for Worker code if needed; do not roll back/delete the SQLite migration or live room data.

`check-four.mjs` exercises all rule outcomes and complete bot games. `check-rooms.mjs` uses real room methods with fake transport/clock to cover expiry, grace timeout, storage restoration and abuse cases. `four-browser-check.mjs` exercises real independent browsers and a running Worker, with no game-state shortcut for match outcomes. Physical mobile/Safari and production latency/quota behavior remain additional review.

## Draw and Quiz party service (local only)

A second SQLite class, `PartyRoom` (migration v2), shares bounded sessions, hibernating sockets, authenticated reconnect, room expiry and host transfer across Draw and Quiz. Game-prefixed object names keep their namespaces separate. Existing FourRoom migration v1 and protocol remain intact. Public Pages configuration still has no Worker endpoint.

Limits: 8 players, 16 sockets including pending authentication, 16 KiB incoming gameplay messages (UTF-8 bytes), 20 messages/second/socket, 256 recent successful command IDs, 24-hour room lifetime, 30-minute empty-room cleanup, 60-second disconnected-seat grace and 10-second authentication timeout. Only an authenticated Draw host's pack command may use up to 64 KiB, enough for 60 words and six aliases each including Unicode. The browser explains an oversized pack before sending it. The existing hashed-IP creation gate remains 10 rooms/hour across all games. Leaving/kicking removes the token; active-room joins are rejected. Disconnect transfers hosting immediately; Draw skips a disconnected drawer's turn. Quiz timers continue and answers remain locked on reconnect.

A paused Draw room can be unlocked by its host to admit replacements; newly admitted players join the remaining drawing queue. Resuming requires three connected players and locks the room again. Permanent departures immediately close a round when every remaining eligible participant has answered/guessed. Quiz ends with earned scores intact and unlocks invitations when fewer than two seats remain. Temporary disconnections retain the 60-second reconnection grace; expiry uses the same permanent-departure rules.

Draw batches up to 32 normalized points every 80 ms, with at most 120 gestures and 8,000 points per canvas. Server-side brush/coordinate/sequence checks reject forged and out-of-order batches. Undo/clear advance a canvas version; stale batches cannot reappear after them. Correct guesses, including punctuation/spacing variants, are replaced with a neutral success message until round reveal. Word choices and the secret word are sent only to the drawer; aliases remain server-side. Selected words and overlapping aliases cannot repeat within a match. The default packs offer fresh choices each turn; a short custom pack may offer previously unchosen options, with fewer than three choices as it runs out. Exhaustion finishes the match rather than recycling revealed answers. Packs allow 3–60 custom words with up to six aliases each, including Devanagari combining marks; hints count graphemes. Feed history is capped at 30 entries and all user text is rendered with textContent.

Ordinary state updates omit canvas history. Ink uses ordered deltas; reconnect and explicit sync send a full canvas only to that participant. Undo, clear and new-canvas transitions include the replacement canvas. Rejected commands neither mutate game state nor write storage/broadcast, except when processing the command also advances a real server deadline. State-less authentication alarms only reschedule. Persistence of **accepted** ink remains unchanged for recovery; this fix does not promise a reduction in the dominant drawing-write estimate below.

Quiz uses server-generated question IDs per round and server clocks. Correct indexes, explanations and scores are withheld until all eligible answers arrive or the 20-second deadline closes. The host advances through explanations. Ten rounds produce final standings. The public practice pack is separate and never fetched by the multiplayer client. Source files are public for review; this is casual private-room play, not an anti-cheat competition.

### Usage implications before any future release

Draw persists each accepted batch for recovery. A conservative continuous-drawing estimate is 12.5 batches/second × 600 seconds for an eight-turn match = 7,500 state writes, plus alarm writes. Budget roughly 15,000 row writes per busy room/match before guesses and cleanup. Five simultaneous ten-minute rooms could approach 75,000 writes; fifty would exceed the Free daily allowance. This is an estimate, not measured hosted usage. Drawing payload size also amplifies storage I/O and outgoing traffic. Quiz is much lighter: around 80 answers plus transitions per eight-player match, roughly hundreds of writes. Measure on a hosted preview and consider coarser persistence before opening Draw to a large stream; do not upgrade automatically.

[Current pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) and [SQLite limits](https://developers.cloudflare.com/durable-objects/platform/limits/) were checked 2026-09-24. Free usage is account-wide. Rate limits and quota failures remain visible to users; no paid infrastructure or credentials were added.

### Repeatable local verification

Run `npm run check:multiplayer` at the repository root after installing root Playwright/Chromium and `npm ci --prefix multiplayer`. It creates its own isolated Worker storage under `output/room-test-*`, runs all three multiplayer suites, and shuts down its own process tree. Existing dev rooms and limits are not reset. Read README.md for the two-terminal manual-play setup. Every participant needs an independent browser context/profile; tabs in one profile intentionally reconnect to the same seat.

`npm run check:party-rigor` additionally runs the edge, seeded-command fuzz, eight-player WebSocket and phone suites contributed in PR #3, with recovery/byte-bound/persistence checks added alongside the fixes. CI runs it with `FUZZ_GAMES=6000` (400 steps per game), separately from the baseline suite. Set `SCREENSHOT_DIR=output/playwright/party-rigor` for phone evidence. Both runners use fresh isolated Worker storage and stop their own Worker. Keep source unchanged during a run: Wrangler hot reload intentionally disconnects active sockets.
