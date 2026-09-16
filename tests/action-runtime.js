import test from 'ava'
import {createTestDungeon} from '../src/content/dungeons.js'
import ActionManager from '../src/game/action-manager.js'
import actions from '../src/game/actions.js'
import {createCard} from '../src/game/cards.js'
import {Monster, MonsterIntent, monsterAction as A} from '../src/game/monster.js'
import {MonsterRoom} from '../src/game/rooms.js'

function combatState(monster, seed = 'runtime-test') {
	let state = actions.createNewState()
	state.seed = seed
	state = actions.setDungeon(state, createTestDungeon())
	state.dungeon.y = 1
	state.dungeon.graph[1][0].room = MonsterRoom(monster)
	return state
}

test('extended card actions draw, exhaust, addCard, heal and gainEnergy', (t) => {
	let state = actions.createNewState()
	state.seed = 'extended-actions'
	state.player.currentHealth = 40
	const strike = createCard('core:strike')
	state.drawPile = [strike]

	state = actions.draw(state, {amount: 1})
	t.is(state.hand[0].id, strike.id)

	state = actions.exhaust(state, {card: strike})
	t.is(state.hand.length, 0)
	t.is(state.exhaustPile[0].id, strike.id)

	state = actions.addCard(state, {definitionId: 'core:defend', pile: 'hand'})
	t.is(state.hand[0].definitionId, 'core:defend')
	t.is(state.rng.cardInstances, 1)

	state = actions.heal(state, {target: 'player', amount: 5})
	state = actions.gainEnergy(state, {amount: 2})
	t.is(state.player.currentHealth, 45)
	t.is(state.player.currentEnergy, 5)

	let replay = actions.createNewState()
	replay.seed = 'extended-actions'
	replay = actions.addCard(replay, {definitionId: 'core:defend', pile: 'hand'})
	t.is(replay.hand[0].id, state.hand[0].id)
})

test('summon uses deterministic RNG and changeIntent wraps enemy intent indexes', (t) => {
	const baseMonster = Monster({hp: 20, intents: [MonsterIntent(A.damage(1))]})
	let first = combatState(baseMonster, 'summon-seed')
	let second = combatState(baseMonster, 'summon-seed')
	const minion = {
		name: 'Seeded Minion',
		hpRange: [8, 12],
		intents: [MonsterIntent(A.damage(2)), MonsterIntent(A.block(3)), MonsterIntent(A.damage(4))],
	}

	first = actions.summon(first, {monster: minion})
	second = actions.summon(second, {monster: minion})
	const firstMinion = first.dungeon.graph[1][0].room.monsters[1]
	const secondMinion = second.dungeon.graph[1][0].room.monsters[1]
	t.is(firstMinion.currentHealth, secondMinion.currentHealth)
	t.is(first.rng.summon, 1)

	first = actions.changeIntent(first, {target: 'enemy1', index: 2})
	t.is(first.dungeon.graph[1][0].room.monsters[1].nextIntent, 2)
	first = actions.changeIntent(first, {target: 'enemy1', delta: 2})
	t.is(first.dungeon.graph[1][0].room.monsters[1].nextIntent, 1)
})

test('enemy power and blocked damage actions emit semantic relic triggers', (t) => {
	let state = combatState(
		Monster({hp: 20, intents: [MonsterIntent(A.weak(1), A.damage(6))]}),
		'enemy-trigger-test',
	)
	state.player.currentHealth = 50
	state.player.block = 5
	state.relics = [
		{
			id: 'weak-response',
			triggers: {
				'enemyApplied:weak': {type: 'heal', parameter: {target: 'player', amount: 1}},
			},
		},
		{
			id: 'block-response',
			triggers: {
				damageBlocked: {type: 'heal', parameter: {target: 'player', amount: 2}},
			},
		},
	]

	state = actions.endTurn(state)
	t.is(state.player.currentHealth, 52)
	t.is(state.player.powers.weak, 1)
})

test('summoned enemies emit spawned triggers and do not act on the summon turn', (t) => {
	let state = combatState(
		Monster({
			hp: 20,
			intents: [MonsterIntent(A.summon({name: 'Fresh Minion', hp: 3, intents: [MonsterIntent(A.damage(20))]}))],
		}),
		'spawn-trigger-test',
	)
	state.player.currentHealth = 50
	state.relics = [
		{
			id: 'spawn-response',
			triggers: {
				spawned: {type: 'heal', parameter: {target: 'player', amount: 2}},
			},
		},
	]

	state = actions.endTurn(state)
	t.is(state.dungeon.graph[1][0].room.monsters.length, 2)
	t.is(state.player.currentHealth, 52)
})

test('trigger-generated actions recurse through lifecycle without self-trigger loops', (t) => {
	const manager = ActionManager({debug: false})
	let state = actions.createNewState()
	state.player.currentHealth = 40
	state.relics = [
		{
			id: 'battery',
			triggers: {
				'after:gainEnergy': {type: 'heal', parameter: {target: 'player', amount: 2}},
			},
		},
		{
			id: 'healing-engine',
			triggers: {
				'after:heal': {type: 'addPower', parameter: {target: 'player', power: 'strength', amount: 1}},
			},
		},
	]
	manager.enqueue({type: 'gainEnergy', amount: 1})
	state = manager.dequeue(state)
	t.is(state.player.currentEnergy, 4)
	t.is(state.player.currentHealth, 42)
	t.is(state.player.powers.strength, 1)
})

test('boss phases transition on health threshold and run onEnter actions', (t) => {
	const boss = Monster({
		name: 'Phase Boss',
		hp: 100,
		intents: [MonsterIntent(A.damage(1))],
		phases: [
			{id: 'calm'},
			{
				id: 'enraged',
				atHealthRatio: 0.5,
				intents: [MonsterIntent(A.damage(9))],
				onEnter: [
					A.summon({name: 'Phase Minion', hp: 6, intents: [MonsterIntent(A.damage(2))]}),
					{type: 'addPower', parameter: {target: 'self', power: 'strength', amount: 2}},
				],
			},
		],
	})
	let state = combatState(boss, 'boss-phase-test')
	state.player.currentHealth = 50
	state.relics = [
		{
			id: 'phase-response',
			triggers: {
				bossPhaseChanged: {type: 'heal', parameter: {target: 'player', amount: 1}},
			},
		},
	]

	state = actions.dealDamage(state, {source: 'player', target: 'enemy0', amount: 55})
	const room = state.dungeon.graph[1][0].room
	const transitionedBoss = room.monsters[0]
	t.is(transitionedBoss.currentHealth, 45)
	t.is(transitionedBoss.phase, 1)
	t.is(transitionedBoss.phaseId, 'enraged')
	t.is(transitionedBoss.intents[0].damage, 9)
	t.is(transitionedBoss.powers.strength, 2)
	t.is(room.monsters.length, 2)
	t.is(state.player.currentHealth, 51)
})
