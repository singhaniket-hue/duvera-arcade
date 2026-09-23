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

## Cloudflare Pages (deployment pending)

Connect `singhaniket-hue/duvera-arcade` through **Pages → Import an existing Git repository**. Use:

| Setting | Value |
| --- | --- |
| Production branch | `master` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |

After deployment, add `leo.duvera.app` under the Pages project's **Custom domains** and complete Cloudflare's DNS setup. Domain registration at Namecheap does not require a change if Cloudflare already manages the zone.

## Repository layout

- `index.html`, `assets/`, `play.html`: arcade menu and player shell.
- `games/clumsy-bird/`: original Clumsy Bird package, plus a small script that makes taps around the canvas count.
- `games/2048/`: 2048, with host-appropriate attribution and separate save keys.
- `games/hextris/`: Hextris, with legacy ads, analytics and external reporting removed.
- `credits.html`, `THIRD_PARTY.md`: creators, licenses and integration changes.
- `scripts/`: dependency-free local server, checks and static build.

Personalization and multiplayer are deferred. The included games are independent packages, so additional games can be added without changing their gameplay code.

## Licensing

The arcade shell is GPL-3.0. Each game retains its upstream license and attribution. See [THIRD_PARTY.md](THIRD_PARTY.md) and the license files within each game. The import preserves Clumsy Bird's original Git history.
