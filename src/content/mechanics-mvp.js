import Dungeon from '../game/dungeon.js'
import {monsterAction as A, Monster, MonsterIntent} from '../game/monster.js'
import {createRng, deriveSeed} from '../game/rng.js'
import {CampfireRoom, EventRoom, MerchantRoom, MonsterRoom, TreasureRoom} from '../game/rooms.js'

export const mechanicsMvpId = 'mechanics-mvp'
export const mechanicsMvpDevSeed = 'mechanics-mvp-dev-v1'

export const mechanicsMvpStarterDeck = [
	'core:strike',
	'core:strike',
	'core:defend',
	'core:defend',
	'mvp:overclock',
	'mvp:vent',
	'mvp:deploy-drone',
	'mvp:drone-volley',
	'mvp:blood-bargain',
	'mvp:void-cut',
]

export const mechanicsMvpModifiers = [
	{
		id: 'modifier:mechanics-mvp-combat-loop',
		triggers: {
			'before:endTurn': [
				{type: 'fireDrones', parameter: {damagePerDrone: 2, target: 'allEnemies'}},
				{type: 'resolveHeat', parameter: {threshold: 8, damage: 5, damagePerExcess: 1, vent: 4}},
			],
			'before:move': {type: 'resetCombatResources'},
		},
	},
]

const I = (...actions) => MonsterIntent(...actions)
const addPlayerResource = (resource, amount, max) => ({type: 'addResource', parameter: {resource, amount, max}})

function ScrapHound(rng) {
	return Monster(
		{
			name: 'Scrap Hound',
			sprite: [6, 11],
			hp: rng.int(22, 27),
			intents: [I(A.damage(6)), I(A.damage(5), A.block(4)), I(A.damage(9))],
			random: 1,
		},
		{rng},
	)
}

function HeatLeech(rng) {
	return Monster(
		{
			name: 'Heat Leech',
			sprite: [2, 0],
			hp: rng.int(25, 31),
			intents: [I(A.damage(5), addPlayerResource('heat', 2, 10)), I(A.block(5)), I(A.damage(10))],
			random: 1,
		},
		{rng},
	)
}

function NullWraith(rng) {
	return Monster(
		{
			name: 'Null Wraith',
			sprite: [5, 2],
			hp: rng.int(28, 34),
			intents: [I(A.weak(1)), I(A.damage(7), addPlayerResource('corruption', 1, 6)), I(A.damage(11))],
			random: 1,
		},
		{rng},
	)
}

const normalEncounterFactories = [
	(rng) => MonsterRoom(ScrapHound(rng)),
	(rng) => MonsterRoom(HeatLeech(rng)),
	(rng) => MonsterRoom(NullWraith(rng)),
	(rng) => MonsterRoom(ScrapHound(rng), HeatLeech(rng)),
]

function ReactorSentinel(rng) {
	return MonsterRoom(
		Monster(
			{
				name: 'Reactor Sentinel',
				sprite: [4, 3],
				hp: 64,
				intents: [
					I(A.damage(10)),
					I(A.block(9), addPlayerResource('heat', 3, 10)),
					I(A.damage(15)),
					I(A.damage(7), A.weak(1)),
				],
			},
			{rng},
		),
	)
}

const probeSpec = {
	name: 'Architect Probe',
	sprite: [6, 11],
	hpRange: [10, 14],
	intents: [I(A.damage(4)), I(A.block(3), A.damage(3))],
}

function CoreArchitect(rng) {
	return MonsterRoom(
		Monster(
			{
				name: 'Core Architect',
				sprite: [8, 2],
				hp: 112,
				phases: [
					{
						id: 'survey',
						intents: [I(A.damage(8)), I(A.block(8), A.damage(5)), I(A.summon(probeSpec))],
					},
					{
						id: 'replicate',
						atHealthRatio: 0.6,
						intents: [I(A.damage(11)), I(A.damage(7), A.weak(1)), I(A.summon(probeSpec))],
						onEnter: [A.summon(probeSpec)],
					},
					{
						id: 'collapse',
						atHealthRatio: 0.3,
						intents: [I(A.damage(16)), I(A.damage(10), A.vulnerable(1)), I(A.damage(20))],
						onEnter: [{type: 'addPower', parameter: {source: 'self', target: 'self', power: 'strength', amount: 2}}],
					},
				],
			},
			{rng},
		),
	)
}

function assignRoom(dungeon, floor, column, type, room) {
	const node = dungeon.graph[floor]?.[column]
	if (!node) return
	node.type = type
	node.room = room
}

function differentColumn(first, offset = 1) {
	return (first + offset) % 3
}

export function createMechanicsMvpDungeon(options = {}) {
	const seed = String(options.seed ?? 'mechanics-mvp')
	const dungeon = Dungeon({
		width: 3,
		height: 6,
		minRooms: 3,
		maxRooms: 3,
		customPaths: '012',
		roomTypes: 'MMM',
		seed,
	})

	for (let floor = 1; floor <= 6; floor++) {
		for (let column = 0; column < 3; column++) {
			const roomRng = createRng(deriveSeed(seed, 'mechanics-mvp-room', floor, column))
			const factory = roomRng.pick(normalEncounterFactories)
			assignRoom(dungeon, floor, column, 'M', factory(roomRng))
		}
	}

	const routeRng = createRng(deriveSeed(seed, 'mechanics-mvp-routes'))
	const eventColumn = routeRng.int(0, 2)
	const merchantColumn = routeRng.int(0, 2)
	const eliteColumn = routeRng.int(0, 2)
	const treasureColumn = routeRng.int(0, 2)
	const finalCampfireColumn = routeRng.int(0, 2)

	assignRoom(dungeon, 2, eventColumn, 'Q', EventRoom('event:calibration-shrine'))
	assignRoom(dungeon, 3, merchantColumn, 'Q', MerchantRoom())
	assignRoom(dungeon, 4, eliteColumn, 'E', ReactorSentinel(createRng(deriveSeed(seed, 'mechanics-mvp-elite'))))
	assignRoom(dungeon, 4, differentColumn(eliteColumn), 'C', CampfireRoom())
	assignRoom(dungeon, 5, treasureColumn, 'Q', TreasureRoom())
	assignRoom(dungeon, 6, finalCampfireColumn, 'C', CampfireRoom())

	const bossFloor = dungeon.graph.length - 1
	assignRoom(dungeon, bossFloor, 0, 'boss', CoreArchitect(createRng(deriveSeed(seed, 'mechanics-mvp-boss'))))
	return dungeon
}

/**
 * A deliberately linear, fixed-seed run for manual regression testing.
 * Every tester sees the same encounters, shop inventory, rewards and boss RNG.
 * The route forces all strategic room types to appear in one short run.
 */
export function createMechanicsMvpDevDungeon(options = {}) {
	const seed = String(options.seed ?? mechanicsMvpDevSeed)
	const dungeon = Dungeon({
		width: 1,
		height: 6,
		minRooms: 1,
		maxRooms: 1,
		customPaths: '0',
		roomTypes: 'M',
		seed,
	})

	const encounterRng = createRng(deriveSeed(seed, 'mechanics-mvp-dev', 'opening'))
	assignRoom(dungeon, 1, 0, 'M', MonsterRoom(ScrapHound(encounterRng), HeatLeech(encounterRng)))
	assignRoom(dungeon, 2, 0, 'Q', EventRoom('event:calibration-shrine'))
	assignRoom(dungeon, 3, 0, 'Q', MerchantRoom())
	assignRoom(dungeon, 4, 0, 'E', ReactorSentinel(createRng(deriveSeed(seed, 'mechanics-mvp-dev', 'elite'))))
	assignRoom(dungeon, 5, 0, 'Q', TreasureRoom())
	assignRoom(dungeon, 6, 0, 'C', CampfireRoom())

	const bossFloor = dungeon.graph.length - 1
	assignRoom(dungeon, bossFloor, 0, 'boss', CoreArchitect(createRng(deriveSeed(seed, 'mechanics-mvp-dev', 'boss'))))
	return dungeon
}
