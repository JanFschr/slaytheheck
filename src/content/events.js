export const events = [
	{
		id: 'event:salvage-terminal',
		title: 'Salvage Terminal',
		text: 'A scorched terminal still hums behind a cracked security panel. The capacitors look valuable, but the insulation is gone.',
		choices: [
			{
				id: 'strip',
				label: 'Strip the terminal',
				description: 'Lose 8 HP. Gain 55 gold.',
				actions: [
					{type: 'losePlayerHealth', amount: 8},
					{type: 'addGold', amount: 55},
					{type: 'completeEvent', choice: 'strip'},
				],
			},
			{
				id: 'leave',
				label: 'Leave it alone',
				description: 'Keep moving.',
				actions: [{type: 'completeEvent', choice: 'leave'}],
			},
		],
	},
	{
		id: 'event:calibration-shrine',
		title: 'Calibration Shrine',
		text: 'A maintenance cradle recognizes your deck as obsolete hardware and offers one free calibration cycle.',
		choices: [
			{
				id: 'calibrate',
				label: 'Calibrate a card',
				description: 'Choose one non-upgraded card in your deck and upgrade it.',
				actions: [
					{
						type: 'requestChoice',
						kind: 'cards',
						pile: 'deck',
						prompt: 'Choose a card to calibrate',
						filter: {upgraded: false},
						onResolve: [
							{type: 'upgradeCardById', parameter: {cardId: '$selected'}},
							{type: 'completeEvent', parameter: {choice: 'calibrate'}},
						],
					},
				],
			},
			{
				id: 'scrap',
				label: 'Strip spare parts',
				description: 'Gain 20 gold.',
				actions: [
					{type: 'addGold', amount: 20},
					{type: 'completeEvent', choice: 'scrap'},
				],
			},
		],
	},
	{
		id: 'event:purge-vat',
		title: 'Purge Vat',
		text: 'The recycler offers to dissolve one piece of your deck permanently. Its meter is very clear about the price.',
		choices: [
			{
				id: 'purge',
				label: 'Purge a card — 40 gold',
				description: 'Choose one card and remove it from your deck.',
				requiresGold: 40,
				actions: [
					{
						type: 'requestChoice',
						kind: 'cards',
						pile: 'deck',
						prompt: 'Choose a card to purge',
						onResolve: [
							{type: 'spendGold', parameter: {amount: 40}},
							{type: 'removeCardById', parameter: {cardId: '$selected'}},
							{type: 'completeEvent', parameter: {choice: 'purge'}},
						],
					},
				],
			},
			{
				id: 'leave',
				label: 'Decline',
				description: 'Nothing changes.',
				actions: [{type: 'completeEvent', choice: 'leave'}],
			},
		],
	},
	{
		id: 'event:medical-cache',
		title: 'Medical Cache',
		text: 'A sealed emergency locker opens at your approach. Enough remains for one useful decision.',
		choices: [
			{
				id: 'heal',
				label: 'Use the med-gel',
				description: 'Heal 18 HP.',
				actions: [
					{type: 'heal', target: 'player', amount: 18},
					{type: 'completeEvent', choice: 'heal'},
				],
			},
			{
				id: 'sell',
				label: 'Sell the sealed supplies',
				description: 'Gain 35 gold.',
				actions: [
					{type: 'addGold', amount: 35},
					{type: 'completeEvent', choice: 'sell'},
				],
			},
		],
	},
	{
		id: 'event:unstable-core',
		title: 'Unstable Core',
		text: 'A damaged reactor can be bled for valuable charge. Every warning light says that this is a bad idea.',
		choices: [
			{
				id: 'drain',
				label: 'Drain the core',
				description: 'Lose 12 HP. Gain 70 gold.',
				actions: [
					{type: 'losePlayerHealth', amount: 12},
					{type: 'addGold', amount: 70},
					{type: 'completeEvent', choice: 'drain'},
				],
			},
			{
				id: 'stabilize',
				label: 'Stabilize it',
				description: 'Gain 7 HP.',
				actions: [
					{type: 'heal', target: 'player', amount: 7},
					{type: 'completeEvent', choice: 'stabilize'},
				],
			},
		],
	},
]

export const eventsById = Object.fromEntries(events.map((event) => [event.id, event]))
export const eventIds = events.map((event) => event.id)

export function getEventById(id) {
	const event = eventsById[id]
	if (!event) throw new Error(`Unknown event: ${id}`)
	return event
}
