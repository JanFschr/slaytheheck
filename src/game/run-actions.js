import {produce} from 'immer'
import {getEquipmentById} from '../content/equipment.js'
import {getRelicById} from '../content/relics.js'
import {getCurrRoom} from './utils-state.js'

function cloneDefinition(value) {
	if (typeof structuredClone === 'function') return structuredClone(value)
	return JSON.parse(JSON.stringify(value))
}

function addRelic(state, {id}) {
	const definition = getRelicById(id)
	if ((state.relics || []).some((item) => item.id === id)) return state
	return produce(state, (draft) => {
		if (!draft.relics) draft.relics = []
		draft.relics.push(cloneDefinition(definition))
	})
}

function equipItem(state, {id}) {
	const definition = getEquipmentById(id)
	return produce(state, (draft) => {
		if (!draft.equipment) draft.equipment = []
		draft.equipment = draft.equipment.filter((item) => item.slot !== definition.slot)
		draft.equipment.push(cloneDefinition(definition))
	})
}

function claimBuildReward(state, {kind, id}) {
	const nextState = kind === 'equipment' ? equipItem(state, {id}) : addRelic(state, {id})
	return produce(nextState, (draft) => {
		const room = getCurrRoom(draft)
		room.buildRewardClaimed = id
	})
}

export const runActions = {
	addRelic,
	claimBuildReward,
	equipItem,
}

export default runActions
