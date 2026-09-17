# Slay the Heck documentation

This document describes the current architecture of the fork. It supersedes the older Slay the Web notes where the implementation has diverged.

## Project layout

```text
src/content   cards, encounters, dungeons, events, economy, build items, MVP content
src/game      game state, actions, RNG, monsters, rooms and action manager
src/ui        browser UI, Astro pages, touch interaction and save/load helpers
public        static assets
tests         AVA regression tests
notes         design/test-pack notes
```

The game remains intentionally UI-agnostic at its core: the complete playable run lives in one serializable state object and game rules are applied through actions.

## Game state

The state contains everything required to continue a run, including:

- player HP, block and powers
- deck, draw pile, hand, discard and exhaust piles
- dungeon graph, current node and visited path
- deterministic run seed and RNG stream counters
- gold
- relics and equipment
- Mechanics MVP resources such as Heat, Drones and Corruption
- pending player choices and their continuation actions
- content-pack/run-profile metadata

Because this state is serializable, the same representation is used for deterministic testing, URL saves and browser-local saves.

## Actions and the shared runtime

An action is a data object such as:

```js
{type: 'dealDamage', parameter: {target: 'enemy0', amount: 8}}
```

The action runtime resolves these descriptions into deterministic state transformations. Cards, enemy intents, relics, equipment and runtime continuations all use the same action language.

Important capabilities include:

- damage, block, powers, draw, exhaust and energy
- healing and HP costs
- adding cards
- summons
- intent changes
- boss phase changes
- semantic lifecycle triggers
- nested relic/equipment reactions with loop protection

The central queue is managed by `src/game/action-manager.js`. `createNewGame()` exposes `enqueue()` and `dequeue()` around that manager.

## Choice actions

The runtime can pause for player input without storing promises or callbacks in game state.

A `requestChoice` action creates `state.pendingChoice`. Actions that would normally follow it are stored as a serializable continuation. The UI resolves the choice with `resolveChoice`; placeholders are replaced and the resulting actions resume through the same runtime.

This is used by systems such as card removal/upgrades and allows a save to be made while a choice is open.

## Deterministic RNG

A run has one root `state.seed`. Subsystems derive independent RNG streams from that seed so a new roll in one system does not silently reshuffle unrelated systems.

Deterministic systems currently include:

- dungeon topology
- encounters and monster HP/intents
- card instance IDs and deck order
- shuffles
- card rewards
- build-item rewards
- merchant inventory
- treasure/economy rolls
- summons

This is what makes fixed developer runs and future daily/shared seeds reproducible.

## Cards

Card definitions use stable `definitionId` values rather than display names as identity. Card instances still receive their own deterministic IDs.

Cards can define:

- energy cost
- card type
- target
- rarity
- tags/keywords
- one or more runtime actions
- conditions
- upgrade behavior

The legacy core card files live under `src/content/cards/`; newer metadata and Mechanics MVP content are registered through the current content registries.

## Monsters and intents

Monsters now execute ordinary runtime actions instead of relying only on hard-coded combat fields. Legacy intent definitions are normalized for compatibility.

Enemy actions can therefore damage, block, apply powers, alter player resources, summon enemies or transition boss phases.

Bosses may define health/health-ratio thresholds with `onEnter` actions and replacement intent sets. The Mechanics MVP `Core Architect` is the current reference implementation.

## Relics and equipment

Relics and equipment are data-driven build items. Their definitions can subscribe to semantic runtime events such as card plays, damage, kills or other lifecycle points and emit further actions.

Equipment uses slots and replaces the currently equipped item in that slot. Relics are collected independently.

Build rewards and merchant offers are deterministic for a given run state/seed.

## Economy and strategic rooms

Runs can contain:

- Monster rooms
- Elite rooms
- Campfires
- Events
- Merchants
- Treasure
- Bosses

Gold is ordinary run state. Merchant inventory is deterministic and sold/owned state is validated so purchases cannot be repeated incorrectly. Card removal and upgrade services use the runtime choice system.

Events are data-driven and may exchange HP, gold or card changes. Treasure can grant gold and build items.

## Local and URL saves

`src/ui/save-load.js` contains the state serializer.

### Browser-local saves

Active runs autosave to `localStorage`. Each content pack gets its own versioned slot. The splash screen can resume that state after a reload.

The save contains the full deterministic state, including pending choices. Dungeon edges are removed before serialization and reconstructed from stored paths while loading.

A win, loss or explicit abandon clears the active local slot.

### URL saves

The same state can still be encoded into the URL hash. URL saves are useful as portable/shareable saves and take precedence over local resume behavior.

## Mechanics MVP

`/mvp/` starts the experimental Mechanics MVP content pack. It currently contains:

- 15 cards across Heat, Drone and Void mini-archetypes
- 3 MVP relics
- 3 MVP equipment items
- Scrap Hound, Heat Leech and Null Wraith
- Reactor Sentinel elite
- three-phase Core Architect boss
- event, merchant, treasure and campfire routes

`/mvp/?seed=my-seed` starts a reproducible MVP run using a chosen seed.

### Fixed developer regression run

`/mvp-dev/` is a special manual regression route. It always uses:

```text
seed: mechanics-mvp-dev-v1
profile: dev
localSave: false
```

Its single forced route is:

```text
Combat (Scrap Hound + Heat Leech)
→ Calibration Shrine event
→ Merchant
→ Reactor Sentinel elite
→ Treasure
→ Campfire
→ Core Architect boss
```

The fixed profile is designed to exercise the new combat resources, card rewards, build rewards, event choices, shop economy, equipment/relic systems, elite rewards, treasure and boss phases in one short run. Local autosave is disabled so reloading always starts the same clean regression run.

## UI

The browser UI uses Astro pages with Preact/HTM components and GSAP animations.

Mobile combat is touch-first. Portrait mode uses a compact enemy zone, overlapping hand and fixed bottom action bar. Cards can be selected by tap; when only one valid target exists, a fast double-tap can play the card directly.

Reward screens hide the combat hand/HUD, and the player health bar is integrated into the portrait bottom action area.

The UI is still an example frontend over the state/action engine, so gameplay rules should stay in `src/game` or data definitions rather than being implemented in components.

## Development and debugging

Install and run with Bun:

```bash
bun install
bun run dev
```

Repository checks:

```bash
bun run check
bun run test
bun run build
```

The repository uses Biome for formatting/linting and AVA for tests.

Useful routes:

```text
/             core game
/mvp/         seeded Mechanics MVP
/mvp-dev/     fixed manual regression run
/debug/       debug page
/map-demo/    map demo
```

Useful query parameters include:

- `?debug` — skips the normal splash and enables free map navigation
- `?tutorial` — starts tutorial behavior
- `?iddqd` — debug kill/cheat behavior
- `?hand=Strike,Iron Wave` — adds named cards to the starting hand
- `/mvp/?seed=<seed>` — reproducible MVP run

The browser console exposes `window.stw` with the current game, actions, card list and helper commands.

## Tests and CI

The regression suite covers the core action system, deterministic engine behavior, dungeon generation, choice runtime, build items, economy, MVP mechanics and save/load behavior.

Pull requests and `main` are validated by GitHub Actions. The Pages workflow runs tests, Biome and the Astro build before deploying `main` to GitHub Pages.

## Current architectural boundary

The runtime foundation is now intentionally stable enough to prioritize content and playtesting. New abstractions should generally be added only when a concrete card, enemy, event or build mechanic requires them.

Known future product-level work includes larger deck archetypes/enemy rosters, run balance, full reskin/theme replacement, broader touch/browser E2E coverage, daily/shared run UX and meta progression.
