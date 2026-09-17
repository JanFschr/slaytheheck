# Mechanics MVP

This short content pack exists to test the new runtime and run systems before expanding into full deck archetypes.

It contains:

- 15 cards across Heat, Drone and Void mini-archetypes
- 3 archetype relics and 3 archetype equipment items
- 3 normal enemy identities, 1 elite and 1 three-phase boss
- a short deterministic dungeon with event, merchant, treasure and campfire decisions
- visible combat resources and a restartable seed on `/mvp/`

The pack is intentionally isolated behind `contentPack: 'mechanics-mvp'` so mechanics can be rebalanced, removed or promoted into the main game without contaminating the normal reward pools.

## Free seeded MVP

`/mvp/` starts the short Mechanics MVP with normal branching. A custom seed can be supplied with `?seed=<seed>`.

This route supports local autosave and can resume an in-progress MVP run.

## Fixed developer run

`/mvp-dev/` is the repeatable manual regression run.

Configuration:

```text
seed: mechanics-mvp-dev-v1
profile: dev
local autosave: disabled
```

Forced route:

```text
Start
→ Combat: Scrap Hound + Heat Leech
→ Event: Calibration Shrine
→ Merchant
→ Elite: Reactor Sentinel
→ Treasure
→ Campfire
→ Boss: Core Architect
```

The intent is to test the whole vertical slice in one short run:

- Heat, Drone and Void cards/resources
- multi-enemy targeting and enemy resource actions
- card rewards
- gold collection
- event choices
- deterministic shop inventory and card services
- relic/equipment rewards and replacement rules
- treasure
- campfire choices
- elite rewards
- boss summons and phase transitions

Reloading `/mvp-dev/` always starts a clean run with the same deterministic state. This makes screenshots, bug reports and balance comparisons much easier to reproduce.

When the test content changes in a way that intentionally invalidates the baseline, increment `mechanicsMvpDevSeed` (for example to `mechanics-mvp-dev-v2`) so old observations are not confused with the new baseline.
