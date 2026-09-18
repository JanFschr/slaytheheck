# Card Art Batch 001 — QA / Split Manifest

Status: **split complete, QA passed for first-pass import**

Source generation: six-panel cyberpunk sheet generated from `notes/card-art-production-workflow.md` Batch 001.

## Output format

The generated source sheet arrived as a 3×2 layout at 1536×1024, which produced six 512×512 source cells rather than native 3:4 panels. For the first-pass import, each cell was cropped to **384×512 (3:4)** while preserving the main focal subject.

Future six-card generations should prefer a **2-column × 3-row portrait sheet** with each artwork explicitly inset as a 3:4 portrait panel inside its cell, so no 25% horizontal crop is required.

## QA result

| Definition ID | Card | Result | Notes |
|---|---|---|---|
| `mvp:overclock` | Overclock | PASS | Strong chrome/heat identity, clear augmented fighter, excellent orange/red hierarchy. |
| `mvp:vent` | Vent | PASS | Reads as controlled thermal pressure release rather than explosion; strong industrial silhouette. |
| `mvp:deploy-drone` | Deploy Drone | PASS | Drone is dominant and readable; cyan/yellow fabrication language is clear. |
| `mvp:drone-volley` | Drone Volley | PASS | Coordinated fire reads immediately and remains legible after portrait crop. |
| `mvp:blood-bargain` | Blood Bargain | PASS | Strong bodily-cost / illicit-interface mood without excessive gore. |
| `mvp:void-cut` | Void Cut | PASS — review later | Strong motion and NULL palette. Slight risk of reading as fantasy sword magic; keep for first-pass integration and reassess in-card. |

## Split outputs

Production names:

```text
overclock.webp
vent.webp
deploy-drone.webp
drone-volley.webp
blood-bargain.webp
void-cut.webp
```

All first-pass outputs are 384×512 WebP, quality 85.

Target repository paths for import:

```text
public/images/themes/cyberpunk/cards/chrome/overclock.webp
public/images/themes/cyberpunk/cards/chrome/vent.webp
public/images/themes/cyberpunk/cards/swarmwright/deploy-drone.webp
public/images/themes/cyberpunk/cards/swarmwright/drone-volley.webp
public/images/themes/cyberpunk/cards/null/blood-bargain.webp
public/images/themes/cyberpunk/cards/null/void-cut.webp
```

## Next production step

1. Import the six WebP files into the target paths above.
2. Map all six stable `definitionId`s in `src/ui/theme-assets.js`.
3. Verify the artwork in combat-hand mobile layout and deck/reward views.
4. If `Void Cut` reads too fantasy-like in context, regenerate that single card instead of the full batch.
