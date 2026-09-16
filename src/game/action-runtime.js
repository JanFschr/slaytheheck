import {runTriggers, triggerEvent} from './triggers.js'
import {getRoomTargets} from './utils-state.js'

const MAX_ACTION_DEPTH = 32

function parameterFromAction(action) {
	if (action.parameter) return {...action.parameter}
	const {type: _type, ...parameter} = action
	return parameter
}

function getBlockAmount(state, target) {
	if (!target) return 0
	try {
		return getRoomTargets(state, target).reduce((total, model) => total + (model.block || 0), 0)
	} catch {
		return 0
	}
}

function semanticEvents(beforeState, afterState, action) {
	const parameter = action.parameter || {}
	const events = []

	if (action.type === 'addPower' && parameter.power) {
		events.push({event: triggerEvent.powerApplied(parameter.power), data: {power: parameter.power}})
		if (String(parameter.source || '').startsWith('enemy')) {
			events.push({
				event: triggerEvent.enemyAppliedPower(parameter.power),
				data: {power: parameter.power, source: parameter.source, target: parameter.target},
			})
		}
	}

	if (action.type === 'dealDamage' || action.type === 'removeHealth') {
		const beforeBlock = getBlockAmount(beforeState, parameter.target)
		const afterBlock = getBlockAmount(afterState, parameter.target)
		const blockedAmount = Math.max(0, beforeBlock - afterBlock)
		if (blockedAmount > 0) {
			events.push({
				event: triggerEvent.damageBlocked,
				data: {
					blockedAmount,
					source: parameter.source,
					target: parameter.target,
				},
			})
		}
	}

	if (action.type === 'summon') events.push({event: triggerEvent.spawned, data: {source: parameter.source}})
	if (action.type === 'changeBossPhase') {
		events.push({
			event: triggerEvent.bossPhaseChanged,
			data: {source: parameter.source, target: parameter.target, phase: parameter.phase},
		})
	}

	return events
}

/**
 * Execute one action through the shared lifecycle used by queued player actions,
 * card descriptors, enemy intents and trigger-generated actions.
 *
 * Trigger-generated actions recurse through this same runtime. A source is kept
 * on a small trigger stack while its own reaction is executing so a relic cannot
 * immediately trigger itself forever, while other sources can still react.
 *
 * @param {object} state
 * @param {{type: string, parameter?: object}} action
 * @param {Record<string, Function>} registry
 * @param {{depth?: number, triggerStack?: string[], origin?: string, parent?: object}} [meta]
 */
export function executeActionLifecycle(state, action, registry, meta = {}) {
	if (!action?.type) throw new Error('Action is missing a type')
	const actionFn = registry[action.type]
	if (!actionFn) throw new Error(`Unknown action: ${action.type}`)

	const depth = meta.depth || 0
	if (depth > MAX_ACTION_DEPTH) throw new Error(`Action lifecycle exceeded depth ${MAX_ACTION_DEPTH}`)

	const runtimeAction = {type: action.type, parameter: parameterFromAction(action)}
	const context = {action: runtimeAction, meta}
	const executeTriggerAction = (nextState, triggerAction, triggerMeta) => {
		const sourceId = triggerMeta.source?.id
		return executeActionLifecycle(nextState, triggerAction, registry, {
			depth: depth + 1,
			origin: 'trigger',
			parent: runtimeAction,
			triggerStack: sourceId ? [...(meta.triggerStack || []), sourceId] : [...(meta.triggerStack || [])],
		})
	}

	let nextState = runTriggers(state, 'beforeAction', context, executeTriggerAction)
	nextState = runTriggers(nextState, triggerEvent.beforeAction(runtimeAction.type), context, executeTriggerAction)

	const beforeCoreAction = nextState
	nextState = actionFn(nextState, runtimeAction.parameter)

	for (const semantic of semanticEvents(beforeCoreAction, nextState, runtimeAction)) {
		nextState = runTriggers(nextState, semantic.event, {...context, semantic: semantic.data}, executeTriggerAction)
	}

	nextState = runTriggers(nextState, triggerEvent.afterAction(runtimeAction.type), context, executeTriggerAction)
	nextState = runTriggers(nextState, 'afterAction', context, executeTriggerAction)
	return nextState
}
