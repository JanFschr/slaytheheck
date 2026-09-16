const A = (type, parameter = {}) => ({type, parameter})

const definitions = [
	{
		definitionId: 'mvp:overclock',
		name: 'Overclock',
		type: 'skill',
		rarity: 'uncommon',
		tags: ['mvp', 'heat', 'tempo'],
		keywords: ['heat', 'exhaust'],
		energy: 0,
		target: 'player',
		actions: [
			A('addResource', {resource: 'heat', amount: 2, max: 10}),
			A('gainEnergy', {amount: 1}),
			A('draw', {amount: 1}),
		],
		description: 'Gain 2 Heat, 1 Energy and draw 1. Exhaust.',
		exhaust: true,
	},
	{
		definitionId: 'mvp:thermal-lance',
		name: 'Thermal Lance',
		type: 'attack',
		rarity: 'common',
		tags: ['mvp', 'heat', 'attack'],
		keywords: ['heat'],
		energy: 1,
		target: 'enemy',
		actions: [A('dealDamageFromResource', {resource: 'heat', base: 4, multiplier: 2})],
		description: 'Deal 4 damage plus 2 per Heat.',
	},
	{
		definitionId: 'mvp:vent',
		name: 'Vent',
		type: 'skill',
		rarity: 'common',
		tags: ['mvp', 'heat', 'block'],
		keywords: ['heat'],
		energy: 0,
		target: 'player',
		actions: [A('ventResource', {resource: 'heat', amount: 4, blockPer: 2})],
		description: 'Remove up to 4 Heat. Gain 2 Block for each Heat removed.',
	},
	{
		definitionId: 'mvp:thermal-shield',
		name: 'Thermal Shield',
		type: 'skill',
		rarity: 'common',
		tags: ['mvp', 'heat', 'block'],
		keywords: ['heat'],
		energy: 1,
		target: 'player',
		actions: [A('addBlockFromResource', {resource: 'heat', base: 4, multiplier: 1})],
		description: 'Gain 4 Block plus 1 per Heat.',
	},
	{
		definitionId: 'mvp:meltdown',
		name: 'Meltdown',
		type: 'attack',
		rarity: 'rare',
		tags: ['mvp', 'heat', 'finisher'],
		keywords: ['heat', 'exhaust'],
		energy: 2,
		target: 'enemy',
		actions: [A('dealDamageFromResource', {resource: 'heat', base: 8, multiplier: 3, consumeAll: true})],
		description: 'Deal 8 damage plus 3 per Heat, then lose all Heat. Exhaust.',
		exhaust: true,
	},
	{
		definitionId: 'mvp:deploy-drone',
		name: 'Deploy Drone',
		type: 'skill',
		rarity: 'common',
		tags: ['mvp', 'drone', 'block'],
		keywords: ['drone'],
		energy: 1,
		block: 3,
		target: 'player',
		actions: [A('addResource', {resource: 'drones', amount: 1, max: 5})],
		description: 'Gain 3 Block. Deploy 1 Drone. Drones fire before your turn ends.',
	},
	{
		definitionId: 'mvp:drone-volley',
		name: 'Drone Volley',
		type: 'attack',
		rarity: 'common',
		tags: ['mvp', 'drone', 'attack'],
		keywords: ['drone'],
		energy: 1,
		target: 'enemy',
		actions: [A('dealDamageFromResource', {resource: 'drones', base: 3, multiplier: 3})],
		description: 'Deal 3 damage plus 3 per Drone.',
	},
	{
		definitionId: 'mvp:repair-protocol',
		name: 'Repair Protocol',
		type: 'skill',
		rarity: 'common',
		tags: ['mvp', 'drone', 'block'],
		keywords: ['drone'],
		energy: 1,
		target: 'player',
		actions: [A('addBlockFromResource', {resource: 'drones', base: 4, multiplier: 2})],
		description: 'Gain 4 Block plus 2 per Drone.',
	},
	{
		definitionId: 'mvp:salvage-drone',
		name: 'Salvage Drone',
		type: 'skill',
		rarity: 'uncommon',
		tags: ['mvp', 'drone', 'tempo'],
		keywords: ['drone', 'exhaust'],
		energy: 0,
		target: 'player',
		conditions: [{type: 'resourceAtLeast', resource: 'drones', amount: 1}],
		actions: [
			A('spendResource', {resource: 'drones', amount: 1}),
			A('draw', {amount: 2}),
			A('gainEnergy', {amount: 1}),
		],
		description: 'Consume 1 Drone. Draw 2 and gain 1 Energy. Exhaust.',
		exhaust: true,
	},
	{
		definitionId: 'mvp:swarm-protocol',
		name: 'Swarm Protocol',
		type: 'skill',
		rarity: 'rare',
		tags: ['mvp', 'drone', 'setup'],
		keywords: ['drone', 'exhaust'],
		energy: 2,
		target: 'player',
		actions: [A('addResource', {resource: 'drones', amount: 2, max: 5}), A('draw', {amount: 1})],
		description: 'Deploy 2 Drones and draw 1. Exhaust.',
		exhaust: true,
	},
	{
		definitionId: 'mvp:blood-bargain',
		name: 'Blood Bargain',
		type: 'skill',
		rarity: 'uncommon',
		tags: ['mvp', 'void', 'tempo'],
		keywords: ['corruption', 'exhaust'],
		energy: 0,
		target: 'player',
		actions: [
			A('removeHealth', {amount: 4}),
			A('addResource', {resource: 'corruption', amount: 2, max: 6}),
			A('gainEnergy', {amount: 1}),
			A('draw', {amount: 1}),
		],
		description: 'Lose 4 HP. Gain 2 Corruption, 1 Energy and draw 1. Exhaust.',
		exhaust: true,
	},
	{
		definitionId: 'mvp:void-cut',
		name: 'Void Cut',
		type: 'attack',
		rarity: 'common',
		tags: ['mvp', 'void', 'attack'],
		keywords: ['corruption'],
		energy: 1,
		target: 'enemy',
		actions: [A('dealDamageFromResource', {resource: 'corruption', base: 5, multiplier: 3})],
		description: 'Deal 5 damage plus 3 per Corruption.',
	},
	{
		definitionId: 'mvp:null-ward',
		name: 'Null Ward',
		type: 'skill',
		rarity: 'common',
		tags: ['mvp', 'void', 'block'],
		keywords: ['corruption'],
		energy: 1,
		target: 'player',
		actions: [A('addBlockFromResource', {resource: 'corruption', base: 4, multiplier: 2})],
		description: 'Gain 4 Block plus 2 per Corruption.',
	},
	{
		definitionId: 'mvp:selective-purge',
		name: 'Selective Purge',
		type: 'skill',
		rarity: 'uncommon',
		tags: ['mvp', 'void', 'exhaust'],
		keywords: ['corruption', 'choice', 'exhaust'],
		energy: 0,
		target: 'player',
		actions: [
			{
				type: 'requestChoice',
				parameter: {
					kind: 'cards',
					pile: 'hand',
					prompt: 'Choose a card to purge',
					min: 1,
					max: 1,
					onResolve: [
						{type: 'exhaust', parameter: {cardId: '$selected'}},
						{type: 'addResource', parameter: {resource: 'corruption', amount: 1, max: 6}},
						{type: 'draw', parameter: {amount: 1}},
					],
				},
			},
		],
		description: 'Choose another card in hand to Exhaust. Gain 1 Corruption and draw 1.',
	},
	{
		definitionId: 'mvp:abyssal-reset',
		name: 'Abyssal Reset',
		type: 'attack',
		rarity: 'rare',
		tags: ['mvp', 'void', 'finisher'],
		keywords: ['corruption', 'exhaust'],
		energy: 2,
		target: 'enemy',
		actions: [A('dealDamageFromResource', {resource: 'corruption', base: 10, multiplier: 4, consumeAll: true})],
		description: 'Deal 10 damage plus 4 per Corruption, then lose all Corruption. Exhaust.',
		exhaust: true,
	},
]

function findAction(card, type) {
	return card.actions.find((action) => action.type === type)
}

export const mechanicsMvpCardDefinitions = definitions

export const mechanicsMvpCardUpgrades = {
	'mvp:overclock': (card) => {
		findAction(card, 'draw').parameter.amount = 2
		card.description = 'Gain 2 Heat, 1 Energy and draw 2. Exhaust.'
		return card
	},
	'mvp:thermal-lance': (card) => {
		findAction(card, 'dealDamageFromResource').parameter.base = 7
		card.description = 'Deal 7 damage plus 2 per Heat.'
		return card
	},
	'mvp:vent': (card) => {
		findAction(card, 'ventResource').parameter.blockPer = 3
		card.description = 'Remove up to 4 Heat. Gain 3 Block for each Heat removed.'
		return card
	},
	'mvp:thermal-shield': (card) => {
		findAction(card, 'addBlockFromResource').parameter.base = 7
		card.description = 'Gain 7 Block plus 1 per Heat.'
		return card
	},
	'mvp:meltdown': (card) => {
		findAction(card, 'dealDamageFromResource').parameter.multiplier = 4
		card.description = 'Deal 8 damage plus 4 per Heat, then lose all Heat. Exhaust.'
		return card
	},
	'mvp:deploy-drone': (card) => {
		card.block = 6
		card.description = 'Gain 6 Block. Deploy 1 Drone. Drones fire before your turn ends.'
		return card
	},
	'mvp:drone-volley': (card) => {
		findAction(card, 'dealDamageFromResource').parameter.base = 6
		card.description = 'Deal 6 damage plus 3 per Drone.'
		return card
	},
	'mvp:repair-protocol': (card) => {
		findAction(card, 'addBlockFromResource').parameter.multiplier = 3
		card.description = 'Gain 4 Block plus 3 per Drone.'
		return card
	},
	'mvp:salvage-drone': (card) => {
		findAction(card, 'draw').parameter.amount = 3
		card.description = 'Consume 1 Drone. Draw 3 and gain 1 Energy. Exhaust.'
		return card
	},
	'mvp:swarm-protocol': (card) => {
		card.energy = 1
		card.description = 'Deploy 2 Drones and draw 1. Exhaust.'
		return card
	},
	'mvp:blood-bargain': (card) => {
		findAction(card, 'removeHealth').parameter.amount = 2
		card.description = 'Lose 2 HP. Gain 2 Corruption, 1 Energy and draw 1. Exhaust.'
		return card
	},
	'mvp:void-cut': (card) => {
		findAction(card, 'dealDamageFromResource').parameter.base = 8
		card.description = 'Deal 8 damage plus 3 per Corruption.'
		return card
	},
	'mvp:null-ward': (card) => {
		findAction(card, 'addBlockFromResource').parameter.base = 7
		card.description = 'Gain 7 Block plus 2 per Corruption.'
		return card
	},
	'mvp:selective-purge': (card) => {
		const choice = findAction(card, 'requestChoice')
		choice.parameter.onResolve.push({type: 'gainEnergy', parameter: {amount: 1}})
		card.description = 'Choose another card in hand to Exhaust. Gain 1 Corruption, draw 1 and gain 1 Energy.'
		return card
	},
	'mvp:abyssal-reset': (card) => {
		findAction(card, 'dealDamageFromResource').parameter.base = 14
		card.description = 'Deal 14 damage plus 4 per Corruption, then lose all Corruption. Exhaust.'
		return card
	},
}

export const mechanicsMvpCardIds = definitions.map((card) => card.definitionId)
