import Dungeon from '../game/dungeon.js'
import {Monster} from '../game/monster.js'
import {createRng, deriveSeed} from '../game/rng.js'
import {EventRoom, MerchantRoom, MonsterRoom, TreasureRoom} from '../game/rooms.js'
import {eventIds} from './events.js'

function reachableColumns(dungeon, floor) {
	const columns = dungeon.paths.map((path) => path[floor - 1]?.[1]?.[1]).filter((column) => Number.isInteger(column))
	return [...new Set(columns)]
}

function replaceReachableRoom(dungeon, floor, roomFactory, rng) {
	const columns = reachableColumns(dungeon, floor)
	// A strategic room should be a route decision, never a mandatory stop shared
	// by every generated path on that floor.
	if (columns.length < 2 || !dungeon.graph[floor]) return false
	const column = rng.pick(columns)
	const node = dungeon.graph[floor][column]
	if (!node?.type) return false
	// Keep special content behind the existing mystery-node icon. The room type
	// itself tells the UI whether this particular mystery is an event, merchant or treasure.
	node.type = 'Q'
	node.room = roomFactory()
	return true
}

export const createDefaultDungeon = (options = {}) => {
	const dungeon = Dungeon({
		width: 6,
		height: 10,
		minRooms: 3,
		maxRooms: 4,
		customPaths: '0235',
		seed: options.seed,
	})
	const rng = createRng(deriveSeed(dungeon.seed, 'strategic-rooms'))

	// Put special rooms on reachable but optional paths. Other routes on the same
	// floors remain ordinary combat/campfire/elite choices.
	replaceReachableRoom(dungeon, 3, () => EventRoom(rng.pick(eventIds)), rng)
	replaceReachableRoom(dungeon, 5, () => MerchantRoom(), rng)
	replaceReachableRoom(dungeon, 7, () => TreasureRoom(), rng)
	return dungeon
}

// This is the dungeon used in tests. Don't change it without running tests.
export const createTestDungeon = () => {
	const dungeon = Dungeon({width: 1, height: 3, seed: 'test-dungeon'})
	const intents = [{block: 7}, {damage: 10}, {damage: 8}, {}, {damage: 14}]
	// Add monster rooms on the first three nodes
	dungeon.graph[1][0].room = MonsterRoom(Monster({hp: 42, intents}))
	dungeon.graph[2][0].room = MonsterRoom(Monster({hp: 24, intents}), Monster({hp: 13, intents}))
	dungeon.graph[3][0].room = MonsterRoom(Monster({hp: 42, intents}))
	return dungeon
}
