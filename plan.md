# Slay the Heck roadmap

## Runtime foundation

The runtime foundation is considered complete once PR #8 lands:

- deterministic run RNG and isolated streams
- stable content IDs, tags, rarity and keywords
- shared card/enemy/relic/equipment action lifecycle
- recursive triggers with loop protection
- deterministic summons and multi-phase bosses
- serializable player choices with pause/resume continuations
- card and option choice UI for portrait and landscape

From this point forward, prefer adding content and product systems over new core abstractions. Extend the runtime only when a concrete gameplay feature cannot be expressed with the existing action/trigger/choice model.

## Product implementation order

### 1. Relics and equipment vertical slice

Make the existing trigger hooks visible and playable.

- registries and stable IDs
- inventory/run state
- 10–15 relics
- 8–12 equipment items
- reward acquisition UI and HUD
- tag-driven synergies and meaningful trade-offs

Exit condition: a run can produce clearly different builds even with a similar deck.

### 2. Run economy and room variety

Turn map routing into a strategic decision.

- gold/currency
- merchant/shop room
- event/question room
- treasure/reward room
- deterministic event pools and shop inventories
- card remove/upgrade/buy flows through runtime choices

Exit condition: choosing a route changes resources, deck quality and build direction.

### 3. Three real deck archetypes

Use the stable tags and choice runtime to author the first original content set.

Target roughly 40–60 total cards across three overlapping archetypes, for example:

- Tech / charge / draw
- Bio / poison / sacrifice
- Drone / summon / combo

Archetypes should overlap enough that hybrid builds are possible.

Exit condition: at least three recognizably different successful build patterns exist.

### 4. Enemy and boss content

Exercise the action-based intent and boss-phase systems.

- 8–12 normal encounters
- 3–5 elites
- 2–3 multi-phase bosses
- summons, ally buffs, curses, intent changes and phase transitions

Exit condition: enemy mechanics force different tactical answers rather than only changing damage numbers.

### 5. Full reskin and identity

Replace inherited Slay the Web presentation after the gameplay language is stable.

- final setting and terminology
- card frames and iconography
- backgrounds and enemy art
- fonts, sounds and music
- semantic theme tokens completed across remaining legacy styles
- package/repository/homepage metadata renamed

Exit condition: the game no longer reads visually or textually as a Slay the Web reskin.

### 6. Daily/shared runs and progression

Expose the deterministic engine to players.

- visible/shareable seed
- seeded run links
- daily challenge seed
- difficulty/ascension modifiers
- unlocks and lightweight meta progression

Exit condition: runs can be compared/replayed by seed and players have reasons to return.

### 7. Polish and release hardening

Do the expensive presentation work after systems/content are stable.

- effect/animation coordinator for complex action sequences
- Playwright touch/orientation/browser coverage
- accessibility pass
- PWA/offline verification
- performance and asset optimization
- balance simulation using deterministic seeds

Exit condition: mobile portrait, landscape and desktop are release-ready and regressions are covered automatically.
