# Slay the Heck

Slay the Heck is a mobile-first browser deck-building roguelike based on the open-source [Slay the Web](https://github.com/oskarrough/slaytheweb) project.

The current fork is being used to evolve the original engine into a more deterministic, data-driven roguelike with touch-first combat, seeded runs, build items, strategic map rooms and a small mechanics test pack before larger deck archetypes are built.

## Play

- Main game: https://janfschr.github.io/slaytheheck/
- Mechanics MVP: https://janfschr.github.io/slaytheheck/mvp/
- Fixed developer test run: https://janfschr.github.io/slaytheheck/mvp-dev/

The Mechanics MVP is intentionally small. It contains Heat, Drone and Void mechanics plus matching relics/equipment so new systems can be tested before committing to a full content set.

The fixed developer run always uses seed `mechanics-mvp-dev-v1` and forces this route:

```text
Start
  ↓
Combat: Scrap Hound + Heat Leech
  ↓
Event: Calibration Shrine
  ↓
Merchant
  ↓
Elite: Reactor Sentinel
  ↓
Treasure
  ↓
Campfire
  ↓
Boss: Core Architect
```

This route disables local autosave on purpose. Reloading it starts the same clean run again, including the same map, encounters, shop inventory and deterministic rewards.

## Current feature set

The fork currently includes:

- portrait and landscape mobile combat layouts
- touch card selection and fast double-tap play when a card has one valid target
- stable content IDs, card tags, rarity and keyword metadata
- deterministic seeded RNG streams for map generation, encounters, card IDs, shuffles, rewards, shops and summons
- a shared action runtime used by cards, enemies, relics and equipment
- serializable pause/resume choice actions
- multi-phase bosses, summons and action-authored enemy intents
- relic and equipment registries with reward selection and HUD support
- gold, merchant, event and treasure rooms
- deterministic strategic map routes
- browser-local run autosaves and resume
- URL saves for portable/shareable state
- the Mechanics MVP content pack with 15 test cards, 3 relics, 3 equipment items, 3 normal enemy identities, an elite and a three-phase boss
- GitHub Pages CI/build/deploy from `main`

## Local run saves

Active runs are automatically stored in browser `localStorage`. Core and Mechanics MVP runs use separate save slots.

The saved state includes the deterministic seed/RNG state, map position, deck/hand/piles, HP, gold, relics, equipment, resources and pending runtime choices. The splash screen can resume a local run after a reload.

A completed, abandoned or lost run clears its local slot. The fixed `/mvp-dev/` regression route does not write local saves, so it always starts clean.

## Development

The project uses Bun, Astro, Preact/HTM, Immer, GSAP, AVA and Biome.

```bash
bun install
bun run dev
```

Before finishing a group of changes, run:

```bash
bun run check
bun run test
bun run build
```

Useful routes while developing:

```text
/             normal game
/mvp/         Mechanics MVP; accepts ?seed=<seed>
/mvp-dev/     fixed regression run using mechanics-mvp-dev-v1
/debug/       debug UI
/map-demo/    map demo
```

Useful query parameters in the normal game include `?debug`, `?tutorial`, `?iddqd` and `?hand=Strike,Iron Wave`.

## Repository structure

```text
src/content   card/enemy/dungeon/event/build-item content
src/game      deterministic game state and action runtime
src/ui        Preact/HTM/Astro browser UI
public        static assets
tests         AVA regression tests
notes         design and test-pack notes
```

See [DOCUMENTATION.md](DOCUMENTATION.md) for the architecture and [notes/mechanics-mvp.md](notes/mechanics-mvp.md) for the current mechanics test pack.

## Development direction

The runtime foundation is intentionally close to complete. The next major work is gameplay/content rather than adding more abstract engine layers:

1. use the fixed MVP run to validate Heat, Drone, Void, rewards, economy and boss mechanics
2. tune or remove weak mechanics based on actual runs
3. expand the successful mechanics into full deck archetypes and enemy rosters
4. balance the complete run economy
5. replace the remaining upstream visual identity with the final theme/content direction
6. add broader browser/touch regression testing and later progression/daily-run features

## CI and deployment

Pull requests run AVA tests, Biome and the GitHub Pages build. `main` deploys automatically to GitHub Pages at https://janfschr.github.io/slaytheheck/.

## Upstream and license

This repository is a fork of [oskarrough/slaytheweb](https://github.com/oskarrough/slaytheweb). The original project implemented a browser-based deck-building roguelike inspired by Slay the Spire and provides the foundation this fork builds on.

The repository remains licensed under AGPL-3.0-or-later. See [LICENSE](LICENSE). Existing artwork/typeface attribution inherited from upstream should be reviewed before a final reskin or redistribution of replaced assets.
