# Moosher deployment verification — 24 September 2026 (IST)

- Public arcade: https://moosher.duvera.app/
- Public sound review: https://moosher.duvera.app/creators/moosher/sounds.html
- Provider preview: https://duvera-moosher.pages.dev/creators/moosher/
- Cloudflare Pages project: `duvera-moosher`, direct upload, static assets only.
- Deployed source: `creator/moosher` at `22491d262bba4754334935399efbca0c3d2f5459`.
- Public revision evidence: https://moosher.duvera.app/deployment.json
- PR #1 is merged. PR #2 remains an open draft; this deployment does not merge it into master.
- Later commit `0ceb08f6f2a4d24beb6111c865a4ac8efda501b0` only makes the desktop test wait for hosted navigation. It does not change deployed assets. This report and screenshots also do not change deployed assets.

## Hosting and DNS

Cloudflare's custom-domain panel reports **Active / SSL enabled**. Its domain workflow added one proxied CNAME, `moosher` → `duvera-moosher.pages.dev`. Existing DNS records, nameservers and the six pre-existing hosting projects were preserved. No Leo project or DNS record existed in the inspected account/zone. Namecheap remains the registrar. No paid service, database or backend was introduced.

The previous Pages blocker did not recur with direct upload. The existing Pages GitHub integration listed only two other repositories, so it was not expanded. Later Git pushes do **not** automatically update this direct-upload project. Build and test the intended revision, then upload the contents of `dist/` through this project's Create deployment flow. Do not deploy the current generic master to this project before the creator changes have been merged.

## Results

| Check | Local | Actual public domain |
| --- | --- | --- |
| Original mobile suite | 100 passed, 0 failed | 100 passed, 0 failed |
| Moosher mobile suite | 122 passed, 0 failed | 122 passed, 0 failed |
| Desktop gameplay/persistence/audio | 38 passed | 38 passed |
| Static checks, creator logic, build | Passed | All 190 deployed files matched the built files by SHA-256 |

The provider preview also passed the 38 desktop checks and all 190 file comparisons. [CI for the deployed source passed](https://github.com/singhaniket-hue/duvera-arcade/actions/runs/35912737068).

Public checks additionally verified HTTPS root routing, direct player and standalone game URLs without creator query parameters, cache-disabled refreshes, all four MP3s decoding and playing one at a time, source timestamp links, and the 320px landing layout. No page script errors or failed asset requests were reported by the full public suites.

Desktop tests exercise real Space, mouse, arrow, restart and pause input. Phone tests emulate touch in Chromium at 320px portrait, Pixel 5, iPhone 12 landscape and iPhone SE landscape. This is not physical-device or Safari certification. Rare scoring/end states use deterministic fixtures through actual collision, merge, matching and game-over logic. Background-tab stopping is covered by the creator logic check's visibility event fixture; it is not a subjective listening test.

## Fixes

- Preserve the generic opt-out through game cards and back navigation on the creator hostname.
- Stop an active creator reaction when Flap's M mute control is used.
- Stop active in-game clips when disabled, and stop playback at volume zero.
- Recognize the first successful Flap run as a new best and play its reaction.
- Add desktop regressions, failed-request checks, public-host testing, and build revision metadata.

The supported melonJS `.extend()` adapter and Hextris's immediate input-handler switch remain intact. Creator and generic scores/state remain isolated.

## Audio judgment remains pending

The four clips are still caption-selected candidates. Technical playback passes do not verify the speaker, word boundaries, background sounds, loudness, suitability or comedic timing. Human review/replacement remains available on the public sound-review page. No verified laughter, crying or shouting has been added; no voice cloning was used. Fan-made labeling, provenance and creator-media rights notices remain in place.

## Screenshots captured on the public domain

[Desktop landing](screenshots/moosher-public/desktop-home.png) · [Desktop Flap sprite](screenshots/moosher-public/desktop-flap.png) · [320px 2048](screenshots/moosher-public/phone-320-2048.png) · [Short landscape 2048](screenshots/moosher-public/landscape-2048.png) · [Short landscape Spin](screenshots/moosher-public/landscape-spin.png)
