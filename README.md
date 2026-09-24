# Duvera Arcade

A static browser arcade with **Clumsy Bird**, **2048** and **Hextris**. No account, database, multiplayer server or API key is required.

## Play locally

With Node.js 18 or newer:

```sh
npm start
```

Open http://localhost:4173. There are no npm dependencies to install. Alternatively, serve this directory with any static web server. Use HTTP rather than opening HTML files directly from disk.

## Games

| Game | Player route | Controls | License |
| --- | --- | --- | --- |
| Clumsy Bird | `/play.html?game=clumsy-bird` | Space, click or tap; M to mute | GPL-3.0 |
| 2048 | `/play.html?game=2048` | Arrow keys or swipe; R to restart | MIT |
| Hextris | `/play.html?game=hextris` | Left/right arrows or tap sides; down to accelerate; P to pause | GPL-3.0-or-later |

The player header keeps a route back to the menu. Click the game or use **Focus game** if keyboard input is focused on the header. Full-screen mode is available where the browser supports it.

Scores are local to this browser and hostname, not a shared leaderboard. Clearing browser data resets them; restricted storage can prevent persistence. All game assets are bundled locally. No advertising or analytics scripts are loaded by the arcade.

## Build and verify

```sh
npm run check
npm run build
```

`npm run check:mobile` drives all three games with emulated touch on a 320px phone, a Pixel 5 and two landscape iPhones (taps, swipes, pause, header layout, overflow, board and title placement). It needs Playwright with Chromium (`npm install --no-save playwright && npx playwright install chromium`, or a global install). Set `SCREENSHOT_DIR` to save a screenshot of each game on each screen.

GitHub Actions runs all three commands on every pull request and push to `master`, and uploads the screenshots as a build artifact.

The build produces `dist/`, which can be hosted by any static host. Build output is not committed.

## Cloudflare Pages

Connect `singhaniket-hue/duvera-arcade` through **Pages → Import an existing Git repository**. Use:

| Setting | Value |
| --- | --- |
| Production branch | `master` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |

These settings describe a generic deployment. Preserve any existing `leo.duvera.app` site. For the Moosher deployment, use a separate `duvera-moosher` Pages project, build the tested `creator/moosher` revision while PR #2 remains unmerged, and add **moosher.duvera.app** through that project's **Custom domains**. A direct upload of the contents of `dist` is also supported; it does not automatically deploy later Git commits. Domain registration at Namecheap does not require a change because Cloudflare manages the zone.

## Repository layout

- `index.html`, `assets/`, `play.html`: arcade menu and player shell.
- `games/clumsy-bird/`: original Clumsy Bird package, plus a small script that makes taps around the canvas count.
- `games/2048/`: 2048, with host-appropriate attribution and separate save keys.
- `games/hextris/`: Hextris, with legacy ads, analytics and external reporting removed.
- `credits.html`, `THIRD_PARTY.md`: creators, licenses and integration changes.
- `scripts/`: dependency-free local server, checks and static build.

The first optional creator edition is Moosher; multiplayer remains deferred. The included games are independent packages, so additional games can be added without changing their gameplay code.

## Licensing

The arcade shell is GPL-3.0. Each game retains its upstream license and attribution. See [THIRD_PARTY.md](THIRD_PARTY.md) and the license files within each game. The import preserves Clumsy Bird's original Git history.

## Moosher creator edition

Open `/creators/moosher/` for the fan-made edition of @Moosherr. It includes Moosh Flap (a generated character sprite), Moosh 2048, Moosh Spin, original short dialogue extracts, and an audio review page at `/creators/moosher/sounds.html`.

Each player route also accepts `&creator=moosher`. Original routes remain unchanged; `?creator=default` explicitly opts out on a creator hostname. Once that hostname is connected to the static deployment, `moosher.duvera.app` or `moosherr.duvera.app` opens the creator edition automatically. This code does not create DNS records or deploy the website.

Four audio candidates have been cut from automatic-caption timestamps, totaling 7.85 seconds. The site owner has confirmed manual playback review; new game event mappings still need a brief playtest. Laughter, crying and shouting are still unsourced; none is fabricated or cloned. See [source and review notes](creators/moosher/SOURCES.md). Disable individual clips or change voice volume on the review page; the player header mutes reactions. Reaction cooldowns prevent a voice clip on every tap, and the M key in Moosh Flap also suppresses reactions. Each edition keeps separate saved scores.

Verification:

```sh
npm run check:creator
npm run check:desktop
CREATOR_EDITION=moosher SCREENSHOT_DIR=moosher-screenshots npm run check:mobile
```

CI runs both the original and Moosher mobile suite. The creator checks cover registry routing, opt-out, audio gating, cooldowns, mute/disabled settings, real 2048 merges, isolated save keys, required assets and sprite dimensions. Automated checks cannot approve the voice, source speaker or emotional timing; use the sound-review page and play the game yourself.

The desktop suite checks keyboard/mouse play, retries, persistence, audio playback and navigation. Rare score/end states use deterministic fixtures through the real game logic. Both browser suites accept `TEST_BASE_URL=https://moosher.duvera.app/` to check the deployed site and `SCREENSHOT_DIR` to save evidence. The mobile suite defaults to the generic edition; set `CREATOR_EDITION=moosher` for the personalized edition. Touch tests emulate Chromium devices, rather than claiming physical iOS/Safari coverage.

## Original additions

Stack (`/play.html?game=stack&creator=moosher`, or `/games/stack/?creator=moosher`) is an original, static timing game. Tap, click or press Space to drop; P pauses, M mutes voice. Overhang is trimmed, perfect placements build a streak, and best height is saved separately per creator. Hiding the page pauses the run until Resume.

Run `npm run check:stack` for deterministic mechanics and desktop/touch browser tests. The suite supports `TEST_BASE_URL` and `SCREENSHOT_DIR`. Precision edge cases and high towers use documented deterministic fixtures, with actual buttons/keyboard/touch driving the browser integration.

Release status and rollback: [expansion progress](docs/EXPANSION-PROGRESS.md).

Four (`/play.html?game=four&creator=moosher`) includes easy/normal bots, keyboard/touch play, pause and retry. Private-room implementation is in `multiplayer/`; online is disabled in production until Worker deployment authorization is renewed and hosted tests pass. See [room deployment and cost notes](multiplayer/README.md). `npm run check:four` expects the local Worker on port 8787 (start with `npm run dev --prefix multiplayer`). CI runs the full room suite; `SOLO_ONLY=1` explicitly checks only the released solo scope on a hosted deployment and reports that omission.
