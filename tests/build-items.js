import test from 'ava'
import {getBuildRewards} from '../src/content/build-rewards.js'
import {equipment} from '../src/content/equipment.js'
import {relics} from '../src/content/relics.js'
import ActionManager from '../src/game/action-manager.js'
import actions from '../src/game/actions.js'
import {createCard} from '../src/game/cards.js'
import createNewGame from '../src/game/new-game.js'

function eligibleState(seed) {
	const game = createNewGame(false, {seed})
	const state = game.state
	state.dungeon.y = 3
	state.dungeon.x = state.dungeon.graph[3].findIndex((node) => node.type)
	return state
}

test('build item registries expose stable unique ids', (t) => {
	t.is(relics.length, 12)
	t.is(equipment.length, 8)
	const ids = [...relics, ...equipment].map((item) => item.id)
	t.is(new Set(ids).size, ids.length)
	t.true(relics.every((item) => item.id.startsWith('relic:')))
	t.true(equipment.every((item) => item.id.startsWith('equipment:') && item.slot))
})

test('build rewards are deterministic and exclude owned items', (t) => {
	const first = eligibleState('build-reward-seed')
	const second = eligibleState('build-reward-seed')
	const firstRewards = getBuildRewards(first).map((item) => item.id)
	const secondRewards = getBuildRewards(second).map((item) => item.id)
	t.deepEqual(firstRewards, secondRewards)

	first.relics = [{...relics.find((item) => item.id === firstRewards[0])}]
	const nextRewards = getBuildRewards(first).map((item) => item.id)
	t.false(nextRewards.includes(firstRewards[0]))
})

test('claiming a relic installs a live trigger', (t) => {
	const manager = ActionManager({debug: false})
	let state = actions.createNewState()
	state.relics = []
	state.equipment = []
	const defend = createCard('core:defend')
	state.hand = [defend]

	manager.enqueue({type: 'addRelic', id: 'relic:iron-thread'})
	state = manager.dequeue(state)
	manager.enqueue({type: 'playCard', card: defend, target: 'player'})
	state = manager.dequeue(state)

	t.is(state.relics[0].id, 'relic:iron-thread')
	t.is(state.player.block, defend.block + 1)
})

test('equipment replaces only the occupied slot', (t) => {
	const manager = ActionManager({debug: false})
	let state = actions.createNewState()
	state.relics = []
	state.equipment = []

	manager.enqueue({type: 'equipItem', id: 'equipment:reactive-vest'})
	state = manager.dequeue(state)
	manager.enqueue({type: 'equipItem', id: 'equipment:kinetic-shell'})
	state = manager.dequeue(state)
	manager.enqueue({type: 'equipItem', id: 'equipment:pulse-driver'})
	state = manager.dequeue(state)

	t.is(state.equipment.length, 2)
	t.is(state.equipment.find((item) => item.slot === 'armor').id, 'equipment:kinetic-shell')
	t.is(state.equipment.find((item) => item.slot === 'weapon').id, 'equipment:pulse-driver')
})

test('player damage semantic events can drive equipment triggers', (t) => {
	const manager = ActionManager({debug: false})
	let state = actions.createNewState()
	state.relics = []
	state.equipment = []
	state.drawPile = [createCard('core:strike')]

	manager.enqueue({type: 'equipItem', id: 'equipment:pain-editor'})
	state = manager.dequeue(state)
	manager.enqueue({type: 'removeHealth', target: 'player', amount: 5})
	state = manager.dequeue(state)

	t.is(state.player.currentHealth, 67)
	t.is(state.hand.length, 1)
})
