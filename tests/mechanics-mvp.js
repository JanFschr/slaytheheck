import test from 'ava'
import {getBuildRewards} from '../src/content/build-rewards.js'
import {mechanicsMvpCardDefinitions} from '../src/content/mechanics-mvp-cards.js'
import {
	createMechanicsMvpDungeon,
	mechanicsMvpId,
	mechanicsMvpStarterDeck,
} from '../src/content/mechanics-mvp.js'
import {getShopInventory} from '../src/content/shop.js'
import {getCardRewards} from '../src/game/cards.js'
import createNewGame from '../src/game/new-game.js'
import {createRng} from '../src/game/rng.js'
import {getCurrRoom} from '../src/game/utils-state.js'

function run(game, type, parameter = {}) {
	game.enqueue({type, ...parameter})
	game.dequeue()
	return game.state
}

function moveToRoomType(game, roomType) {
	for (let y = 1; y < game.state.dungeon.graph.length; y++) {
		const x = game.state.dungeon.graph[y].findIndex((node) => node.room?.type === roomType)
		if (x === -1) continue
		run(game, 'move', {move: {x, y}})
		return getCurrRoom(game.state)
	}
	throw new Error(`Could not find room type ${roomType}`)
}

test('MVP pack registers 15 tagged cards with three mini-archetypes', (t) => {
	t.is(mechanicsMvpCardDefinitions.length, 15)
	const ids = new Set(mechanicsMvpCardDefinitions.map((card) => card.definitionId))
	t.is(ids.size, 15)
	for (const card of mechanicsMvpCardDefinitions) t.true(card.tags.includes('mvp'))
	t.true(mechanicsMvpCardDefinitions.some((card) => card.tags.includes('heat')))
	t.true(mechanicsMvpCardDefinitions.some((card) => card.tags.includes('drone')))
	t.true(mechanicsMvpCardDefinitions.some((card) => card.tags.includes('void')))
})

test('MVP new game boots short pack with deterministic seed and mixed starter deck', (t) => {
	const game = createNewGame(false, {seed: 'mvp-seed', contentPack: mechanicsMvpId})
	t.is(game.state.contentPack, mechanicsMvpId)
	t.is(game.state.seed, 'mvp-seed')
	t.is(game.state.gold, 100)
	t.deepEqual(game.state.resources, {heat: 0, drones: 0, corruption: 0})
	t.deepEqual(
		new Set(game.state.deck.map((card) => card.definitionId)),
		new Set(mechanicsMvpStarterDeck),
	)
	t.is(game.state.dungeon.graph.length, 8)
	t.is(game.state.modifiers.length, 1)
})

test('same MVP seed reproduces routes and encounters', (t) => {
	const a = createMechanicsMvpDungeon({seed: 'repeatable'})
	const b = createMechanicsMvpDungeon({seed: 'repeatable'})
	const summarize = (dungeon) =>
		dungeon.graph.map((floor) =>
			floor.map((node) => ({
				type: node.type,
				room: node.room?.type,
				monsters: node.room?.monsters?.map((monster) => ({name: monster.name, hp: monster.currentHealth})),
			})),
		)
	t.deepEqual(summarize(a), summarize(b))
	t.true(a.graph[2].some((node) => node.room?.type === 'event'))
	t.true(a.graph[3].some((node) => node.room?.type === 'merchant'))
	t.true(a.graph[4].some((node) => node.room?.type === 'monster' && node.type === 'E'))
	t.true(a.graph[5].some((node) => node.room?.type === 'treasure'))
	const boss = a.graph.at(-1)[0].room.monsters[0]
	t.is(boss.name, 'Core Architect')
	t.is(boss.phases.length, 3)
})

test('MVP reward pools stay inside MVP content', (t) => {
	const rng = createRng('mvp-rewards')
	const cards = getCardRewards(12, rng.next, {contentPack: mechanicsMvpId})
	t.is(cards.length, 12)
	for (const card of cards) t.true(card.tags.includes('mvp'))

	const game = createNewGame(false, {seed: 'mvp-builds', contentPack: mechanicsMvpId})
	moveToRoomType(game, 'merchant')
	const shop = getShopInventory(game.state)
	for (const offer of shop) {
		if (offer.kind !== 'card') t.true(offer.tags.includes('mvp'))
		else t.true(offer.definitionId.startsWith('mvp:'))
	}

	moveToRoomType(game, 'monster')
	const eliteFloor = game.state.dungeon.graph.findIndex((floor) => floor.some((node) => node.type === 'E'))
	const eliteX = game.state.dungeon.graph[eliteFloor].findIndex((node) => node.type === 'E')
	run(game, 'move', {move: {x: eliteX, y: eliteFloor}})
	const builds = getBuildRewards(game.state, 3)
	t.true(builds.length > 0)
	for (const reward of builds) t.true(reward.tags.includes('mvp'))
})

test('resource actions scale damage and reset between rooms', (t) => {
	const game = createNewGame(false, {seed: 'mvp-resource', contentPack: mechanicsMvpId})
	moveToRoomType(game, 'monster')
	const before = getCurrRoom(game.state).monsters[0].currentHealth
	run(game, 'addResource', {resource: 'heat', amount: 3, max: 10})
	run(game, 'dealDamageFromResource', {resource: 'heat', target: 'enemy0', base: 4, multiplier: 2})
	t.is(getCurrRoom(game.state).monsters[0].currentHealth, before - 10)
	t.is(game.state.resources.heat, 3)

	run(game, 'addResource', {resource: 'drones', amount: 2, max: 5})
	run(game, 'addResource', {resource: 'corruption', amount: 2, max: 6})
	run(game, 'move', {move: {x: 0, y: 2}})
	t.deepEqual(game.state.resources, {heat: 0, drones: 0, corruption: 0})
})

test('drones fire and heat overload through the shared lifecycle', (t) => {
	const game = createNewGame(false, {seed: 'mvp-loop', contentPack: mechanicsMvpId})
	moveToRoomType(game, 'monster')
	const enemies = getCurrRoom(game.state).monsters
	const beforeEnemyHealth = enemies.map((monster) => monster.currentHealth)
	run(game, 'addResource', {resource: 'drones', amount: 2, max: 5})
	run(game, 'fireDrones', {damagePerDrone: 2, target: 'allEnemies'})
	getCurrRoom(game.state).monsters.forEach((monster, index) => {
		t.is(monster.currentHealth, beforeEnemyHealth[index] - 4)
	})

	const beforePlayerHealth = game.state.player.currentHealth
	run(game, 'addResource', {resource: 'heat', amount: 9, max: 10})
	run(game, 'resolveHeat', {threshold: 8, damage: 5, damagePerExcess: 1, vent: 4})
	t.is(game.state.player.currentHealth, beforePlayerHealth - 6)
	t.is(game.state.resources.heat, 5)
})
