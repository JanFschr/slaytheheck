# Slay the Heck

Slay the Heck is a mobile-first browser deck-building roguelike focused on deterministic runs, touch-first combat, buildcrafting and fast iteration on new mechanics.

The project is currently in active development. The engine foundation is largely in place; current work focuses on validating gameplay systems before expanding into full deck archetypes and a final visual identity.

## Play

- Main game: https://janfschr.github.io/slaytheheck/
- Mechanics MVP: https://janfschr.github.io/slaytheheck/mvp/
- Fixed developer test run: https://janfschr.github.io/slaytheheck/mvp-dev/

Repository: https://github.com/JanFschr/slaytheheck

Issues and feedback: https://github.com/JanFschr/slaytheheck/issues

## Mechanics MVP

The Mechanics MVP is a deliberately small content pack used to test the new runtime and build systems before creating a much larger card pool.

It currently contains:

- 15 test cards across Heat, Drone and Void mini-archetypes
- matching relics and equipment
- deterministic card rewards and shop inventory
- gold, merchant, event, treasure and campfire rooms
- normal encounters, an elite and a three-phase boss
- visible Heat, Drone and Void combat resources
- seeded runs and local browser saves

### Fixed dev run

For reproducible manual testing, use:

https://janfschr.github.io/slaytheheck/mvp-dev/

This route always uses the seed `mechanics-mvp-dev-v1` and follows the same linear sequence:

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

The dev route intentionally disables local autosave. Reloading or restarting it produces the same clean run again, including the same encounters, shop inventory, rewards and RNG progression.

The normal `/mvp/` route remains a regular seeded run and keeps local autosave enabled.

## Current feature set

- portrait and landscape mobile combat layouts
- compact portrait enemy HUD and bottom action bar
- touch card selection and fast double-tap play when a card has one valid target
- stable content IDs, card tags, rarity and keyword metadata
- deterministic seeded RNG streams for map generation, encounters, card IDs, shuffles, rewards, shops and summons
- shared action runtime for cards, enemies, relics, equipment and runtime triggers
- serializable pause/resume choice actions
- action-authored enemy intents, summons and multi-phase bosses
- relic and equipment registries with deterministic rewards
- gold economy, merchant, events and treasure rooms
- strategic seeded map routes
- browser-local run autosaves and resume
- URL-based portable/shareable saves
- dedicated Mechanics MVP and fixed regression run
- automated AVA, Biome, Astro build and GitHub Pages deployment

## Local run saves

Active runs are automatically saved in browser `localStorage`.

The save contains the complete serializable run state, including:

- seed and deterministic RNG progress
- dungeon and current map position
- player HP and powers
- deck, hand, draw, discard and exhaust piles
- gold
- relics and equipment
- Mechanics MVP resources
- pending runtime choices

Normal runs and Mechanics MVP runs use separate save slots. The splash screen offers a continue action when a local run exists.

A completed, abandoned or lost run clears its corresponding local save. The fixed `/mvp-dev/` route does not write local saves.

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

Useful local routes:

```text
/             normal game
/mvp/         Mechanics MVP; accepts ?seed=<seed>
/mvp-dev/     fixed regression run using mechanics-mvp-dev-v1
/debug/       debug UI
/map-demo/    map demo
```

Useful query parameters include `?debug`, `?tutorial`, `?iddqd` and `?hand=Strike,Iron Wave`.

## Repository structure

```text
src/content   cards, encounters, dungeons, events, shops and build items
src/game      deterministic game state, RNG and action runtime
src/ui        Preact/HTM/Astro browser UI
public        static assets
tests         AVA regression tests
notes         design and Mechanics MVP notes
```

See [DOCUMENTATION.md](DOCUMENTATION.md) for architecture details and [notes/mechanics-mvp.md](notes/mechanics-mvp.md) for the current MVP test plan.

## Development direction

The runtime foundation is intentionally close to complete. The current priority is validating and expanding gameplay rather than adding more abstract engine layers.

1. test Heat, Drone and Void in the fixed MVP run
2. tune or remove weak mechanics based on real runs
3. expand successful mechanics into full deck archetypes
4. grow the enemy and boss roster around those archetypes
5. balance rewards, gold, shops and run difficulty
6. replace the remaining inherited visual identity with the final Slay the Heck theme
7. add broader browser/touch regression coverage and later progression/daily-run features

## CI and deployment

Pull requests run the automated test and formatting checks plus the production Astro build. The `main` branch deploys automatically to:

https://janfschr.github.io/slaytheheck/

## Project history and license

Slay the Heck started as a fork of the open-source Slay the Web project and has since diverged substantially in runtime architecture, deterministic systems, mobile UI, economy and gameplay tooling.

Current development, issues, documentation and playable builds belong to this repository. Historical attribution remains available through the Git history and license information.

The project is licensed under AGPL-3.0-or-later. See [LICENSE](LICENSE).
