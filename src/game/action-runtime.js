import {deterministicId} from './rng.js'
import {runTriggers, triggerEvent} from './triggers.js'
import {getRoomTargets} from './utils-state.js'

const MAX_ACTION_DEPTH = 32
export const runtimeActionTypes = ['requestChoice', 'resolveChoice']

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

function resumableMeta(meta = {}) {
	const result = {}
	if (meta.depth !== undefined) result.depth = meta.depth
	if (meta.origin !== undefined) result.origin = meta.origin
	if (meta.parent !== undefined) result.parent = meta.parent
	if (meta.triggerStack !== undefined) result.triggerStack = [...meta.triggerStack]
	return result
}

function appendPausedAction(state, action, meta) {
	const pendingChoice = state.pendingChoice
	if (!pendingChoice) return state
	return {
		...state,
		pendingChoice: {
			...pendingChoice,
			continuation: [
				...(pendingChoice.continuation || []),
				{action: structuredCloneSafe(action), meta: resumableMeta(meta)},
			],
		},
	}
}

function structuredCloneSafe(value) {
	if (typeof structuredClone === 'function') return structuredClone(value)
	return JSON.parse(JSON.stringify(value))
}

function cardMatchesFilter(card, filter = {}) {
	if (filter.type && card.type !== filter.type) return false
	if (filter.rarity && card.rarity !== filter.rarity) return false
	if (filter.upgraded !== undefined && Boolean(card.upgraded) !== Boolean(filter.upgraded)) return false
	if (filter.tags?.length && !filter.tags.every((tag) => card.tags?.includes(tag))) return false
	if (filter.excludeIds?.includes(card.id)) return false
	return true
}

function normalizeChoiceOptions(options = []) {
	return options.map((option, index) => {
		if (typeof option === 'string' || typeof option === 'number') {
			return {id: String(option), label: String(option), value: option}
		}
		const value = option.value ?? option.id ?? index
		return {
			...option,
			id: String(option.id ?? value),
			label: option.label ?? String(value),
			value,
		}
	})
}

function requestChoice(state, parameter = {}, meta = {}) {
	const kind = parameter.kind || 'cards'
	const pile = parameter.pile || 'hand'
	let candidateIds = []
	let options = []

	if (kind === 'cards') {
		const cards = Array.isArray(state[pile]) ? state[pile] : []
		const allowedIds = parameter.candidateIds ? new Set(parameter.candidateIds) : null
		candidateIds = cards
			.filter((card) => (!allowedIds || allowedIds.has(card.id)) && cardMatchesFilter(card, parameter.filter))
			.map((card) => card.id)
	} else if (kind === 'options') {
		options = normalizeChoiceOptions(parameter.options)
		candidateIds = options.map((option) => option.id)
	} else {
		throw new Error(`Unsupported choice kind: ${kind}`)
	}

	const available = candidateIds.length
	const requestedMin = Math.max(0, Number(parameter.min ?? 1))
	const min = Math.min(requestedMin, available)
	const requestedMax = Math.max(min, Number(parameter.max ?? requestedMin))
	const max = Math.min(requestedMax, available)
	const choiceCounter = state.choiceCounter || 0
	const id = String(
		parameter.id ?? deterministicId('choice', state.seed ?? state.createdAt ?? 'legacy-run', choiceCounter, kind),
	)

	return {
		...state,
		choiceCounter: choiceCounter + 1,
		pendingChoice: {
			id,
			kind,
			prompt: parameter.prompt || (kind === 'cards' ? 'Choose a card' : 'Choose an option'),
			min,
			max,
			pile: kind === 'cards' ? pile : undefined,
			candidateIds,
			options,
			onResolve: Array.isArray(parameter.onResolve)
				? structuredCloneSafe(parameter.onResolve)
				: parameter.onResolve
					? [structuredCloneSafe(parameter.onResolve)]
					: [],
			continuation: [],
			resumeMeta: resumableMeta(meta),
		},
	}
}

function choiceTemplateContext(choice, selectedIds, selectedId) {
	const optionsById = new Map((choice.options || []).map((option) => [option.id, option]))
	const selectedValues = selectedIds.map((id) => optionsById.get(id)?.value)
	const currentId = selectedId ?? selectedIds[0]
	return {
		choiceId: choice.id,
		selectedId: currentId,
		selectedIds,
		selectedValue: currentId === undefined ? undefined : optionsById.get(currentId)?.value,
		selectedValues,
	}
}

function resolveTemplate(value, context) {
	if (value === '$choiceId') return context.choiceId
	if (value === '$selected' || value === '$selectedId') return context.selectedId
	if (value === '$selectedIds') return context.selectedIds
	if (value === '$selectedValue') return context.selectedValue
	if (value === '$selectedValues') return context.selectedValues
	if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, context))
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveTemplate(item, context)]))
	}
	return value
}

function expandChoiceAction(action, choice, selectedIds) {
	if (!action?.forEachSelection) {
		return [resolveTemplate(action, choiceTemplateContext(choice, selectedIds))]
	}
	return selectedIds.map((selectedId) => {
		const {forEachSelection: _forEachSelection, ...descriptor} = action
		return resolveTemplate(descriptor, choiceTemplateContext(choice, selectedIds, selectedId))
	})
}

function validateSelection(choice, selectedIds) {
	if (!Array.isArray(selectedIds)) throw new Error('Choice selection must be an array')
	if (new Set(selectedIds).size !== selectedIds.length) throw new Error('Choice selection contains duplicates')
	if (selectedIds.length < choice.min || selectedIds.length > choice.max) {
		throw new Error(`Choice requires between ${choice.min} and ${choice.max} selections`)
	}
	const candidates = new Set(choice.candidateIds)
	for (const id of selectedIds) {
		if (!candidates.has(id)) throw new Error(`Invalid choice selection: ${id}`)
	}
}

function resolveChoice(state, parameter, registry, meta) {
	const choice = state.pendingChoice
	if (!choice) throw new Error('No pending choice to resolve')
	if (parameter.choiceId && parameter.choiceId !== choice.id) throw new Error('Choice id does not match pending choice')
	const selectedIds = (parameter.selectedIds || []).map(String)
	validateSelection(choice, selectedIds)

	let nextState = {...state, pendingChoice: undefined}
	const resolutionActions = (choice.onResolve || []).flatMap((action) =>
		expandChoiceAction(action, choice, selectedIds).map((expandedAction) => ({
			action: expandedAction,
			meta: {
				...choice.resumeMeta,
				origin: 'choice',
				parent: {type: 'requestChoice', parameter: {choiceId: choice.id}},
			},
		})),
	)
	const continuationActions = (choice.continuation || []).flatMap((item) =>
		expandChoiceAction(item.action, choice, selectedIds).map((expandedAction) => ({
			action: expandedAction,
			meta: item.meta || choice.resumeMeta || meta,
		})),
	)

	for (const item of [...resolutionActions, ...continuationActions]) {
		nextState = executeActionLifecycle(nextState, item.action, registry, item.meta)
	}
	return nextState
}

/**
 * Execute one action through the shared lifecycle used by queued player actions,
 * card descriptors, enemy intents and trigger-generated actions.
 *
 * Trigger-generated actions recurse through this same runtime. A source is kept
 * on a small trigger stack while its own reaction is executing so a relic cannot
 * immediately trigger itself forever, while other sources can still react.
 *
 * Runtime choices are serializable flow-control actions. `requestChoice` stores a
 * pending choice in state. Any later action that reaches this runtime while that
 * choice is pending is recorded as a continuation instead of executing. A
 * `resolveChoice` action validates the selected ids, clears the pause and replays
 * both the choice's onResolve actions and all captured continuations through this
 * exact lifecycle again.
 *
 * @param {object} state
 * @param {{type: string, parameter?: object}} action
 * @param {Record<string, Function>} registry
 * @param {{depth?: number, triggerStack?: string[], origin?: string, parent?: object}} [meta]
 */
export function executeActionLifecycle(state, action, registry, meta = {}) {
	if (!action?.type) throw new Error('Action is missing a type')

	if (action.type === 'resolveChoice') {
		return resolveChoice(state, parameterFromAction(action), registry, meta)
	}
	if (state.pendingChoice) return appendPausedAction(state, action, meta)
	if (action.type === 'requestChoice') return requestChoice(state, parameterFromAction(action), meta)

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
