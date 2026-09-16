import {produce} from 'immer'

export const mechanicsResources = ['heat', 'drones', 'corruption']

export function getResource(state, resource) {
	return Math.max(0, Number(state.resources?.[resource] || 0))
}

function resourceName(resource) {
	if (!resource) throw new Error('Resource action requires a resource name')
	return String(resource)
}

function setResource(state, {resource, amount = 0, max} = {}) {
	const name = resourceName(resource)
	const ceiling = Number.isFinite(max) ? Number(max) : Number.POSITIVE_INFINITY
	const value = Math.max(0, Math.min(ceiling, Number(amount) || 0))
	return produce(state, (draft) => {
		if (!draft.resources) draft.resources = {}
		draft.resources[name] = value
	})
}

function addResource(state, {resource, amount = 1, max} = {}) {
	const name = resourceName(resource)
	return setResource(state, {resource: name, amount: getResource(state, name) + amount, max})
}

function spendResource(state, {resource, amount = 1} = {}) {
	const name = resourceName(resource)
	return setResource(state, {resource: name, amount: getResource(state, name) - Math.max(0, amount)})
}

function resetCombatResources(state) {
	return produce(state, (draft) => {
		if (!draft.resources) draft.resources = {}
		for (const resource of mechanicsResources) draft.resources[resource] = 0
	})
}

function requireRuntime(runtime) {
	if (!runtime?.execute) throw new Error('Mechanics action requires lifecycle runtime access')
	return runtime
}

function dealDamageFromResource(
	state,
	{resource, target, base = 0, multiplier = 1, consume = 0, consumeAll = false, source = 'player'} = {},
	runtime,
) {
	const name = resourceName(resource)
	const stacks = getResource(state, name)
	const amount = Math.max(0, Number(base) + stacks * Number(multiplier))
	let nextState = state
	if (amount > 0) {
		nextState = requireRuntime(runtime).execute(nextState, {
			type: 'dealDamage',
			parameter: {source, target, amount},
		})
	}
	if (consumeAll) return setResource(nextState, {resource: name, amount: 0})
	if (consume > 0) return spendResource(nextState, {resource: name, amount: consume})
	return nextState
}

function addBlockFromResource(
	state,
	{resource, target = 'player', base = 0, multiplier = 1} = {},
	runtime,
) {
	const stacks = getResource(state, resourceName(resource))
	const amount = Math.max(0, Number(base) + stacks * Number(multiplier))
	if (!amount) return state
	return requireRuntime(runtime).execute(state, {
		type: 'addBlock',
		parameter: {source: 'player', target, amount},
	})
}

function ventResource(
	state,
	{resource = 'heat', amount = 1, target = 'player', blockPer = 0, baseBlock = 0} = {},
	runtime,
) {
	const name = resourceName(resource)
	const current = getResource(state, name)
	const removed = Math.min(current, Math.max(0, Number(amount)))
	let nextState = setResource(state, {resource: name, amount: current - removed})
	const block = Math.max(0, Number(baseBlock) + removed * Number(blockPer))
	if (block > 0) {
		nextState = requireRuntime(runtime).execute(nextState, {
			type: 'addBlock',
			parameter: {source: 'player', target, amount: block},
		})
	}
	return nextState
}

function fireDrones(state, {damagePerDrone = 2, target = 'allEnemies'} = {}, runtime) {
	const drones = getResource(state, 'drones')
	if (!drones) return state
	return requireRuntime(runtime).execute(state, {
		type: 'dealDamage',
		parameter: {source: 'player', target, amount: drones * damagePerDrone},
	})
}

function resolveHeat(
	state,
	{threshold = 8, damage = 5, damagePerExcess = 1, vent = 4} = {},
	runtime,
) {
	const heat = getResource(state, 'heat')
	if (heat < threshold) return state
	const overloadDamage = Math.max(0, damage + (heat - threshold) * damagePerExcess)
	let nextState = state
	if (overloadDamage > 0) {
		nextState = requireRuntime(runtime).execute(nextState, {
			type: 'removeHealth',
			parameter: {source: 'heat', target: 'player', amount: overloadDamage},
		})
	}
	return setResource(nextState, {resource: 'heat', amount: Math.max(0, heat - vent)})
}

const mechanicsActions = {
	addBlockFromResource,
	addResource,
	dealDamageFromResource,
	fireDrones,
	resetCombatResources,
	resolveHeat,
	setResource,
	spendResource,
	ventResource,
}

export default mechanicsActions
