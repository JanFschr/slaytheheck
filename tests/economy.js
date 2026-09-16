import test from 'ava'
import {economy, getCombatGoldReward} from '../src/content/economy.js'
import {getEventById} from '../src/content/events.js'
import {getShopInventory} from '../src/content/shop.js'
import ActionManager from '../src/game/action-manager.js'
import createNewGame from '../src/game/new-game.js'
import {getCurrRoom} from '../src/game/utils-state.js'

function clone(value) {
	return JSON.parse(JSON.stringify(value))
}

function findRoom(state, type) {
	for (let y = 0; y < state.dungeon.graph.length; y++) {
		const x = state.dungeon.graph[y].findIndex((node) => node.room?.type === type)
		if (x !== -1) return {x, y}
	}
	return null
}

function enterRoom(state, type) {
	const position = findRoom(state, type)
	if (!position) throw new Error(`Could not find ${type} room`)
	state.dungeon.x = position.x
	state.dungeon.y = position.y
	return position
}

function run(manager, state, action) {
	manager.enqueue(action)
	return manager.dequeue(state)
}

function runDescriptor(manager, state, descriptor) {
	const {type, parameter, ...direct} = descriptor
	return run(manager, state, {type, ...(parameter || direct)})
}

test('new runs start with gold and deterministic optional strategic routes', (t) => {
	const first = clone(createNewGame(false, {seed: 'economy-route-seed'}).state)
	const second = clone(createNewGame(false, {seed: 'economy-route-seed'}).state)
	t.is(first.gold, economy.startingGold)

	const snapshot = (state) =>
		state.dungeon.graph.flatMap((floor, y) =>
			floor
				.map((node, x) => ({x, y, type: node.room?.type, eventId: node.room?.eventId}))
				.filter((node) => ['event', 'merchant', 'treasure'].includes(node.type)),
		)
	t.deepEqual(snapshot(first), snapshot(second))

	for (const type of ['event', 'merchant', 'treasure']) {
		const position = findRoom(first, type)
		t.truthy(position, `${type} should be present`)
		const reachable = [
			...new Set(
				first.dungeon.paths
					.map((path) => path[position.y - 1]?.[1]?.[1])
					.filter((column) => Number.isInteger(column)),
			),
		]
		t.true(reachable.includes(position.x), `${type} should be reachable`)
		t.true(reachable.some((column) => column !== position.x), `${type} should remain optional`)
	}
})

test('combat gold can only be claimed after combat and only once', (t) => {
	let state = clone(createNewGame(false, {seed: 'combat-gold-seed'}).state)
	enterRoom(state, 'monster')
	const manager = ActionManager({debug: false})
	const room = getCurrRoom(state)
	room.monsters.forEach((monster) => {
		monster.currentHealth = Math.max(1, monster.currentHealth)
	})

	manager.enqueue({type: 'claimCombatGold'})
	t.throws(() => manager.dequeue(state), {message: /completed combat/})

	room.monsters.forEach((monster) => {
		monster.currentHealth = 0
	})
	const expected = getCombatGoldReward(state)
	const before = state.gold
	state = run(manager, state, {type: 'claimCombatGold'})
	t.is(state.gold, before + expected)
	t.is(getCurrRoom(state).goldRewardClaimed, expected)

	state = run(manager, state, {type: 'claimCombatGold'})
	t.is(state.gold, before + expected)
})

test('merchant stock stays fixed and sold or owned offers cannot charge twice', (t) => {
	let state = clone(createNewGame(false, {seed: 'merchant-stock-seed'}).state)
	enterRoom(state, 'merchant')
	state.gold = 999
	const manager = ActionManager({debug: false})
	const beforeOffers = getShopInventory(state)
	const offer = beforeOffers.find((candidate) => candidate.kind === 'relic') || beforeOffers[0]
	const beforeGold = state.gold

	state = run(manager, state, {type: 'buyShopOffer', offerId: offer.id})
	t.is(state.gold, beforeGold - offer.price)
	t.true(getCurrRoom(state).purchasedOffers.includes(offer.id))
	t.deepEqual(
		getShopInventory(state).map((item) => item.id),
		beforeOffers.map((item) => item.id),
	)

	const afterPurchase = state.gold
	state = run(manager, state, {type: 'buyShopOffer', offerId: offer.id})
	t.is(state.gold, afterPurchase)
})

test('merchant card removal pauses for a runtime choice then resumes atomically', (t) => {
	let state = clone(createNewGame(false, {seed: 'merchant-choice-seed'}).state)
	enterRoom(state, 'merchant')
	state.gold = 999
	const manager = ActionManager({debug: false})
	const cardId = state.deck[0].id
	const deckSize = state.deck.length
	const beforeGold = state.gold

	state = run(manager, state, {
		type: 'requestChoice',
		kind: 'cards',
		pile: 'deck',
		prompt: 'Choose a card to remove',
		min: 1,
		max: 1,
		onResolve: [
			{
				type: 'applyShopCardService',
				parameter: {service: 'remove', cardId: '$selected'},
			},
		],
	})
	t.truthy(state.pendingChoice)
	t.is(state.gold, beforeGold)

	state = clone(state)
	state = run(manager, state, {
		type: 'resolveChoice',
		choiceId: state.pendingChoice.id,
		selectedIds: [cardId],
	})
	t.falsy(state.pendingChoice)
	t.is(state.gold, beforeGold - economy.cardRemovePrice)
	t.is(state.deck.length, deckSize - 1)
	t.false(state.deck.some((card) => card.id === cardId))
	t.true(getCurrRoom(state).usedServices.includes('remove'))

	const afterService = state.gold
	state = run(manager, state, {type: 'applyShopCardService', service: 'remove', cardId: state.deck[0].id})
	t.is(state.gold, afterService)
})

test('event actions resolve into room completion', (t) => {
	let state = clone(createNewGame(false, {seed: 'event-flow-seed'}).state)
	enterRoom(state, 'event')
	const manager = ActionManager({debug: false})
	const event = getEventById(getCurrRoom(state).eventId)
	const choice = event.choices.find((candidate) => !candidate.actions.some((action) => action.type === 'requestChoice'))
	t.truthy(choice)

	for (const action of choice.actions) state = runDescriptor(manager, state, action)
	t.truthy(getCurrRoom(state).choice)
})

test('treasure rewards are deterministic and can only be claimed once', (t) => {
	let state = clone(createNewGame(false, {seed: 'treasure-seed'}).state)
	enterRoom(state, 'treasure')
	const manager = ActionManager({debug: false})
	const beforeGold = state.gold

	state = run(manager, state, {type: 'claimTreasure'})
	const room = getCurrRoom(state)
	t.true(room.claimed)
	t.true(room.goldReward > 0)
	t.is(state.gold, beforeGold + room.goldReward)
	const afterFirstClaim = JSON.stringify(state)

	state = run(manager, state, {type: 'claimTreasure'})
	t.is(JSON.stringify(state), afterFirstClaim)
})
