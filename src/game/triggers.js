/**
 * Declarative lifecycle triggers for relics, equipment and future run modifiers.
 * Trigger actions use the same action names as the core game engine.
 */

/**
 * @typedef {object} TriggerAction
 * @prop {string} type
 * @prop {object} [parameter]
 */

/**
 * @typedef {object} TriggerSource
 * @prop {string} id
 * @prop {Record<string, TriggerAction|TriggerAction[]>} [triggers]
 */

/** @param {import('./actions.js').State & {relics?: TriggerSource[], equipment?: TriggerSource[]}} state */
export function getTriggerSources(state) {
	return [...(state.relics || []), ...(state.equipment || [])]
}

/**
 * Runs all actions registered for a lifecycle event.
 * The executor is injected to keep this module independent from actions.js and
 * avoid circular imports.
 * @param {object} state
 * @param {string} event
 * @param {object} context
 * @param {(state: object, action: TriggerAction, meta: object) => object} execute
 */
export function runTriggers(state, event, context, execute) {
	let nextState = state
	const activeSources = context?.meta?.triggerStack || []
	for (const source of getTriggerSources(state)) {
		if (activeSources.includes(source.id)) continue
		const configured = source.triggers?.[event]
		if (!configured) continue
		const triggerActions = Array.isArray(configured) ? configured : [configured]
		for (const action of triggerActions) {
			nextState = execute(nextState, action, {event, source, context})
		}
	}
	return nextState
}

/** Stable helpers so content does not have to hand-build lifecycle keys. */
export const triggerEvent = {
	beforeAction: (actionType) => `before:${actionType}`,
	afterAction: (actionType) => `after:${actionType}`,
	powerApplied: (power) => `powerApplied:${power}`,
	enemyAppliedPower: (power) => `enemyApplied:${power}`,
	cardPlayed: 'cardPlayed',
	cardPlayedType: (type) => `cardPlayed:${type}`,
	cardPlayedTag: (tag) => `cardPlayed:tag:${tag}`,
	playerDamaged: 'playerDamaged',
	enemyKilled: 'enemyKilled',
	damageBlocked: 'damageBlocked',
	spawned: 'spawned',
	bossPhaseChanged: 'bossPhaseChanged',
}
