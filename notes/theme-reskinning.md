# Theme / Reskin System

The UI now separates **layout** from **visual identity**.

## Runtime model

Appearance has two axes:

- `theme`: the global design language (`classic`, `cyberpunk`)
- `skin`: a palette/accent variant within a theme

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

Base component styles remain authoritative for layout and interaction. `src/ui/styles/themes.css` is imported last and provides scoped visual overrides.

This means a reskin should not duplicate combat components or change game state.

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
2. Add a scoped token override in `themes.css`:

```css
html[data-theme="cyberpunk"][data-skin="example"] {
  --theme-accent: #...;
  --theme-accent-rgb: ...;
  --theme-accent-2: #...;
  --theme-accent-2-rgb: ...;
}
```

Prefer changing tokens rather than component rules.

## Adding a new theme

1. Add the theme and its skins to `APPEARANCE_OPTIONS`.
2. Add a new `html[data-theme="..."]` token block.
3. Add only the component overrides required by that visual language.
4. Do not fork gameplay components for cosmetic differences.

## Cyberpunk V1 scope

The first cyberpunk pass deliberately removes the old fantasy scene images and reskins:

- combat background
- cards and energy chips
- health bars and enemy panels
- buttons and overlays
- rule/resource HUD and popovers
- menu form controls

It uses CSS-generated grid, haze, scanline and glow layers so the theme works without blocking on new art assets. Dedicated cyberpunk scene/card assets can be introduced later behind the same theme API.

## Follow-up

When character selection lands, map character IDs to skins:

```text
rook  -> chrome
hex   -> netrunner
patch -> swarmwright
veil  -> ghost
echo  -> synth
```

Keep theme selection user-controlled; automatic character skins should only change `skin`, not force a different `theme` if the player selected Classic.
