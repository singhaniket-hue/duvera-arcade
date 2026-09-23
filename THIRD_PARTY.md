# Third-party notices and integration changes

All games retain their upstream license files and original README documents. The artwork displayed on arcade cards comes from the corresponding game's assets.

## Clumsy Bird

- Source: https://github.com/ellisonleao/clumsy-bird
- Commit: `fae3d487d5102af29fb3f78431cbd45e9b83aed3`
- Author: Ellison Leão and contributors; melonJS engine credits remain in the bundled source.
- License: GPL-3.0, in `games/clumsy-bird/LICENSE.md`.
- Changes: package relocated from repository root into `games/clumsy-bird/`. Added `duvera-touch.js` (2026-09-23), loaded from `index.html`, so presses in the letterbox around the canvas act as presses on the game through melonJS's `me.input.triggerKeyEvent`. Every other original file is byte-for-byte unchanged.

## 2048

- Source: https://github.com/gabrielecirulli/2048
- Commit: `478b6ec346e3787f589e4af751378d06ded4cbbc`
- Author: Gabriele Cirulli and contributors; based on 1024 and inspired by Threes as acknowledged upstream.
- License: MIT, in `games/2048/LICENSE.txt`. Original Clear Sans font files and notices are retained.
- Changes (2026-09-23): replace the claim that this host is the official 2048 site with accurate attribution; namespace save keys under `duvera.2048`; add English language metadata and keyboard semantics to existing action links; on short landscape screens, use the compact board and place it beside the heading (`main.scss`, `helpers.scss` and the compiled `main.css`). Gameplay is unchanged.

## Hextris

- Source: https://github.com/Hextris/hextris
- Commit: `3f4847dc8fd7dab3d1c87e6324b9159d92fbd396`
- Authors: Logan Engstrom, Garrett Finucane, Noah Moroze, Michael Yang and contributors.
- License: GPL-3.0-or-later, as described in the upstream README and `games/hextris/LICENSE.md`.
- Bundled third-party libraries, font files and their embedded notices are retained, including jQuery, Hammer, keypress, JSONfn, js-cookie, Font Awesome and the original fonts.
- Changes (2026-09-23): remove Google ads and analytics, external score reporting, remote script injection, redundant remote font loading, original-host social sharing and store advertisements. Use the bundled fonts. Keep creator credits. Set a relative web-app manifest identity. Add namespaced browser storage with an in-memory fallback, and register the existing touchmove handler as non-passive; anchor the bottom bar to the left edge so it no longer overflows narrow screens; on short landscape screens, move the start-screen high score to the top-right corner so it does not cover the title. Core movement, scoring and match logic are unchanged.

## Arcade shell

The menu, player shell, build/server scripts and verification scripts are distributed under the root GPL-3.0 license. Game package licenses remain separate; this document does not replace any upstream notice.
