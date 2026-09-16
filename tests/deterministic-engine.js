import test from 'ava'
import {createTestDungeon} from '../src/content/dungeons.js'
import actions from '../src/game/actions.js'
import {Monster, MonsterIntent, monsterAction as A, normalizeMonsterIntent} from '../src/game/monster.js'
import createNewGame from '../src/game/new-game.js'
import {MonsterRoom} from '../src/game/rooms.js'

function deterministicView(state) {
	return {
		seed: state.seed,
		rng: state.rng,
		deck: state.deck.map((card) => ({id: card.id, definitionId: card.definitionId})),
		drawPile: state.drawPile.map((card) => card.id),
		dungeon: state.dungeon.graph.map((floor) =>
			floor.map((node) => ({
				id: node.id,
				type: node.type,
				edges: node.edges,
				monsters: node.room?.monsters?.map((monster) => ({
					name: monster.name,
					currentHealth: monster.currentHealth,
					maxHealth: monster.maxHealth,
					intents: monster.intents,
				})),
			})),
		),
	}
}

test('same run seed reproduces map, encounters, card ids and deck order', (t) => {
	const first = createNewGame(false, {seed: 'daily-2026-09-16'})
	const second = createNewGame(false, {seed: 'daily-2026-09-16'})
	t.deepEqual(deterministicView(first.state), deterministicView(second.state))
})

test('different run seeds produce different procedural runs', (t) => {
	const first = createNewGame(false, {seed: 'daily-a'})
	const second = createNewGame(false, {seed: 'daily-b'})
	t.notDeepEqual(deterministicView(first.state), deterministicView(second.state))
})

test('deck RNG counters survive state and reproduce later shuffles', (t) => {
	const first = createNewGame(false, {seed: 'shuffle-run'})
	const second = createNewGame(false, {seed: 'shuffle-run'})
	const firstNext = actions.endEncounter(first.state)
	const secondNext = actions.endEncounter(second.state)
	t.deepEqual(
		firstNext.drawPile.map((card) => card.id),
		secondNext.drawPile.map((card) => card.id),
	)
	t.deepEqual(firstNext.rng, secondNext.rng)
	t.true(firstNext.rng.deck > first.state.rng.deck)
})

test('legacy monster intents normalize to ordinary core actions', (t) => {
	const intent = normalizeMonsterIntent({block: 5, damage: 6, weak: 1})
	t.deepEqual(
		intent.actions.map((action) => action.type),
		['addBlock', 'dealDamage', 'addPower'],
	)
	t.is(intent.damage, 6)
	t.is(intent.block, 5)
	t.is(intent.weak, 1)
})

test('action-authored enemy intent preserves combat behavior', (t) => {
	let state = actions.createNewState()
	state = actions.setDungeon(state, createTestDungeon())
	state.dungeon.y = 1
	state.dungeon.graph[1][0].room = MonsterRoom(
		Monster({
			hp: 20,
			intents: [MonsterIntent(A.block(5), A.damage(6), A.weak(1))],
		}),
	)

	const next = actions.endTurn(state)
	const monster = next.dungeon.graph[1][0].room.monsters[0]
	t.is(monster.block, 5)
	t.is(next.player.currentHealth, 66)
	t.is(next.player.powers.weak, 1)
	t.is(monster.nextIntent, 0)
})
