import {assetUrl, imageUrl} from './assets.js'

const THEME_ASSETS = {
	classic: {
		default: {},
	},
	cyberpunk: {
		base: {
			backgrounds: {
				combat: 'images/themes/cyberpunk/backgrounds/arcology.svg',
				rooms: {
					1: 'images/themes/cyberpunk/backgrounds/arcology.svg',
					2: 'images/themes/cyberpunk/backgrounds/arcology.svg',
					3: 'images/themes/cyberpunk/backgrounds/arcology.svg',
				},
			},
			cards: {
				frame: 'images/themes/cyberpunk/cards/frame.svg',
				texture: 'images/themes/cyberpunk/cards/carbon-grid.svg',
				fallbackArt: 'images/themes/cyberpunk/cards/fallback-art.svg',
				art: {},
			},
			ui: {
				hudTexture: 'images/themes/cyberpunk/ui/hud-grid.svg',
				enemyTexture: 'images/themes/cyberpunk/ui/enemy-panel.svg',
				panelTexture: 'images/themes/cyberpunk/ui/panel-grid.svg',
			},
		},
		chrome: {
			backgrounds: {combat: 'images/themes/cyberpunk/backgrounds/chrome.svg'},
		},
		netrunner: {
			backgrounds: {combat: 'images/themes/cyberpunk/backgrounds/netrunner.svg'},
		},
		swarmwright: {
			backgrounds: {combat: 'images/themes/cyberpunk/backgrounds/swarmwright.svg'},
		},
		ghost: {
			backgrounds: {combat: 'images/themes/cyberpunk/backgrounds/ghost.svg'},
		},
		synth: {
			backgrounds: {combat: 'images/themes/cyberpunk/backgrounds/synth.svg'},
		},
	},
}

const CSS_ASSET_SLOTS = {
	'--theme-asset-combat-background': 'backgrounds.combat',
	'--theme-asset-card-frame': 'cards.frame',
	'--theme-asset-card-texture': 'cards.texture',
	'--theme-asset-hud-texture': 'ui.hudTexture',
	'--theme-asset-enemy-texture': 'ui.enemyTexture',
	'--theme-asset-panel-texture': 'ui.panelTexture',
}

const ROOM_BACKGROUND_VARIABLES = Array.from({length: 12}, (_, index) => index + 1)

function isPlainObject(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mergeAssets(base = {}, override = {}) {
	const merged = {...base}
	for (const [key, value] of Object.entries(override)) {
		merged[key] = isPlainObject(value) && isPlainObject(base[key]) ? mergeAssets(base[key], value) : value
	}
	return merged
}

function valueAtPath(object, path) {
	return String(path)
		.split('.')
		.reduce((value, key) => value?.[key], object)
}

function activeAppearance() {
	if (typeof document === 'undefined') return {theme: 'classic', skin: 'default'}
	return {
		theme: document.documentElement.dataset.theme || 'classic',
		skin: document.documentElement.dataset.skin || 'default',
	}
}

export function themeAssetsFor(appearance = activeAppearance()) {
	const themeAssets = THEME_ASSETS[appearance.theme] || THEME_ASSETS.classic
	const base = themeAssets.base || themeAssets.default || {}
	const skin = themeAssets[appearance.skin] || {}
	return mergeAssets(base, skin)
}

export function resolveThemeAsset(slot, {appearance = activeAppearance(), fallback = null} = {}) {
	return valueAtPath(themeAssetsFor(appearance), slot) || fallback
}

export function themeAssetUrl(slot, options = {}) {
	const path = resolveThemeAsset(slot, options)
	return path ? assetUrl(path) : null
}

export function resolveCardArt(card, appearance = activeAppearance()) {
	const assets = themeAssetsFor(appearance)
	const themeArt = assets.cards?.art || {}
	const override = themeArt[card.definitionId] || themeArt[card.name]
	if (override) return assetUrl(override)
	if (card.image) return imageUrl(`cards/${card.image}`)
	if (assets.cards?.fallbackArt) return assetUrl(assets.cards.fallbackArt)
	return imageUrl('cards/fallback.jpg')
}

function cssUrl(path) {
	return path ? `url("${assetUrl(path)}")` : null
}

export function applyThemeAssetVariables(appearance = activeAppearance()) {
	if (typeof document === 'undefined') return
	const root = document.documentElement
	const assets = themeAssetsFor(appearance)

	for (const [variable, slot] of Object.entries(CSS_ASSET_SLOTS)) {
		const value = cssUrl(valueAtPath(assets, slot))
		if (value) root.style.setProperty(variable, value)
		else root.style.removeProperty(variable)
	}

	for (const roomIndex of ROOM_BACKGROUND_VARIABLES) {
		const variable = `--theme-asset-combat-background-room-${roomIndex}`
		const value = cssUrl(assets.backgrounds?.rooms?.[roomIndex] || assets.backgrounds?.combat)
		if (value) root.style.setProperty(variable, value)
		else root.style.removeProperty(variable)
	}
}

export {THEME_ASSETS}
