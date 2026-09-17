import test from 'ava'
import actions from '../src/game/actions.js'
import createNewGame from '../src/game/new-game.js'
import {
	clearLocalRun,
	decode,
	encode,
	getLocalRunMetadata,
	loadLocalRun,
	localSaveKey,
	saveLocalRun,
} from '../src/ui/save-load.js'

function memoryStorage() {
	const values = new Map()
	return {
		getItem(key) {
			return values.has(key) ? values.get(key) : null
		},
		setItem(key, value) {
			values.set(key, value)
		},
		removeItem(key) {
			values.delete(key)
		},
	}
}

test('can save and load a game state', (t) => {
	let state = actions.createNewState()
	state = actions.setDungeon(state)
	state = actions.addStarterDeck(state)
	const x = state
	t.is(typeof x, 'object')
	const encoded = encode(x)
	t.is(typeof encoded, 'string')
	const decoded = decode(encoded)
	t.is(typeof decoded, 'object')
})

test('edges are stripped during encode', (t) => {
	let state = actions.createNewState()
	state = actions.setDungeon(state)

	// Count original edges
	let originalEdgeCount = 0
	state.dungeon.graph.forEach((floor) => {
		floor.forEach((node) => {
			if (node.edges && node.edges.length > 0) {
				originalEdgeCount += node.edges.length
			}
		})
	})

	t.true(originalEdgeCount > 0, 'original state should have edges')

	// Encode and check edges are NOT in the serialized string
	const encoded = encode(state)
	const parsed = JSON.parse(encoded)

	let encodedEdgeCount = 0
	parsed.dungeon.graph.forEach((floor) => {
		floor.forEach((node) => {
			if (node.edges) {
				encodedEdgeCount += node.edges.length
			}
		})
	})

	t.is(encodedEdgeCount, 0, 'encoded state should have no edges')
})

test('edges are reconstructed during decode', (t) => {
	let state = actions.createNewState()
	state = actions.setDungeon(state)

	// Capture original edges structure
	const originalEdges = new Map()
	state.dungeon.graph.forEach((floor) => {
		floor.forEach((node) => {
			if (node.edges && node.edges.length > 0) {
				originalEdges.set(node.id, [...node.edges].sort())
			}
		})
	})

	t.true(originalEdges.size > 0, 'original state should have edges')

	// Encode and decode
	const encoded = encode(state)
	const decoded = decode(encoded)

	// Verify edges are reconstructed
	let reconstructedEdgeCount = 0
	decoded.dungeon.graph.forEach((floor) => {
		floor.forEach((node) => {
			if (node.edges && node.edges.length > 0) {
				reconstructedEdgeCount++
				// Verify this node's edges match original
				const original = originalEdges.get(node.id)
				const reconstructed = [...node.edges].sort()
				t.deepEqual(reconstructed, original, `edges for node ${node.id} should match original`)
			}
		})
	})

	t.is(reconstructedEdgeCount, originalEdges.size, 'all edges should be reconstructed')
})

test('dungeon navigation works after save/load cycle', (t) => {
	let state = actions.createNewState()
	state = actions.setDungeon(state)

	// Start at beginning (0,0)
	t.is(state.dungeon.y, 0)
	t.is(state.dungeon.x, 0)

	// Find a valid move from starting position
	const startNode = state.dungeon.graph[0][0]
	t.true(startNode.edges.length > 0, 'start node should have edges')

	// Get first floor nodes that are connected
	const firstFloor = state.dungeon.graph[1]
	const targetNode = firstFloor.find((node) => startNode.edges.includes(node.id))
	t.truthy(targetNode, 'should find connected node on first floor')
	const targetX = firstFloor.indexOf(targetNode)

	// Move to that node
	state = actions.move(state, {move: {x: targetX, y: 1}})
	t.is(state.dungeon.y, 1)
	t.is(state.dungeon.x, targetX)

	// Save and load
	const encoded = encode(state)
	const loaded = decode(encoded)

	// Verify position is preserved
	t.is(loaded.dungeon.y, 1)
	t.is(loaded.dungeon.x, targetX)

	// Verify we can continue navigating
	const currentNode = loaded.dungeon.graph[loaded.dungeon.y][loaded.dungeon.x]
	t.true(Array.isArray(currentNode.edges), 'current node should have edges array')
	t.true(currentNode.edges.length > 0, 'current node should have edges to next floor')

	// Find a valid next move
	const nextFloor = loaded.dungeon.graph[2]
	const nextTarget = nextFloor.find((node) => currentNode.edges.includes(node.id))
	t.truthy(nextTarget, 'should be able to find next move after load')
})

test('local run save round-trips deterministic state and pending choices', (t) => {
	const storage = memoryStorage()
	const game = createNewGame(false, {seed: 'local-save-roundtrip'})
	const state = structuredClone(game.state)
	state.gold = 137
	state.pendingChoice = {
		id: 'choice-1',
		kind: 'card',
		options: state.hand.slice(0, 2).map((card) => card.id),
	}

	const saved = saveLocalRun(state, {
		storage,
		now: () => new Date('2026-09-17T12:00:00.000Z'),
	})
	const restored = loadLocalRun(undefined, {storage})

	t.is(saved.savedAt, '2026-09-17T12:00:00.000Z')
	t.is(restored.state.seed, 'local-save-roundtrip')
	t.is(restored.state.gold, 137)
	t.deepEqual(restored.state.pendingChoice, state.pendingChoice)
	t.deepEqual(restored.state.rng, state.rng)
	t.true(restored.state.dungeon.graph.some((floor) => floor.some((node) => Array.isArray(node.edges))))
})

test('local save slots are isolated by content pack', (t) => {
	const storage = memoryStorage()
	const core = createNewGame(false, {seed: 'core-save'})
	const mvp = createNewGame(false, {seed: 'mvp-save', contentPack: 'mechanics-mvp'})

	saveLocalRun(core.state, {storage})
	saveLocalRun(mvp.state, {storage})

	t.not(localSaveKey(), localSaveKey('mechanics-mvp'))
	t.is(loadLocalRun(undefined, {storage}).state.seed, 'core-save')
	t.is(loadLocalRun('mechanics-mvp', {storage}).state.seed, 'mvp-save')
})

test('metadata exposes a compact continue-run summary', (t) => {
	const storage = memoryStorage()
	const state = structuredClone(createNewGame(false, {seed: 'summary-save'}).state)
	state.gold = 88
	state.player.currentHealth = 61

	saveLocalRun(state, {storage})
	const metadata = getLocalRunMetadata(undefined, {storage})

	t.is(metadata.seed, 'summary-save')
	t.is(metadata.health, 61)
	t.is(metadata.maxHealth, state.player.maxHealth)
	t.is(metadata.gold, 88)
	t.is(metadata.deckSize, state.deck.length)
	t.false('state' in metadata)
})

test('clearing and corrupt saves fail safely', (t) => {
	const storage = memoryStorage()
	const game = createNewGame(false, {seed: 'clear-save'})

	saveLocalRun(game.state, {storage})
	t.truthy(loadLocalRun(undefined, {storage}))
	t.true(clearLocalRun(undefined, {storage}))
	t.is(loadLocalRun(undefined, {storage}), null)

	storage.setItem(localSaveKey(), '{ definitely not json')
	t.is(loadLocalRun(undefined, {storage}), null)
	t.is(storage.getItem(localSaveKey()), null)
})

test('createNewGame can hydrate a local resume state without rebuilding the run', (t) => {
	const original = structuredClone(createNewGame(false, {seed: 'resume-state'}).state)
	original.gold = 222
	original.player.currentHealth = 43

	const resumed = createNewGame(false, {resumeState: original})

	t.is(resumed.seed, 'resume-state')
	t.is(resumed.state, original)
	t.is(resumed.state.gold, 222)
	t.is(resumed.state.player.currentHealth, 43)
})

// Set() serialization no longer needed - we don't use Set/Map in game state
test.skip('can serialize Set()', (t) => {
	const set = new Set()
	set.add(42)
	const obj = {set}
	const encoded = encode(obj)
	const decoded = decode(encoded)
	t.true(decoded.set.has(42))
})
