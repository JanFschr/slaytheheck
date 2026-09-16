import {triggerEvent} from '../game/triggers.js'

/**
 * Relics are unlimited run modifiers. Definitions are deliberately plain data so
 * they can be cloned into save state and consumed by the generic trigger runtime.
 */
export const relics = [
	{
		id: 'relic:iron-thread',
		name: 'Iron Thread',
		icon: '🧵',
		rarity: 'common',
		tags: ['block', 'tempo'],
		description: 'Whenever you play a card, gain 1 Block.',
		triggers: {
			[triggerEvent.cardPlayed]: {type: 'addBlock', parameter: {target: 'player', amount: 1}},
		},
	},
	{
		id: 'relic:neural-loop',
		name: 'Neural Loop',
		icon: '🧠',
		rarity: 'uncommon',
		tags: ['draw', 'exhaust'],
		description: 'Whenever you Exhaust a card, draw 1 card.',
		triggers: {
			'after:exhaust': {type: 'draw', parameter: {amount: 1}},
		},
	},
	{
		id: 'relic:blood-battery',
		name: 'Blood Battery',
		icon: '🩸',
		rarity: 'uncommon',
		tags: ['heal', 'energy'],
		description: 'Whenever you heal, gain 1 Energy.',
		triggers: {
			'after:heal': {type: 'gainEnergy', parameter: {amount: 1}},
		},
	},
	{
		id: 'relic:mirror-plating',
		name: 'Mirror Plating',
		icon: '🪞',
		rarity: 'common',
		tags: ['block', 'heal'],
		description: 'Whenever damage is blocked, heal 1 HP.',
		triggers: {
			[triggerEvent.damageBlocked]: {type: 'heal', parameter: {target: 'player', amount: 1}},
		},
	},
	{
		id: 'relic:hex-filter',
		name: 'Hex Filter',
		icon: '🧿',
		rarity: 'uncommon',
		tags: ['debuff', 'energy'],
		description: 'When an enemy applies Weak, gain 1 Energy.',
		triggers: {
			[triggerEvent.enemyAppliedPower('weak')]: {type: 'gainEnergy', parameter: {amount: 1}},
		},
	},
	{
		id: 'relic:poison-condenser',
		name: 'Poison Condenser',
		icon: '☣️',
		rarity: 'uncommon',
		tags: ['poison', 'draw'],
		description: 'Whenever Poison is applied, draw 1 card.',
		triggers: {
			[triggerEvent.powerApplied('poison')]: {type: 'draw', parameter: {amount: 1}},
		},
	},
	{
		id: 'relic:kill-switch',
		name: 'Kill Switch',
		icon: '🎯',
		rarity: 'common',
		tags: ['kill', 'energy'],
		description: 'When an enemy dies, gain 1 Energy.',
		triggers: {
			[triggerEvent.enemyKilled]: {type: 'gainEnergy', parameter: {amount: 1}},
		},
	},
	{
		id: 'relic:spawn-beacon',
		name: 'Spawn Beacon',
		icon: '📡',
		rarity: 'common',
		tags: ['summon', 'block'],
		description: 'Whenever an enemy is summoned, gain 3 Block.',
		triggers: {
			[triggerEvent.spawned]: {type: 'addBlock', parameter: {target: 'player', amount: 3}},
		},
	},
	{
		id: 'relic:phase-reader',
		name: 'Phase Reader',
		icon: '🔭',
		rarity: 'rare',
		tags: ['boss', 'draw'],
		description: 'When a boss changes phase, draw 2 cards.',
		triggers: {
			[triggerEvent.bossPhaseChanged]: {type: 'draw', parameter: {amount: 2}},
		},
	},
	{
		id: 'relic:battle-cache',
		name: 'Battle Cache',
		icon: '🗃️',
		rarity: 'common',
		tags: ['draw', 'block'],
		description: 'Whenever an effect draws cards, gain 2 Block.',
		triggers: {
			'after:draw': {type: 'addBlock', parameter: {target: 'player', amount: 2}},
			'after:drawCards': {type: 'addBlock', parameter: {target: 'player', amount: 2}},
		},
	},
	{
		id: 'relic:attack-cache',
		name: 'Attack Cache',
		icon: '⚔️',
		rarity: 'common',
		tags: ['attack', 'block'],
		description: 'Whenever you play an Attack, gain 2 Block.',
		triggers: {
			[triggerEvent.cardPlayedType('attack')]: {type: 'addBlock', parameter: {target: 'player', amount: 2}},
		},
	},
	{
		id: 'relic:skill-capacitor',
		name: 'Skill Capacitor',
		icon: '🔋',
		rarity: 'rare',
		tags: ['skill', 'energy'],
		description: 'Whenever you play a Skill, gain 1 Energy.',
		triggers: {
			[triggerEvent.cardPlayedType('skill')]: {type: 'gainEnergy', parameter: {amount: 1}},
		},
	},
]

export const relicsById = Object.fromEntries(relics.map((relic) => [relic.id, relic]))

export function getRelicById(id) {
	const relic = relicsById[id]
	if (!relic) throw new Error(`Unknown relic: ${id}`)
	return relic
}
