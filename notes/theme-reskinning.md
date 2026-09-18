# Theme / Reskin System

The UI separates **layout**, **visual tokens**, and **theme assets**.

## Runtime model

Appearance has two axes:

- `theme`: the global design language (`classic`, `cyberpunk`)
- `skin`: a palette/asset variant within a theme

The state is handled by `src/ui/theme.js` and applied as attributes on `<html>`:

```html
<html data-theme="cyberpunk" data-skin="netrunner">
```

Theme state is persisted in `localStorage` and can be overridden from the URL:

```text
?theme=cyberpunk&skin=ghost
```

Content packs can define defaults:

```js
window.__SLAY_CONTENT_PACK__ = {
  id: 'mechanics-mvp',
  theme: 'cyberpunk',
  skin: 'base',
}
```

User choice wins over the content-pack default. URL overrides win over both.

## CSS architecture

Base component styles remain authoritative for layout and interaction.

- `src/ui/styles/themes.css` owns visual tokens and theme-specific component styling.
- `src/ui/styles/theme-assets.css` consumes asset URL variables and paints scene art, card frames, surfaces and HUD textures.
- `src/ui/theme-assets.js` is the asset manifest/resolver and is the only place a reskin should need to register asset paths.

A reskin should not duplicate combat components or change game state.

### Semantic tokens

The cyberpunk theme overrides existing semantic tokens such as:

- `--color-accent`
- `--color-primary`
- `--color-info`
- `--color-secondary`
- `--color-danger`
- `--color-background`
- `--color-text`
- `--color-panel`
- `--color-panel-strong`

It also exposes theme-local tokens including `--theme-accent`, `--theme-line`, `--theme-glow` and `--theme-surface`.

## Theme asset packs

`src/ui/theme-assets.js` contains a nested manifest. A skin inherits the theme base assets and can override only the slots it needs.

Current slots:

```text
backgrounds.combat
backgrounds.rooms.<roomIndex>
cards.frame
cards.texture
cards.fallbackArt
cards.art.<definitionId>
ui.hudTexture
ui.enemyTexture
ui.panelTexture
```

The resolver converts paths through Astro's configured base URL, so assets work both locally and on the GitHub Pages project path.

### Example: skin-specific scene

```js
chrome: {
  backgrounds: {
    combat: 'images/themes/cyberpunk/backgrounds/chrome.svg',
  },
}
```

### Example: room-specific scene

```js
base: {
  backgrounds: {
    combat: 'images/themes/cyberpunk/backgrounds/arcology.svg',
    rooms: {
      4: 'images/themes/cyberpunk/backgrounds/reactor-sector.svg',
      8: 'images/themes/cyberpunk/backgrounds/corporate-spire.svg',
    },
  },
}
```

Room-specific art falls back to the active skin's `backgrounds.combat` asset.

### Example: card-art override

```js
cards: {
  art: {
    'rook:servo-jab': 'images/themes/cyberpunk/cards/rook/servo-jab.webp',
  },
}
```

`resolveCardArt()` checks a theme override first, then the card's normal `image` field, then the theme fallback art. Existing cards therefore keep working while individual illustrations are replaced incrementally.

### CSS asset variables

When appearance changes, `theme.js` calls `applyThemeAssetVariables()`. This writes URL-valued variables such as:

```text
--theme-asset-combat-background
--theme-asset-card-frame
--theme-asset-card-texture
--theme-asset-hud-texture
--theme-asset-enemy-texture
--theme-asset-panel-texture
```

and per-room combat variables. `theme-assets.css` consumes these variables without changing component markup.

## Current cyberpunk assets

The initial asset pack now includes original lightweight SVG assets for:

- Arcology combat scene
- Chrome combat scene
- Netrunner combat scene
- Swarmwright combat scene
- Ghost combat scene
- Synth combat scene
- technical card frame
- carbon card texture
- fallback card illustration
- HUD grid texture
- enemy panel frame/texture
- generic panel grid texture

These are deliberately vector-based placeholders/first-pass art: tiny downloads, sharp at mobile DPRs, and easy to replace with final WebP/AVIF artwork later without code changes.

## Current cyberpunk skins

- `base` — Arcology cyan / magenta
- `chrome` — amber / red
- `netrunner` — cyan / toxic green
- `swarmwright` — mint / industrial amber
- `ghost` — ice blue / indigo
- `synth` — violet / teal

Character selection can later set the matching skin without changing any component markup.

## Adding a new skin

1. Register the skin in `APPEARANCE_OPTIONS` in `src/ui/theme.js`.
2. Add its palette/token override in `themes.css`.
3. Add only its changed asset slots in `THEME_ASSETS` in `theme-assets.js`.

Example:

```js
example: {
  backgrounds: {combat: 'images/themes/cyberpunk/backgrounds/example.webp'},
  cards: {frame: 'images/themes/cyberpunk/cards/example-frame.svg'},
}
```

Everything not specified inherits from `cyberpunk.base`.

## Adding a new theme

1. Add the theme and its skins to `APPEARANCE_OPTIONS`.
2. Add a new `html[data-theme="..."]` token block.
3. Register its base asset pack in `THEME_ASSETS`.
4. Add only the component overrides required by that visual language.
5. Do not fork gameplay components for cosmetic differences.

## Character mapping

When character selection lands, map character IDs to skins:

```text
rook  -> chrome
hex   -> netrunner
patch -> swarmwright
veil  -> ghost
echo  -> synth
```

Keep theme selection user-controlled; automatic character skins should only change `skin`, not force a different `theme` if the player selected Classic.
