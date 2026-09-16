// A collection of utility functions.

let entropyCounter = 0

/**
 * Non-gameplay entropy for legacy utility callers such as temporary UI ids.
 * Gameplay code should use game/rng.js and an explicit run seed instead.
 */
function systemRandom() {
	const cryptoApi = globalThis.crypto
	if (cryptoApi?.getRandomValues) {
		const value = new Uint32Array(1)
		cryptoApi.getRandomValues(value)
		return value[0] / 4294967296
	}
	entropyCounter = (entropyCounter + 0x6d2b79f5) >>> 0
	let value = ((Date.now() >>> 0) ^ entropyCounter) >>> 0
	value ^= value << 13
	value ^= value >>> 17
	value ^= value << 5
	return (value >>> 0) / 4294967296
}

/**
 * Creates a random-looking string for ids.
 * @param {number} [a]
 * @returns {string}
 */
export function uuid(a) {
	return a
		? (a ^ ((systemRandom() * 16) >> (a / 4))).toString(16)
		: // @ts-ignore
			([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid)
}

/**
 * Returns a new, shuffled version of an array.
 * See https://bost.ocks.org/mike/shuffle/
 * @param {Array} array
 * @param {() => number} [randomFn]
 * @returns {Array}
 */
export function shuffle(array, randomFn = systemRandom) {
	array = array.slice()
	let m = array.length
	let t
	let i

	while (m) {
		i = Math.floor(randomFn() * m--)
		t = array[m]
		array[m] = array[i]
		array[i] = t
	}

	return array
}

/**
 * Returns a range of numbers.
 * Example: range(3) === [1,2,3] or range(3, 6) === [6,7,8]
 * range(3, 2) = [2,3,4]
 * @param {*} size
 * @param {*} startAt
 * @returns {Array<number>}
 */
export function range(size, startAt = 0) {
	return [...Array(size).keys()].map((i) => i + startAt)
}

/**
 * @param {number} from
 * @param {number} to
 * @param {() => number} [randomFn]
 * @returns {number} a random number within the range
 */
export function random(from, to, randomFn = systemRandom) {
	if (from === to) return from
	return from + Math.floor(randomFn() * (to - from + 1))
}

export function clamp(x, lower, upper) {
	return Math.max(lower, Math.min(x, upper))
}

/**
 * @param {Array|string} list
 * @param {() => number} [randomFn]
 * @returns {any} random item from the list
 */
export function pick(list, randomFn = systemRandom) {
	const values = Array.from(list)
	return values[Math.floor(randomFn() * values.length)]
}

/**
 * A queue is a list of objects that are inserted and removed first-in-first-out (FIFO).
 */
export class Queue {
	constructor(items = []) {
		this.list = items
	}
	/** Enqueue and add an item at the end of the queue. */
	enqueue(item) {
		this.list.push(item)
	}
	/** Dequeue and remove an item at the front of the queue. */
	dequeue() {
		return this.list.shift()
	}
}

/**
 * @param {Function} func
 * @param {number} delay
 * @returns {function}
 */
export function throttle(func, delay) {
	let lastCall = 0
	return (...args) => {
		const now = Date.now()
		if (now - lastCall < delay) return
		lastCall = now
		return func(...args)
	}
}

/**
 * @param {Function} func
 * @param {number} wait
 * @param {object} options
 * @prop {boolean} options.leading
 * @prop {boolean} options.trailing
 * @returns {function & {cancel: function}}
 */
export function debounce(func, wait, options = {}) {
	let timeout
	const executedFunction = function (...args) {
		const later = () => {
			timeout = null
			if (options.trailing) func.apply(this, args)
		}
		const callNow = options.leading && !timeout
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
		if (callNow) func.apply(this, args)
	}
	executedFunction.cancel = () => {
		clearTimeout(timeout)
		timeout = null
	}
	return executedFunction
}

/** Turns a timestamp into a string like "16. Dec 2024" */
export function formatDate(timestamp) {
	return new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		// month: 'short',
		// timeStyle: 'short',
		hour12: false,
	}).format(new Date(timestamp))
}

/** Turns a timestamp into a "X days ago" string */
export function timeSince(timestamp) {
	const seconds = Math.floor((Date.now() - timestamp) / 1000)
	if (seconds < 60) return 'just now'
	if (seconds < 120) return 'a minute ago'
	if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
	if (seconds < 7200) return 'an hour ago'
	if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
	if (seconds < 172800) return 'yesterday'
	return `${Math.floor(seconds / 86400)} days ago`
}

/**
 * Converts Set to array if needed, otherwise returns input
 * Handles both actual Sets and serialized Sets (empty objects {})
 * @param {Set|Array|any} value
 * @returns {Array|any}
 */
export function setToArray(value) {
	if (value instanceof Set) return Array.from(value)
	// Handle serialized Sets that became empty objects
	if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
		return []
	}
	return value
}
