# Slay the Heck — Card Art Style Guide v1

## Status

This document defines the **binding visual specification** for card artwork in **Slay the Heck**.
It is the canonical reference for:

- AI-assisted card art generation
- manual art direction
- quality review
- file naming and asset management
- batch generation, splitting and import
- later theme/skin integration in the UI

The guide is intentionally strict. The goal is to keep dozens or hundreds of generated images looking like they belong to one coherent game.

---

## 1. Art goal

Card art is not full concept art and not splash art. It must be a **highly readable, emotionally distinctive, mobile-friendly illustration** that communicates its subject in under one second.

The player should feel that the world is:

- industrial
- synthetic
- dangerous
- physically intimate with technology
- procedural rather than magical
- cyberpunk, but grounded in a decaying megastructure/arcology instead of a glossy neon party city

Technology should feel used, patched, practical and dangerous.

---

## 2. Core visual pillars

### 2.1 Industrial cyberpunk

Preferred environmental language:

- arcology interiors
- maintenance sectors
- server rooms
- fabrication bays
- conduits, ducts and structural steel
- utility lighting
- worn composite materials
- security architecture
- terminals and service machinery

Avoid clean utopian sci-fi and generic futuristic city skylines as the default visual identity.

### 2.2 Combat clarity

Every piece should have one clear focal idea.

At card size the player should still immediately perceive:

- the main subject
- the action or state
- the silhouette
- the color mood
- the direction of force or intent

### 2.3 Stylized seriousness

The art should be stylized but not comedic, toy-like or cute.

Target tone:

- serious
- sharp
- dramatic
- slightly oppressive
- technical
- cool rather than flamboyant

### 2.4 Mobile readability

Large readable shapes are more important than micro-detail.
A piece that only works when viewed full-screen fails the card-art requirement.

---

## 3. Master style definition

The default style is:

> **Stylized 2D digital cyberpunk card illustration with medium detail, clean readable silhouettes, dramatic focused lighting, restrained linework, dark industrial environments, controlled neon accents, and no text.**

### Mandatory characteristics

- 2D digital illustration
- stylized rather than photorealistic
- serious rather than cartoon-comedic
- light graphic/cel-shaded influence is acceptable
- clean silhouette hierarchy
- strong intentional lighting
- controlled glow effects
- backgrounds subordinate to the main subject
- premium game-card illustration rather than generic concept art

### Explicitly not wanted

- photorealism
- anime-poster aesthetics
- thick cartoon outlines
- toy-like rendering
- pixel art
- flat vector-poster look
- glossy 3D marketing-render look
- fantasy parchment, magic runes or medieval ornamentation
- muddy painterly chaos
- stock-photo posing

---

## 4. Detail level

Target: **medium detail**.

### Rules

- one dominant primary subject
- at most 1–2 secondary support elements
- fine surface details only where they improve material or functional readability
- less detail away from the focal area
- no equal detail density across the entire frame

### Small-size QA

When reduced strongly in size, the image should still communicate:

- what is happening
- where to look
- the silhouette
- the dominant color identity

If understanding depends on tiny details, regenerate or simplify.

---

## 5. Linework and edges

Preferred treatment:

- light to medium linework
- edges reinforced where useful
- no thick cartoon outline around every object
- no fully soft line-less painterly rendering

The purpose of linework is clarity, not style dominance.

Avoid:

- heavy comic inking
- scratchy sketch lines
- oversoft edges everywhere
- line treatment stronger than lighting and shape design

---

## 6. Lighting

Lighting is a major storytelling tool.

### Preferred

- directional key light
- strong value contrast
- controlled rim/edge light
- screen or neon light only where motivated
- clear subject/background separation

### Common light families

- cold cyan terminal light
- violet/magenta atmospheric edge light
- amber industrial work light
- red alarm light
- toxic green network/interface light

### Avoid

- flat even illumination
- excessive bloom everywhere
- muddy low-contrast scenes
- random rainbow neon

---

## 7. Color system

The world is dark, but the full card pool must not collapse into identical blue-black images.

### Global base palette

Use mostly:

- deep navy
- black
- charcoal
- graphite
- desaturated steel blue
- dark teal
- muted purple

### Accent rule

Each artwork should normally use:

- one primary accent color
- optionally one secondary accent color

Do not use every neon color in every image.

### Accent families

#### Chrome / brute cyberware

- amber
- orange
- hot red
- metallic silver

#### Netrunner / breach / intrusion

- cyan
- toxic lime
- icy teal
- violet highlights

#### Swarmwright / fabrication / drones

- cool cyan
- industrial yellow
- steel grey
- electric white

#### Ghost / stealth / contingency

- ice blue
- muted cyan
- charcoal/black
- occasional red warning edges

#### Synth / memory / identity

- violet
- magenta
- teal
- pale white-blue

#### NULL / forbidden systems

- black-violet
- glitched teal
- ultraviolet magenta
- unnatural cold highlights

---

## 8. Composition

### Core rules

- one dominant focal subject
- centered or slightly off-center
- strong visual flow toward the focal point
- calm background structure
- readable foreground/midground/background separation
- large shapes first, small details second

### Preferred framing

Default to:

- medium shot, or
- close action shot

The main figure/object should usually fill roughly **50–75% of the frame**.

### Avoid

- wide landscape compositions
- multiple equally strong focal points
- crowded group scenes
- tiny subjects
- excessive edge clipping

---

## 9. Subject hierarchy

Use a balanced mix of three main card-art categories.

### 9.1 Character action

Examples:

- punch
- shot
- slash
- hacking gesture
- stealth takedown
- deployment motion

### 9.2 Device/object focus

Examples:

- drone
- implant
- weapon module
- hacking rig
- memory core
- shield emitter

### 9.3 Effect focus

Examples:

- breach field
- glitch rupture
- shield pulse
- NULL distortion
- energy slash
- data fracture

Most cards should remain literal enough that the player intuitively understands the card's concept. Reserve abstract/metaphorical imagery mainly for rare powers and NULL effects.

---

## 10. Backgrounds and environments

Backgrounds must communicate the world without competing with the card's main idea.

### Preferred motifs

- industrial arcology interiors
- maintenance corridors
- server rooms
- fabrication bays
- vent shafts
- loading sectors
- surveillance spaces
- security checkpoints
- terminal clusters
- structural steel
- cables and conduits
- vapor/smoke
- monitor and holographic light spill

### Rules

- lower contrast than the focal subject
- simpler than the focal subject
- less detail near image edges
- support action and mood

### Avoid

- generic empty gradients
- lush nature imagery
- fantasy landscapes
- generic neon skyline as a constant background
- visual clutter competing with the main subject

---

## 11. Visual language by card type

### Attack

Should feel:

- immediate
- forceful
- kinetic
- dangerous

Typical cues:

- motion direction
- impact shapes
- sparks
- weapon/limb emphasis
- sharper contrast

### Skill

Should feel:

- tactical
- procedural
- defensive or manipulative
- setup-oriented

Typical cues:

- interfaces
- deployments
- shield systems
- preparation
- active devices

### Power

Should feel:

- ongoing
- systemic
- identity-defining
- state-changing

Typical cues:

- active rigs
- mode shifts
- persistent fields
- empowered states
- larger, more iconic compositions

---

## 12. Character flavor overlays

These are flavor layers, not separate art styles. All characters must still look like they belong to one game.

### Chrome

Mood:

- impact
- physical augmentation
- overload
- brute technological force

Visual motifs:

- reinforced limbs
- servo movement
- heat shimmer
- sparks
- redline glow
- amber/red industrial accents

### Netrunner

Mood:

- precise intrusion
- system control
- surgical digital aggression

Visual motifs:

- interface halos
- signal arcs
- terminal light
- compromised devices/enemies
- cyan/lime/violet accents

### Swarmwright

Mood:

- engineering
- modular construction
- battlefield automation

Visual motifs:

- drone shells
- manipulators
- fabrication sparks
- modular parts
- cyan + utility yellow + steel

### Ghost

Mood:

- concealment
- patience
- precision
- quiet threat

Visual motifs:

- obscured silhouettes
- narrow light beams
- shadow-heavy composition
- restrained visual noise
- ice-blue accents

### Synth

Mood:

- unstable selfhood
- duplication
- memory
- elegant synthetic cognition

Visual motifs:

- afterimages
- mirrored forms
- duplicated silhouettes
- memory fragments
- violet/teal/white-blue accents

### NULL

Mood:

- forbidden
- wrong
- dangerous
- powerful
- system-alien

Visual motifs:

- geometry distortion
- signal corruption
- fractured silhouettes
- glitch patterns
- black-violet interference

---

## 13. Format specification

### Aspect ratio

Default card-art ratio:

- **portrait**
- **3:4**

This ratio is authoritative for generation, batching, splitting and import.

### Safe area

Important visual information should stay inside the central **70–80%** of the frame.

Do not place critical silhouettes, hands, weapons or effects directly against the outer edge unless intentionally safe to crop.

### Cropping tolerance

The illustration should tolerate modest edge cropping without losing its meaning.

### Multi-art sheets

When generating 4–6 artworks in one source sheet:

- every panel must behave like an independent 3:4 card image
- panel boundaries must be clear
- no visual element may intentionally cross into another panel
- subjects must remain inside their own safe area

Recommended layouts:

- 2×2 for 4 artworks
- 3×2 for 6 artworks

---

## 14. Content restrictions

Standard card art must contain no:

- text
- typography
- logos
- UI widgets
- card borders or mockups inside the artwork
- watermarks
- speech bubbles
- comic-panel layouts
- fantasy-medieval props
- meme/joke compositions
- generic corporate stock poses
- over-sexualized pin-up posing

### Human depiction rule

Characters may appear, but:

- action/system/effect is more important than beauty portraiture
- posing should support gameplay meaning
- clothing and gear should be functional to the setting
- faces should not dominate every composition

---

## 15. Batch generation policy

### Preferred batch size

Generate **4–6 artworks per generation run**.

### Grouping

Prefer grouping by:

1. character
2. mechanic family
3. tonal family

Do not mix unrelated aesthetics in a batch when visual consistency is important.

### Early production order

1. starter/basic cards
2. high-frequency commons
3. signature-mechanic cards
4. powers/rares
5. neutral/shared cards
6. NULL cards

### Batch consistency rules

Within one batch keep:

- same rendering style
- same detail density
- same composition discipline
- related palette logic
- related atmosphere

---

## 16. File naming and asset structure

### Naming standard

Use stable slugs based on card identity.

Preferred pattern:

```text
<group>_<card-slug>.png
```

Examples:

```text
chrome_servo-jab.png
chrome_reactive-shell.png
netrunner_ping.png
netrunner_logic-bomb.png
swarmwright_deploy-striker.png
ghost_countershot.png
synth_capture.png
null_recursive-thought.png
```

If formal `definitionId`s exist, they should eventually become the authoritative mapping key in the theme asset registry.

### Target folders

```text
public/images/themes/cyberpunk/cards/
  chrome/
  netrunner/
  swarmwright/
  ghost/
  synth/
  neutral/
  null/
```

### Source sheets

Keep original multi-art generation sheets separately for traceability, for example:

```text
notes/art-generation/source-sheets/
```

If source sheets become too large for the repository, move them to external storage while keeping a lightweight batch manifest in the repo.

---

## 17. Acceptance QA

Every generated artwork must pass this review before being accepted.

### Readability

- Is the main subject instantly identifiable?
- Is the silhouette readable at small size?
- Is the focal point obvious?
- Is there too much visual noise?

### Style fit

- Does it match the industrial arcology cyberpunk world?
- Does it avoid fantasy drift?
- Does it match the established rendering style?
- Would it sit naturally beside other accepted cards?

### Function fit

- Does it visually match the card's mechanic/name?
- Does it feel appropriate for Attack / Skill / Power?
- Is the visual intensity appropriate for the card's importance?

### Technical fit

- no text
- no watermark
- correct 3:4 composition
- safe area respected
- clean crop compatibility

### Hard rejection triggers

Reject/regenerate when:

- the image is muddy
- the focal subject is too small
- detail density is too high
- it looks like another game
- fantasy elements creep in
- color hierarchy is chaotic
- background overwhelms subject
- text-like artifacts appear

---

## 18. Prompt construction

Every generation prompt should explicitly contain:

- main subject
- action/state
- environment
- color accents
- composition
- style constraints
- no-text requirement

### Standard prompt skeleton

```text
Stylized 2D cyberpunk card illustration, medium detail, clear silhouette, dramatic lighting, no text, portrait 3:4 composition, [main subject/action], set in a dark industrial arcology environment with [background cues], [primary accent color] and [secondary accent color] highlights, readable focal subject, clean composition, mobile-friendly premium game card art.
```

### Example

```text
Stylized 2D cyberpunk card illustration, medium detail, clear silhouette, dramatic lighting, no text, portrait 3:4 composition, a reinforced cybernetic fighter driving a servo-powered punch forward, metal arm in sharp focus, sparks and red-orange overclock glow, set in a dark industrial arcology maintenance corridor, readable focal subject, clean composition, premium mobile game card art.
```

### Negative guidance

Prompts should discourage:

- text
- watermark
- fantasy elements
- photoreal faces
- multiple scenes
- chaotic clutter
- poster layout
- UI
- logos

---

## 19. Production philosophy

The first production pass does not need perfect isolated masterpieces. It must establish a **coherent and scalable visual language**.

Principles:

- consistency > isolated flashiness
- readability > hyper-detail
- strong coherent batches > unrelated masterpieces
- card usability > fullscreen spectacle

Later refinement is expected, but first-pass accepted art must already obey this guide.

---

## 20. Short generation shorthand

Use this quick style string when preparing batch prompts:

> **Stylized 2D cyberpunk card art, medium detail, serious tone, readable silhouette, dramatic focused lighting, dark industrial arcology backgrounds, one strong focal subject, controlled neon accents, no text, no logos, no UI, portrait 3:4, mobile-readable.**

---

## 21. Future extensions

This document can later be extended with:

- per-character mini moodboards
- card-type-specific subguides
- accepted/rejected example sheets
- formal prompt libraries
- batch tracking tables
- review annotations
- rare/power-card premium composition rules
- generation manifests mapping source sheet → split files → card `definitionId`

Until then, this document is the baseline standard for all Slay the Heck card-art production.
