import {createRng, deriveSeed} from './rng.js'

/**
 * @typedef MONSTER
 * @prop {string} [name] - Display name for the monster
 * @prop {string} [sprite] - Sprite ID from monsters.txt (e.g., "7.c")
 * @prop {number} [hp]
 * @prop {number} [currentHealth]
 * @prop {number} [maxHealth]
 * @prop {number} [block]
 * @prop {number} [random]
 * @prop {Array} [intents]
 * @prop {number} [nextIntent]
 * @prop {object} [powers]
 */

/** Declarative action builders shared by monster content. */
export const monsterAction = {
	damage: (amount) => ({type: 'dealDamage', parameter: {source: 'self', target: 'player', amount}}),
	block: (amount) => ({type: 'addBlock', parameter: {target: 'self', amount}}),
	power: (power, amount, target = 'player') => ({
		type: 'addPower',
		parameter: {target, power, amount, turnEndCompensation: true},
	}),
	weak: (amount) => ({
		type: 'addPower',
		parameter: {target: 'player', power: 'weak', amount, turnEndCompensation: true},
	}),
	vulnerable: (amount) => ({
		type: 'addPower',
		parameter: {target: 'player', power: 'vulnerable', amount, turnEndCompensation: true},
	}),
}

/** @param {object} value */
function clone(value) {
	if (typeof structuredClone === 'function') return structuredClone(value)
	return JSON.parse(JSON.stringify(value))
}

/**
 * Convert old `{damage, block, weak, vulnerable}` intents and new action-based
 * intents into one canonical representation. The summary properties are kept so
 * the current intent UI and old save data remain backwards compatible.
 * @param {object} [intent]
 */
export function normalizeMonsterIntent(intent = {}) {
	const actions = Array.isArray(intent.actions) ? clone(intent.actions) : []
	if (!actions.length) {
		if (intent.block) actions.push(monsterAction.block(intent.block))
		if (intent.damage) actions.push(monsterAction.damage(intent.damage))
		if (intent.vulnerable) actions.push(monsterAction.vulnerable(intent.vulnerable))
		if (intent.weak) actions.push(monsterAction.weak(intent.weak))
	}

	const summary = {}
	for (const action of actions) {
		const parameter = action.parameter || {}
		if (action.type === 'addBlock' && parameter.target === 'self') {
			summary.block = (summary.block || 0) + (parameter.amount || 0)
		}
		if (action.type === 'dealDamage' && parameter.target === 'player') {
			summary.damage = (summary.damage || 0) + (parameter.amount || 0)
		}
		if (action.type === 'addPower' && parameter.target === 'player') {
			if (parameter.power === 'weak') summary.weak = (summary.weak || 0) + (parameter.amount || 0)
			if (parameter.power === 'vulnerable') {
				summary.vulnerable = (summary.vulnerable || 0) + (parameter.amount || 0)
			}
		}
	}

	return {...intent, ...summary, actions}
}

/**
 * Author a monster intent directly in the same action language used by cards,
 * relics and the action manager.
 * @param {...object} actions
 */
export function MonsterIntent(...actions) {
	return normalizeMonsterIntent({actions})
}

/**
 * Preserve the legacy random-damage range exactly, but draw it from the injected
 * run RNG rather than global randomness.
 * @param {object} intent
 * @param {number} variance
 * @param {{int: (min: number, max: number) => number}} rng
 */
function randomizeIntentDamage(intent, variance, rng) {
	const normalized = normalizeMonsterIntent(intent)
	const actions = normalized.actions.map((action) => {
		if (action.type !== 'dealDamage' || action.parameter?.source !== 'self') return action
		const next = clone(action)
		const baseDamage = next.parameter.amount
		const min = baseDamage - variance
		const max = min + 4
		next.parameter.amount = rng.int(min, max)
		return next
	})
	return normalizeMonsterIntent({...normalized, actions})
}

/**
 * A monster has health and a list of intents. Legacy intent objects are stored
 * unchanged for save/test compatibility and normalized only when executed.
 * Action-authored content is already canonical at construction time.
 * @param {MONSTER} props
 * @param {{rng?: ReturnType<typeof createRng>}} [options]
 * @returns {MONSTER}
 */
export function Monster(props = {}, options = {}) {
	const fallbackSeed = deriveSeed(
		'monster-fallback',
		props.name || 'monster',
		props.hp ?? props.currentHealth ?? 42,
		JSON.stringify(props.intents || []),
	)
	const rng = options.rng || createRng(fallbackSeed)
	let intents = clone(props.intents || [])

	if (typeof props.random === 'number') {
		intents = intents.map((intent) => randomizeIntentDamage(intent, props.random, rng))
	}

	const currentHealth = props.hp ?? props.currentHealth ?? 42
	const maxHealth = props.hp ?? props.maxHealth ?? currentHealth

	return {
		name: props.name,
		sprite: props.sprite,
		currentHealth,
		maxHealth,
		block: props.block || 0,
		powers: {...(props.powers || {})},
		intents,
		nextIntent: 0,
	}
}
