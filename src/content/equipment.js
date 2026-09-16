import {triggerEvent} from '../game/triggers.js'

/**
 * Equipment uses named slots. Equipping an item replaces the old item in the
 * same slot, keeping build decisions mutually exclusive where intended.
 */
export const equipment = [
	{
		id: 'equipment:pulse-driver',
		name: 'Pulse Driver',
		icon: '🔫',
		slot: 'weapon',
		rarity: 'uncommon',
		tags: ['attack', 'energy'],
		description: 'After you play an Attack, gain 1 Energy.',
		triggers: {
			[triggerEvent.cardPlayedType('attack')]: {type: 'gainEnergy', parameter: {amount: 1}},
		},
	},
	{
		id: 'equipment:shock-baton',
		name: 'Shock Baton',
		icon: '⚡',
		slot: 'weapon',
		rarity: 'rare',
		tags: ['kill', 'draw'],
		description: 'When an enemy dies, draw 1 card.',
		triggers: {
			[triggerEvent.enemyKilled]: {type: 'draw', parameter: {amount: 1}},
		},
	},
	{
		id: 'equipment:reactive-vest',
		name: 'Reactive Vest',
		icon: '🦺',
		slot: 'armor',
		rarity: 'common',
		tags: ['block', 'heal'],
		description: 'Whenever damage is blocked, heal 2 HP.',
		triggers: {
			[triggerEvent.damageBlocked]: {type: 'heal', parameter: {target: 'player', amount: 2}},
		},
	},
	{
		id: 'equipment:kinetic-shell',
		name: 'Kinetic Shell',
		icon: '🛡️',
		slot: 'armor',
		rarity: 'uncommon',
		tags: ['skill', 'block'],
		description: 'After you play a Skill, gain 2 Block.',
		triggers: {
			[triggerEvent.cardPlayedType('skill')]: {type: 'addBlock', parameter: {target: 'player', amount: 2}},
		},
	},
	{
		id: 'equipment:synapse-jack',
		name: 'Synapse Jack',
		icon: '🧬',
		slot: 'implant',
		rarity: 'uncommon',
		tags: ['draw', 'energy'],
		description: 'Whenever an effect draws cards, gain 1 Energy.',
		triggers: {
			'after:draw': {type: 'gainEnergy', parameter: {amount: 1}},
			'after:drawCards': {type: 'gainEnergy', parameter: {amount: 1}},
		},
	},
	{
		id: 'equipment:pain-editor',
		name: 'Pain Editor',
		icon: '💉',
		slot: 'implant',
		rarity: 'rare',
		tags: ['damage', 'draw'],
		description: 'Whenever you lose HP to damage, draw 1 card.',
		triggers: {
			[triggerEvent.playerDamaged]: {type: 'draw', parameter: {amount: 1}},
		},
	},
	{
		id: 'equipment:spawn-controller',
		name: 'Spawn Controller',
		icon: '🛰️',
		slot: 'module',
		rarity: 'common',
		tags: ['summon', 'block'],
		description: 'Whenever an enemy is summoned, gain 5 Block.',
		triggers: {
			[triggerEvent.spawned]: {type: 'addBlock', parameter: {target: 'player', amount: 5}},
		},
	},
	{
		id: 'equipment:phase-scanner',
		name: 'Phase Scanner',
		icon: '📟',
		slot: 'module',
		rarity: 'rare',
		tags: ['boss', 'energy'],
		description: 'When a boss changes phase, gain 2 Energy.',
		triggers: {
			[triggerEvent.bossPhaseChanged]: {type: 'gainEnergy', parameter: {amount: 2}},
		},
	},
]

export const equipmentById = Object.fromEntries(equipment.map((item) => [item.id, item]))

export function getEquipmentById(id) {
	const item = equipmentById[id]
	if (!item) throw new Error(`Unknown equipment: ${id}`)
	return item
}
