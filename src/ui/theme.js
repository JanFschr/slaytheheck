import {applyThemeAssetVariables} from './theme-assets.js'

const STORAGE_KEY = 'slaytheheck.appearance.v1'

export const APPEARANCE_OPTIONS = [
	{
		id: 'classic',
		label: 'Classic',
		defaultSkin: 'default',
		skins: [{id: 'default', label: 'Classic'}],
	},
	{
		id: 'cyberpunk',
		label: 'Cyberpunk',
		defaultSkin: 'base',
		skins: [
			{id: 'base', label: 'Arcology'},
			{id: 'chrome', label: 'Chrome'},
			{id: 'netrunner', label: 'Netrunner'},
			{id: 'swarmwright', label: 'Swarmwright'},
			{id: 'ghost', label: 'Ghost'},
			{id: 'synth', label: 'Synth'},
		],
	},
]

function themeDefinition(themeId) {
	return APPEARANCE_OPTIONS.find((theme) => theme.id === themeId) || APPEARANCE_OPTIONS[0]
}

function normalizeAppearance(value = {}, fallback = {}) {
	const requestedTheme = value.theme || fallback.theme || 'classic'
	const theme = themeDefinition(requestedTheme)
	const requestedSkin = value.skin || fallback.skin || theme.defaultSkin
	const skin = theme.skins.some((candidate) => candidate.id === requestedSkin) ? requestedSkin : theme.defaultSkin
	return {theme: theme.id, skin}
}

function readStoredAppearance() {
	if (typeof localStorage === 'undefined') return null
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

function queryAppearance() {
	if (typeof window === 'undefined') return {}
	const params = new URLSearchParams(window.location.search)
	return {
		theme: params.get('theme') || undefined,
		skin: params.get('skin') || undefined,
	}
}

export function getAppearance() {
	if (typeof document === 'undefined') return {theme: 'classic', skin: 'default'}
	return normalizeAppearance({
		theme: document.documentElement.dataset.theme,
		skin: document.documentElement.dataset.skin,
	})
}

export function setAppearance(nextAppearance, {persist = true} = {}) {
	const current = getAppearance()
	const appearance = normalizeAppearance(nextAppearance, current)

	if (typeof document !== 'undefined') {
		const root = document.documentElement
		root.dataset.theme = appearance.theme
		root.dataset.skin = appearance.skin
		root.style.colorScheme = 'dark'
		applyThemeAssetVariables(appearance)
	}

	if (persist && typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
		} catch {
			// Appearance still works for the current page when storage is unavailable.
		}
	}

	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('slay:appearance-change', {detail: appearance}))
	}

	return appearance
}

export function initializeAppearance(defaultAppearance = {}) {
	const stored = readStoredAppearance() || {}
	const query = queryAppearance()
	const requested = {
		theme: query.theme || stored.theme || defaultAppearance.theme,
		skin: query.skin || stored.skin || defaultAppearance.skin,
	}
	return setAppearance(normalizeAppearance(requested, defaultAppearance), {persist: false})
}

export function setTheme(themeId) {
	const theme = themeDefinition(themeId)
	return setAppearance({theme: theme.id, skin: theme.defaultSkin})
}

export function setSkin(skinId) {
	return setAppearance({...getAppearance(), skin: skinId})
}

export function skinsForTheme(themeId) {
	return themeDefinition(themeId).skins
}
