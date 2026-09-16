import test from 'ava'
import ActionManager from '../src/game/action-manager.js'
import actions from '../src/game/actions.js'
import {createCard, getCardRewards} from '../src/game/cards.js'
import {createRng, hashSeed} from '../src/game/rng.js'

test('cards expose stable definition ids independently from display names', (t) => {
	const byName = createCard('Strike')
	const byId = createCard('core:strike')
	t.is(byName.definitionId, 'core:strike')
	t.is(byId.definitionId, 'core:strike')
	t.is(byId.name, 'Strike')
	t.not(byName.id, byId.id)
})

test('card build metadata is copied per card instance', (t) => {
	const first = createCard('core:adrenaline')
	const second = createCard('core:adrenaline')
	t.is(first.rarity, 'rare')
	t.deepEqual(first.tags, ['tempo', 'draw', 'energy'])
	first.tags.push('mutated')
	t.false(second.tags.includes('mutated'))
})

test('same RNG seed produces the same sequence and shuffle', (t) => {
	const a = createRng('daily-42')
	const b = createRng('daily-42')
	t.is(hashSeed('daily-42'), hashSeed('daily-42'))
	t.deepEqual([a.next(), a.next(), a.next()], [b.next(), b.next(), b.next()])

	const c = createRng('shuffle-42')
	const d = createRng('shuffle-42')
	t.deepEqual(c.shuffle([1, 2, 3, 4, 5]), d.shuffle([1, 2, 3, 4, 5]))
})

test('card rewards can be reproduced from a derived seed', (t) => {
	const a = createRng('run-123:reward:2:1')
	const b = createRng('run-123:reward:2:1')
	const first = getCardRewards(3, a.next).map((card) => card.definitionId)
	const second = getCardRewards(3, b.next).map((card) => card.definitionId)
	t.deepEqual(first, second)
	t.is(new Set(first).size, 3)
})

test('relics can react to queued actions through lifecycle triggers', (t) => {
	const manager = ActionManager({debug: false})
	let state = actions.createNewState()
	state.player.currentHealth = 50
	state.relics = [
		{
			id: 'test-battery',
			triggers: {
				'after:addEnergyToPlayer': {
					type: 'addHealth',
					parameter: {target: 'player', amount: 1},
				},
			},
		},
	]
	manager.enqueue({type: 'addEnergyToPlayer', amount: 2})
	state = manager.dequeue(state)
	t.is(state.player.currentEnergy, 5)
	t.is(state.player.currentHealth, 51)
})
