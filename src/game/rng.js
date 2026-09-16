/**
 * Small deterministic pseudo-random number generator for reproducible game content.
 * A run owns one stable seed and derives independent streams for maps, encounters,
 * deck shuffles, rewards and any future procedural subsystem.
 */

let fallbackSeedCounter = 0

/** @param {string|number} seed */
export function hashSeed(seed) {
	const text = String(seed)
	let hash = 2166136261
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i)
		hash = Math.imul(hash, 16777619)
	}
	return hash >>> 0
}

/**
 * Derive a readable, stable child seed without sharing mutable RNG state between
 * unrelated systems. Adding reward rolls must therefore never change the map.
 * @param {string|number} seed
 * @param {...(string|number)} parts
 */
export function deriveSeed(seed, ...parts) {
	return [String(seed), ...parts.map((part) => String(part))].join(':')
}

/**
 * Produce a deterministic id from the same seed material used by the run.
 * @param {string} prefix
 * @param {string|number} seed
 * @param {...(string|number)} parts
 */
export function deterministicId(prefix, seed, ...parts) {
	return `${prefix}-${hashSeed(deriveSeed(seed, ...parts)).toString(36)}`
}

/**
 * @param {string|number} seed
 * @returns {{seed: string, next: () => number, int: (min: number, max: number) => number, pick: <T>(list: T[]) => T, shuffle: <T>(list: T[]) => T[], getState: () => number}}
 */
export function createRng(seed) {
	const normalizedSeed = String(seed)
	let state = hashSeed(normalizedSeed)

	function next() {
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}

	function int(min, max) {
		if (!Number.isInteger(min) || !Number.isInteger(max)) throw new Error('RNG bounds must be integers')
		if (max < min) throw new Error(`RNG max ${max} must be >= min ${min}`)
		return min + Math.floor(next() * (max - min + 1))
	}

	function pick(list) {
		if (!Array.isArray(list) || list.length === 0) throw new Error('Cannot pick from an empty list')
		return list[int(0, list.length - 1)]
	}

	function shuffle(list) {
		const copy = list.slice()
		for (let i = copy.length - 1; i > 0; i--) {
			const j = int(0, i)
			const value = copy[i]
			copy[i] = copy[j]
			copy[j] = value
		}
		return copy
	}

	return {
		seed: normalizedSeed,
		next,
		int,
		pick,
		shuffle,
		getState: () => state,
	}
}

/**
 * Generates the initial seed for a new run. The run is deterministic after this
 * value has been stored. Math.random is deliberately not used anywhere in the
 * RNG layer so gameplay never accidentally falls back to the global PRNG.
 * @returns {string}
 */
export function createRunSeed() {
	const cryptoApi = globalThis.crypto
	if (cryptoApi?.getRandomValues) {
		const values = new Uint32Array(2)
		cryptoApi.getRandomValues(values)
		return `${values[0].toString(36)}-${values[1].toString(36)}`
	}
	fallbackSeedCounter++
	return `${Date.now().toString(36)}-${fallbackSeedCounter.toString(36)}`
}
