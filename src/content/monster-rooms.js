import {monsterAction as A, Monster, MonsterIntent} from '../game/monster.js'
import {createRng} from '../game/rng.js'
import {MonsterRoom} from '../game/rooms.js'

// Encounter registries now contain factories. A dungeon injects a room-scoped RNG,
// so HP rolls and randomized intents are reproducible without module-load randomness.
export const monsters = {}
export const elites = {}
export const bosses = {}

const I = (...actions) => MonsterIntent(...actions)
const hit = (amount) => I(A.damage(amount))
const block = (amount) => I(A.block(amount))
const weak = (amount) => I(A.weak(amount))
const vulnerable = (amount) => I(A.vulnerable(amount))
const fallbackRng = (rng, key) => rng || createRng(`encounter-fallback:${key}`)

monsters['Lone Orc Scout'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'lone-orc-scout')
	return MonsterRoom(
		Monster(
			{
				name: 'Orc Scout',
				sprite: [0, 2],
				hp: rng.int(8, 14),
				intents: [hit(7), hit(11), hit(7), block(9)],
				random: 2,
			},
			{rng},
		),
	)
}

monsters['Orc Patrol'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'orc-patrol')
	return MonsterRoom(
		Monster(
			{
				name: 'Orc Archer',
				sprite: [0, 5],
				hp: rng.int(8, 14),
				intents: [hit(7), hit(11), hit(7), block(9)],
				random: 2,
			},
			{rng},
		),
		Monster(
			{
				name: 'Orc Scout',
				sprite: [0, 2],
				hp: rng.int(8, 14),
				intents: [hit(6), hit(11), hit(5), block(5)],
				random: 1,
			},
			{rng},
		),
	)
}

monsters['Orc Warrior'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'orc-warrior')
	return MonsterRoom(
		Monster(
			{
				name: 'Orc Warrior',
				sprite: [0, 0],
				hp: rng.int(18, 20),
				intents: [hit(7), hit(11), hit(7), block(9)],
				random: 4,
			},
			{rng},
		),
	)
}

monsters['Skeleton Warrior'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'skeleton-warrior')
	return MonsterRoom(
		Monster(
			{
				name: 'Skeleton Warrior',
				sprite: [4, 0],
				hp: rng.int(33, 37),
				intents: [vulnerable(1), hit(10), hit(6), I(), weak(1)],
				random: 2,
			},
			{rng},
		),
	)
}

monsters['Jaw Worm'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'jaw-worm')
	return MonsterRoom(
		Monster(
			{
				name: 'Jaw Worm',
				sprite: [6, 2],
				hp: rng.int(40, 44),
				intents: [hit(11), I(A.damage(7), A.block(5)), block(6)],
			},
			{rng},
		),
	)
}

monsters['Slime and Shaman'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'slime-and-shaman')
	return MonsterRoom(
		Monster(
			{
				name: 'Small Slime',
				sprite: [2, 0],
				hp: rng.int(13, 17),
				intents: [hit(7), I(A.block(4), A.damage(8)), hit(6), I(), block(6)],
				random: 2,
			},
			{rng},
		),
		Monster(
			{
				name: 'Orc Shaman',
				sprite: [0, 1],
				hp: 29,
				intents: [hit(9), hit(8), weak(1), hit(6), I()],
				random: 2,
			},
			{rng},
		),
	)
}

monsters['Ghost and Berserker'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'ghost-and-berserker')
	return MonsterRoom(
		Monster(
			{
				name: 'Ghost',
				sprite: [5, 3],
				hp: rng.int(28, 32),
				intents: [weak(1), hit(9), hit(6), I(), weak(1)],
				random: 2,
			},
			{rng},
		),
		Monster(
			{
				name: 'Orc Berserker',
				sprite: [0, 3],
				hp: rng.int(50, 54),
				intents: [vulnerable(1), hit(6), hit(9), block(10)],
				random: 2,
			},
			{rng},
		),
	)
}

monsters['Rat Pack'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'rat-pack')
	return MonsterRoom(
		Monster({name: 'Giant Rat', sprite: [6, 11], hp: rng.int(12, 15), random: 2, intents: [hit(6)]}, {rng}),
		Monster({name: 'Giant Rat', sprite: [6, 11], hp: rng.int(12, 15), random: 2, intents: [hit(6)]}, {rng}),
		Monster({name: 'Giant Rat', sprite: [6, 11], hp: rng.int(10, 16), random: 3, intents: [hit(6)]}, {rng}),
	)
}

monsters['Troll Bruiser'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'troll-bruiser')
	return MonsterRoom(
		Monster(
			{
				name: 'Troll',
				sprite: [1, 2],
				hp: 28,
				intents: [weak(1), I(A.block(10), A.damage(10)), hit(21)],
			},
			{rng},
		),
	)
}

elites['Death Knight'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'death-knight')
	return MonsterRoom(
		Monster(
			{
				name: 'Death Knight',
				sprite: [4, 3],
				hp: 46,
				intents: [hit(12), I(A.block(6), A.damage(11)), I(A.block(5), A.damage(16)), I(), block(6)],
			},
			{rng},
		),
	)
}

elites['Orc Warchief'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'orc-warchief')
	return MonsterRoom(
		Monster(
			{
				name: 'Orc Warchief',
				sprite: [0, 4],
				hp: 60,
				intents: [hit(12), I(A.damage(11), A.weak(1)), I(A.damage(4), A.block(6))],
				random: 6,
			},
			{rng},
		),
	)
}

elites['Two-Headed Ettin'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'two-headed-ettin')
	return MonsterRoom(Monster({name: 'Ettin', sprite: [1, 0], hp: 70, block: 12, intents: [block(5), hit(16)]}, {rng}))
}

elites['Dark Covenant'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'dark-covenant')
	return MonsterRoom(
		Monster({name: 'Ghost Cultist', sprite: [5, 3], hp: rng.int(39, 46), intents: [weak(1), hit(10)]}, {rng}),
		Monster({name: 'Hag', sprite: [5, 4], hp: rng.int(39, 46), intents: [hit(10), weak(1), hit(4)]}, {rng}),
		Monster({name: 'Wraith', sprite: [5, 2], hp: rng.int(39, 46), intents: [hit(2), hit(10), hit(8)]}, {rng}),
	)
}

bosses['Ancient Dragon'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'ancient-dragon')
	return MonsterRoom(
		Monster(
			{
				name: 'Ancient Dragon',
				sprite: [8, 2],
				hp: rng.int(100, 140),
				intents: [hit(16), block(6), hit(16), hit(7), weak(2)],
				random: 5,
			},
			{rng},
		),
	)
}

bosses['Slime King'] = (inputRng) => {
	const rng = fallbackRng(inputRng, 'slime-king')
	return MonsterRoom(
		Monster(
			{
				name: 'Slime King',
				sprite: [2, 1],
				hp: 62,
				intents: [hit(5), hit(8), hit(12), hit(17), hit(23), hit(30), hit(38), hit(45)],
			},
			{rng},
		),
	)
}
