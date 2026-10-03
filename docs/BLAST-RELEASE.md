# Blast / Moosh Blast

Built against `creator/moosher` at `92b666f9e3f81195d3a0f26a30ec5e1699bd0fe9`. This adds the tenth game to both menus. It is a new original bomb-arena game, with no Bomberman assets or source code.

## Play

- Creator: `/play.html?game=blast&creator=moosher`
- Standalone: `/games/blast/?creator=moosher`
- Generic: `/games/blast/?creator=default`
- Solo: you versus three bots. Arrows/WASD move; Space plants a bomb.
- Local two-player: two people on one keyboard, plus two bots. P1 WASD/Space; P2 arrows/Enter. No online room integration in this version.
- Mobile solo: hold the directional buttons to move and tap Drop Bomb.
- P or the pause button pauses, M toggles the existing creator voice setting. Backgrounding pauses simulation and clears held input.

Bombs have a 2.4-second fuse and create cross-shaped blasts. Stone blocks stop flames; crates stop a ray and are destroyed. Bombs chain. The owner can leave their planted bomb but cannot walk back through it. Three upgrades increase capacity, blast reach, and movement speed. Bots avoid threatened cells and check for an escape route before placing bombs. Maps have protected starting exits. Last survivor wins; multiple survivors at three minutes draw. Solo rounds end when the human is eliminated. Solo wins use isolated, storage-safe local persistence.

The arena uses original canvas drawing, existing Higgsfield facial expressions and existing reviewed creator clips. No new media generation or new server is required. Shared-keyboard mode requires a keyboard; the on-screen controls operate P1 only. Physical multi-key rollover depends on the keyboard.

## Validation

- 15 engine checks, including walls/crates, fuse, owner damage, chain reactions, shared crate snapshots, power-ups, pause, simultaneous final deaths, timeout, bot escape, and invariants over 100 seeded simulated bot matches.
- 47 Chromium browser checks: desktop, 320px portrait, 568px landscape, actual keyboard/touch movement and bombing, pause/resume, loss/retry, wins/reload, audio settings, independent local-player controls, background pause, blocked storage, and generic edition.
- Static syntax and 264 asset/link checks, existing creator logic checks, production build, and all 18 public-page copy checks pass locally.
- Screenshots: [desktop](screenshots/blast/desktop.png), [phone](screenshots/blast/phone.png), [landscape](screenshots/blast/landscape.png).

Browser tests use emulated touch; this is not physical Safari certification. Existing audio clips were previously reviewed by the owner; timing of their use in this new game remains a subjective human-playtest item.

## Deployment

This document is not a production deployment claim. The established Pages project uses direct uploads, so committing this game does not publish it. After review, use the existing build and Pages release procedure, verify `/deployment.json`, the creator and generic menu cards, direct route and hard refresh, and one real round on the public domain. No Worker migrations, backend deployment, DNS edits or paid services are needed. Rollback is the previous Pages production deployment. Run `npm run check:blast` to reproduce the new-game checks.
