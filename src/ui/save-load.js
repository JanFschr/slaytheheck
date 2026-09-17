import {storePathOnGraph} from '../game/dungeon.js'

const LOCAL_SAVE_VERSION = 1
const LOCAL_SAVE_PREFIX = 'slaytheheck:run'
const DEFAULT_CONTENT_PACK = 'core'

function browserStorage() {
	if (typeof window === 'undefined') return null
	try {
		return window.localStorage
	} catch (err) {
		console.warn('Local storage is not available', err)
		return null
	}
}

function contentPackId(contentPack) {
	return contentPack || DEFAULT_CONTENT_PACK
}

export function localSaveKey(contentPack) {
	return `${LOCAL_SAVE_PREFIX}:v${LOCAL_SAVE_VERSION}:${contentPackId(contentPack)}`
}

/**
 * Helpers to save and load the entire game state.
 * Uses standard JSON.stringify/parse for serialization.
 */

/**
 * Encodes a game state into a string.
 * Strips redundant data (edges) that can be reconstructed on load.
 * @param {object} state
 * @returns {string}
 */
export function encode(state) {
	// Deep clone to avoid mutating original state
	const cloned = JSON.parse(JSON.stringify(state))

	// Strip edges from dungeon graph (they're reconstructed from paths on load)
	if (cloned.dungeon?.graph) {
		cloned.dungeon.graph.forEach((floor) => {
			floor.forEach((node) => {
				delete node.edges
			})
		})
	}

	return JSON.stringify(cloned)
}

/**
 * Decodes a serialized game state string back into an object.
 * Reconstructs edges from paths if needed.
 * @param {string} state
 * @returns {object}
 */
export function decode(state) {
	const decoded = JSON.parse(state)

	// Reconstruct edges from paths
	if (decoded.dungeon?.graph && decoded.dungeon?.paths) {
		decoded.dungeon.paths.forEach((path) => {
			storePathOnGraph(decoded.dungeon.graph, path)
		})
	}

	return decoded
}

function saveSummary(state) {
	return {
		seed: state.seed || null,
		contentPack: state.contentPack || null,
		floor: state.dungeon?.y ?? 0,
		health: state.player?.currentHealth ?? null,
		maxHealth: state.player?.maxHealth ?? null,
		gold: state.gold ?? 0,
		deckSize: state.deck?.length ?? 0,
	}
}

/**
 * Save a run in this browser. Core and content-pack runs use different slots.
 * @param {object} state
 * @param {{storage?: Storage|null, now?: () => Date}} [options]
 * @returns {object|null}
 */
export function saveLocalRun(state, options = {}) {
	const storage = options.storage === undefined ? browserStorage() : options.storage
	if (!storage || !state) return null

	const savedAt = (options.now?.() || new Date()).toISOString()
	const record = {
		version: LOCAL_SAVE_VERSION,
		savedAt,
		...saveSummary(state),
		payload: encode(state),
	}

	try {
		storage.setItem(localSaveKey(state.contentPack), JSON.stringify(record))
		return record
	} catch (err) {
		console.warn('Could not save run locally', err)
		return null
	}
}

/**
 * Load a local run for a content pack.
 * @param {string|null|undefined} contentPack
 * @param {{storage?: Storage|null}} [options]
 * @returns {{state: object, savedAt: string, seed: string|null, contentPack: string|null, floor: number, health: number|null, maxHealth: number|null, gold: number, deckSize: number}|null}
 */
export function loadLocalRun(contentPack, options = {}) {
	const storage = options.storage === undefined ? browserStorage() : options.storage
	if (!storage) return null
	const key = localSaveKey(contentPack)

	try {
		const raw = storage.getItem(key)
		if (!raw) return null
		const record = JSON.parse(raw)
		if (record.version !== LOCAL_SAVE_VERSION || typeof record.payload !== 'string') {
			storage.removeItem(key)
			return null
		}
		return {
			state: decode(record.payload),
			savedAt: record.savedAt,
			seed: record.seed ?? null,
			contentPack: record.contentPack ?? null,
			floor: record.floor ?? 0,
			health: record.health ?? null,
			maxHealth: record.maxHealth ?? null,
			gold: record.gold ?? 0,
			deckSize: record.deckSize ?? 0,
		}
	} catch (err) {
		console.warn('Could not load local run', err)
		try {
			storage.removeItem(key)
		} catch {}
		return null
	}
}

/**
 * Read lightweight local-run information for menus without restoring state.
 * @param {string|null|undefined} contentPack
 * @param {{storage?: Storage|null}} [options]
 */
export function getLocalRunMetadata(contentPack, options = {}) {
	const saved = loadLocalRun(contentPack, options)
	if (!saved) return null
	const {state: _state, ...metadata} = saved
	return metadata
}

/**
 * Delete the local save slot for a content pack.
 * @param {string|null|undefined} contentPack
 * @param {{storage?: Storage|null}} [options]
 */
export function clearLocalRun(contentPack, options = {}) {
	const storage = options.storage === undefined ? browserStorage() : options.storage
	if (!storage) return false
	try {
		storage.removeItem(localSaveKey(contentPack))
		return true
	} catch (err) {
		console.warn('Could not clear local run', err)
		return false
	}
}

/**
 * Encodes a game state and stores it in the URL as a hash parameter.
 * @param {object} state
 */
export function saveToUrl(state) {
	try {
		location.hash = encodeURIComponent(encode(state))
	} catch (err) {
		console.log(err)
	}
}

/**
 * Reads a game state from the URL and decodes it.
 * @returns {object}
 */
export function loadFromUrl() {
	const state = decodeURIComponent(window.location.hash.split('#')[1])
	return decode(state)
}
