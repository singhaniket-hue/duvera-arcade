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
- Changes (2026-09-23): remove Google ads and analytics, external score reporting, remote script injection, redundant remote font loading, original-host social sharing and store advertisements. Use the bundled fonts. Keep creator credits. Set a relative web-app manifest identity. Add namespaced browser storage with an in-memory fallback, and register the existing touchmove handler as non-passive; anchor the bottom bar to the left edge so it no longer overflows narrow screens; on short landscape screens, move the start-screen high score to the top-right corner so it does not cover the title. Switch to the in-game tap handler as soon as Play is pressed instead of on a timer, which browsers can defer during touch input and so drop the first taps. Core movement, scoring and match logic are unchanged.

## Arcade shell

The menu, player shell, build/server scripts and verification scripts are distributed under the root GPL-3.0 license. Game package licenses remain separate; this document does not replace any upstream notice.

## Optional Moosher edition (2026-09-23)

Follow-up fixes (2026-09-24): generic navigation retains its explicit creator opt-out; creator audio stops immediately on volume zero, disabling the active in-game clip, or Clumsy Bird's existing mute control. The creator adapter initializes the first best-score baseline so a first successful Flap run emits its new-best reaction. Upstream gameplay and the immediate Hextris touch-handler switch remain intact.

The three game HTML entrypoints load optional creator adapters. They are no-ops for the default edition. `assets/creator-game.js` switches Clumsy Bird sprite/title resources, provides a namespaced public `me.save` adapter, and hooks round/score events. For 2048 it changes the heading, scoped saves and reaction hooks; for Hextris it changes canvas title text, scoped storage and reaction hooks. The compiled melonJS engine and gameplay bundles are unchanged. Additional CSS, a creator menu, opt-in profile routing, audio controls and an audition page are provided by Duvera.

Creator artwork was generated with Higgsfield from the public channel photo. Four short audio clips were extracted from the creator’s edited livestream highlights. These media are **not covered by the game code licenses**; source URLs, timestamps, generation IDs and the site owner’s completed gameplay review are documented in `creators/moosher/SOURCES.md`. The edition is labeled fan-made and does not claim endorsement.

## Duvera Stack
Original game engine, drawing code and UI written for Duvera Arcade, licensed GPL-3.0. No external game implementation or new media was imported. Reuses creator artwork and clips under the existing separate provenance and rights notices.

## Duvera Four and rooms
Original GPL-3.0 rules, tactical bot, UI and authoritative private-room code. No third-party Connect Four implementation, artwork, or branding was imported. Existing creator media retain their separate rights notices. Wrangler is a development/deployment dependency (MIT/Apache-2.0 and transitive package licences in its packages); no Wrangler code or credentials ship in the static build.

## Duvera Dash
Original GPL-3.0 runner mechanics, procedural scenery/body illustration and UI. The running character combines newly drawn canvas body/limbs with the existing creator expression images at their original aspect ratio. No new generated media or third-party game assets were used. Existing creator-media attribution and rights remain unchanged.

## Duvera Smash
Original GPL-3.0 physics, five level patterns, power-ups and canvas drawing code created for this arcade. No proprietary levels, branding, artwork or third-party game implementation were copied. Creator reactions reuse the existing separately attributed media.

## Original Draw and party infrastructure

Draw, the shared party client/Worker, and the English/Romanized Hindi word packs are original Duvera implementations under GPL-3.0. Existing creator artwork and clips retain their separate provenance and media-rights notices above. No proprietary game assets, word lists or source code were imported.

## Original Quiz Party

Quiz Party mechanics and the two editable question packs are original Duvera GPL-3.0 work. Questions summarize general game facts; individual primary-source URLs are included in each JSON entry. No proprietary question list, game art, levels or game source was copied. Product names identify their subjects and do not imply endorsement. Existing Moosher media retain separate source and rights notices.

## Website copy update (2026-09-25)

Public instructions and interface copy were rewritten without changing game rules. Hextris now initializes empty score displays at zero. The copy-check tool is SlopMonster by Jack Roberts, MIT licensed, pinned to `f261dbf11c2a206ecd8780c070a46dae64edd8be`. Its unmodified checker and license are retained in `scripts/vendor/slopmonster/` for development checks only; they are not part of the static website build. Source: https://github.com/ItsssssJack/SlopMonster.
