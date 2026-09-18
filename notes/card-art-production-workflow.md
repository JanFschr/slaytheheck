# Slay the Heck — Card Art Production Workflow

This document tracks production batches for cyberpunk card art. The visual standard is defined in `notes/card-art-style-guide.md`.

## Batch 001 — Mechanics MVP signature cards

The first six artworks are intentionally taken from the current Mechanics MVP starter deck. They cover the three existing mechanic families in pairs, which makes them useful for validating whether one global art style can still support clearly different accent palettes.

| # | Definition ID | Card | Type | Family | Target file |
|---|---|---|---|---|---|
| 1 | `mvp:overclock` | Overclock | Skill | Heat / Chrome | `public/images/themes/cyberpunk/cards/chrome/overclock.png` |
| 2 | `mvp:vent` | Vent | Skill | Heat / Chrome | `public/images/themes/cyberpunk/cards/chrome/vent.png` |
| 3 | `mvp:deploy-drone` | Deploy Drone | Skill | Drone / Engineering | `public/images/themes/cyberpunk/cards/swarmwright/deploy-drone.png` |
| 4 | `mvp:drone-volley` | Drone Volley | Attack | Drone / Engineering | `public/images/themes/cyberpunk/cards/swarmwright/drone-volley.png` |
| 5 | `mvp:blood-bargain` | Blood Bargain | Skill | NULL / Corruption | `public/images/themes/cyberpunk/cards/null/blood-bargain.png` |
| 6 | `mvp:void-cut` | Void Cut | Attack | NULL / Corruption | `public/images/themes/cyberpunk/cards/null/void-cut.png` |

These six are all present in the current Mechanics MVP starter deck, so accepted art becomes visible immediately in normal MVP combat.

## Art direction per card

### 1. Overclock — `mvp:overclock`

**Visual idea:** a heavily augmented fighter triggering an internal cyberware boost; spinal/arm servos flare to life while the body leans forward into sudden acceleration.

- composition: medium close-up, dynamic forward movement
- primary accent: amber/orange
- secondary accent: hot red
- environment: maintenance corridor / industrial service deck
- visual emphasis: servo activation, heat shimmer, short sparks
- avoid: generic flames; this should read as cyberware overdrive, not fire magic

### 2. Vent — `mvp:vent`

**Visual idea:** superheated cyberware rapidly dumping pressure through mechanical vents; steam and hot vapor burst away while the subject stabilizes behind the release.

- composition: close-medium shot, torso/arm hardware dominant
- primary accent: orange-white heat
- secondary accent: cool cyan ambient light
- environment: dark industrial chamber
- visual emphasis: pressure release, mechanical vent ports, protective posture
- avoid: explosion imagery; the card is controlled heat release

### 3. Deploy Drone — `mvp:deploy-drone`

**Visual idea:** a compact combat drone unfolds or launches from a mechanical bay while its operator remains partially visible in the background.

- composition: drone as the dominant foreground subject
- primary accent: cool cyan
- secondary accent: industrial yellow
- environment: fabrication bay / maintenance platform
- visual emphasis: unfolding mechanical parts, launch movement, compact practical design
- avoid: cute companion robot aesthetics

### 4. Drone Volley — `mvp:drone-volley`

**Visual idea:** several compact drones converge their fire on a single off-frame or partially visible target, creating strong directional lines through the image.

- composition: diagonal attack flow, 2–4 drones, clear target direction
- primary accent: electric cyan
- secondary accent: white/yellow muzzle or beam light
- environment: combat corridor / open industrial shaft
- visual emphasis: coordinated swarm fire, synchronized targeting
- avoid: chaotic dozens-of-drones scene; it must remain readable at card size

### 5. Blood Bargain — `mvp:blood-bargain`

**Visual idea:** a cybernetic user deliberately interfaces a blood-rich biological port with forbidden black-violet circuitry, trading physical vitality for system power.

- composition: close shot on arm/torso interface rather than a face portrait
- primary accent: deep crimson
- secondary accent: ultraviolet / black-violet
- environment: dim terminal alcove or illicit med-tech station
- visual emphasis: bodily cost, invasive connector, dangerous power transfer
- avoid: gore-heavy horror; it should be unsettling cyberpunk, not splatter

### 6. Void Cut — `mvp:void-cut`

**Visual idea:** a precise melee strike leaves a corrupted black-violet data fracture through space and the target silhouette, as if the attack is cutting both matter and system state.

- composition: strong diagonal slash, one dominant attacker/action silhouette
- primary accent: black-violet
- secondary accent: glitched teal / ultraviolet magenta
- environment: dark arcology combat space
- visual emphasis: clean cutting motion, fractured signal geometry, controlled corruption
- avoid: fantasy sword-magic look; the effect should feel technological and system-wrong

## Batch 001 generation layout

Preferred source sheet:

- 3 columns × 2 rows
- six independent portrait 3:4 panels
- no text
- no card frames
- no panel-to-panel bleed
- same rendering/detail style across all six

Suggested panel order:

```text
[ Overclock ] [ Vent ]         [ Deploy Drone ]
[ Drone Volley ] [ Blood Bargain ] [ Void Cut ]
```

## Shared prompt anchor

Use the master art guide plus this common anchor for the full batch:

> Stylized 2D cyberpunk game card illustration, medium detail, serious tone, clean readable silhouette, restrained linework, dramatic directional lighting, dark decaying industrial arcology setting, one clear focal subject per panel, controlled neon accents, mobile-readable composition, no text, no typography, no logos, no UI, no card borders, no watermark, no fantasy elements, not photorealistic, each panel designed as an independent portrait 3:4 artwork.

The six individual card descriptions above should then be appended as panel-specific instructions.

## Acceptance and import flow

1. Generate the six-panel source sheet.
2. Review the sheet against `notes/card-art-style-guide.md`.
3. Regenerate the full sheet or individual failures if style/readability is weak.
4. Split accepted panels into individual 3:4 files.
5. Crop only within the safe-area rules; do not recompose the image aggressively during splitting.
6. Save each file at the target path listed above.
7. Add mappings in `src/ui/theme-assets.js` under the relevant cyberpunk `cards.art` map using the stable `definitionId`.
8. Verify card rendering on mobile size and in at least one combat hand plus one reward/deck view.

## Why Strike and Defend are not in Batch 001

`core:strike` and `core:defend` are extremely visible and should be replaced early, but they are visually generic. Batch 001 is first used to prove the distinctive cyberpunk mechanic language. If the style passes review, Batch 002 should include Strike, Defend and other high-frequency core cards.
