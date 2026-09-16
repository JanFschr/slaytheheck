import {bosses, elites, monsters} from '../content/monster-rooms.js'
import {CampfireRoom, StartRoom} from './rooms.js'
import {createRng, deriveSeed, deterministicId} from './rng.js'

/**
 * A procedural generated dungeon map for Slay the Web. Again, heavily inspired by Slay the Spire.
 *
 * Vocabulary from top to bottom:
 * - "dungeon": the full structure with graph, paths, and current position
 * - "graph": 2d array of floors, each floor is an array of nodes
 * - "floor": one row of nodes (graph[y] is a floor)
 * - "node": a single point on the map at graph[y][x]
 * - "room": content of a node (monster, campfire, etc)
 * - "paths": pre-generated possible routes from start to boss (4 paths in default dungeon)
 * - "pathTaken": the actual route the player chose (grows as they play)
 * - "edges": which nodes connect to which (derived from paths, stored as node IDs on each node)
 * - "move": [y, x] coordinates
 */

/** @typedef {import('./cards.js').CARD} Card */
/** @typedef {import('./rooms.js').Room} Room */

/**
 * @typedef {object} MapNode - is a single point on the map. It will either contain a room, or be a filler node.
 * @prop {string} id
 * @prop {MapNodeTypes} type
 * @prop {Room} [room]
 * @prop {Array<string>} edges - a list of node ids that this node connects to
 * @prop {boolean} didVisit - whether you have visited this node or not
 */
/** @typedef {Array<Array<MapNode>>} Graph is a list of floors with nodes*/
/** @typedef {Array<Array<Move>>} Path is a list of moves that describe a path from top to bottom */
/** @typedef {{x: number, y: number}} Position on the map. Y is the floor. X is the node. */
/** @typedef {Array<number, number>} Move also position map, but stored differently */

/**
 * @typedef {object} GraphOptions
 * @prop {number} width how many nodes on each floor
 * @prop {number} height how many floors
 * @prop {number} [minRooms] minimum amount of rooms to generate per floor
 * @prop {number} [maxRooms] maximum amount of rooms to generate per floor
 * @prop {string} [roomTypes] a string like "MMCE". Repeat a letter to increase the chance of it appearing. M=Monster, C=Campfire, E=Elite.
 * @prop {string} [customPaths] a string of indexes (numbers) from where to draw the paths, for example "530" would draw three paths.
 * @prop {string|number} [seed] deterministic seed for the map
 */

/** @type {GraphOptions} */
export const defaultOptions = {
	width: 10,
	height: 6,
	minRooms: 2,
	maxRooms: 5,
	roomTypes: 'MMMCE',
}

/**
 * @typedef {object} Dungeon An instance of a dungeon
 * @prop {string} id a unique id
 * @prop {string} seed deterministic seed used to generate it
 * @prop {Graph} graph
 * @prop {Array<Path>} paths
 * @prop {number} x current x position (which path)
 * @prop {number} y current y position (where on the path)
 * @prop {Array<Move>} pathTaken a list of moves we've taken
 */

/**
 * Creates a new dungeon, complete with graph and paths. Map topology and each
 * encounter use separate derived RNG streams so adding a random roll to one room
 * cannot reshuffle the rest of the run.
 * @param {GraphOptions} [options]
 * @returns {Dungeon}
 */
export default function Dungeon(options = {}) {
	const normalizedOptions = {...defaultOptions, ...options}
	const seed = String(normalizedOptions.seed ?? 'dungeon-default')
	const graph = generateGraph({...normalizedOptions, seed: deriveSeed(seed, 'map')})
	const paths = generatePaths(graph, normalizedOptions.customPaths)

	graph.forEach((floor, floorNumber) => {
		floor.forEach((node, nodeIndex) => {
			if (!node.type) return
			const roomRng = createRng(deriveSeed(seed, 'encounter', floorNumber, nodeIndex, node.type))
			node.room = decideRoomType(node.type, floorNumber, roomRng)
		})
	})

	return {
		id: deterministicId('dungeon', seed),
		seed,
		graph,
		paths,
		x: 0,
		y: 0,
		pathTaken: [[0, 0]],
	}
}

/**
 * Returns a graph array representation of the map.
 * @param {GraphOptions} [options]
 * @param {ReturnType<typeof createRng>} [inputRng]
 * @returns {Graph}
 */
export function generateGraph(options = {}, inputRng) {
	const normalizedOptions = {...defaultOptions, ...options}
	const {width, height, minRooms, maxRooms, roomTypes} = normalizedOptions
	const graphSeed = String(
		normalizedOptions.seed ??
			deriveSeed('graph-default', width, height, minRooms, maxRooms, roomTypes, normalizedOptions.customPaths || ''),
	)
	const rng = inputRng || createRng(graphSeed)
	const graph = []

	for (let floorNumber = 0; floorNumber < height; floorNumber++) {
		const floor = []
		let desiredAmountOfRooms = rng.int(minRooms, maxRooms)
		if (desiredAmountOfRooms > width) desiredAmountOfRooms = width

		for (let i = 0; i < desiredAmountOfRooms; i++) {
			const nodeType = decideNodeType(roomTypes, floorNumber, rng)
			floor.push(createMapNode(nodeType))
		}

		while (floor.length < width) floor.push(createMapNode())
		graph.push(rng.shuffle(floor))
	}

	graph.unshift([createMapNode('start')])
	graph.push([createMapNode('boss')])

	graph.forEach((floor, y) => {
		floor.forEach((node, x) => {
			node.id = deterministicId('node', graphSeed, y, x, node.type || 'empty')
		})
	})

	return graph
}

/**
 * Returns an array of possible paths from start to finish.
 * @param {Graph} graph - dungeon graph
 * @param {string} [customPaths]
 * @returns {Array<Path>} customPaths a list of paths
 */
export function generatePaths(graph, customPaths) {
	const paths = []

	if (customPaths) {
		Array.from(customPaths).forEach((value) => {
			const path = findPath(graph, Number(value))
			paths.push(path)
		})
	} else {
		graph[1].forEach((_column, index) => {
			const path = findPath(graph, index)
			paths.push(path)
		})
	}

	return paths
}

/**
 * Ensures it's not a filler node
 * @param {MapNode} node
 * @returns {boolean}
 */
function validNode(node) {
	return node && Boolean(node.type)
}

/**
 * Finds a path from start to finish in the graph.
 * @param {Graph} graph
 * @param {number} preferredIndex the column you'd like the path to follow where possible
 * @param {boolean} debug if true, logs to console
 * @returns {Path} an array of moves. Each move contains the Y/X coords of the graph.
 */
function findPath(graph, preferredIndex, debug = false) {
	if (debug) console.groupCollapsed('finding path', preferredIndex)

	const path = []
	/** @type {MapNode|false} */
	let lastVisited = false

	for (const [floorIndex, floor] of graph.entries()) {
		if (debug) console.group(`floor ${floorIndex}`)
		const nextFloor = graph[floorIndex + 1]
		if (!nextFloor) {
			if (debug) console.log('no next floor, stopping')
			if (debug) console.groupEnd()
			break
		}

		const aIndex = lastVisited ? floor.indexOf(lastVisited) : 0
		const moveFrom = [floorIndex, aIndex]
		if (debug) console.log('setting from', moveFrom)

		const bInfo =
			searchValidNode(nextFloor, preferredIndex, 'forward') || searchValidNode(nextFloor, preferredIndex, 'backward')
		if (!bInfo) throw Error('failed to find node to move to')
		const moveTo = [floorIndex + 1, bInfo.index]
		lastVisited = bInfo.node

		const move = [moveFrom, moveTo]
		path.push(move)

		if (debug) {
			console.log(`added move to path ${moveFrom} to ${moveTo}`)
			console.groupEnd()
		}
	}

	storePathOnGraph(graph, path)
	if (debug) console.groupEnd()
	return path
}

/**
 * Searches for the first valid node in a direction
 * @param {Array<MapNode>} floor
 * @param {number} startX - the index to start search from
 * @param {string} direction must be "forward" or "backward"
 * @returns {{node: MapNode, index: number}|null}
 */
function searchValidNode(floor, startX, direction) {
	const step = direction === 'forward' ? 1 : -1
	if (direction === 'forward') {
		for (let i = startX; i >= 0 && i < floor.length; i += step) {
			const node = floor[i]
			if (validNode(node)) return {node, index: i}
		}
	} else {
		for (let i = startX; i >= 0; i += step) {
			const node = floor[i]
			if (validNode(node)) return {node, index: i}
		}
	}
	return null
}

/**
 * For debugging purposes, creates a multi-line text representation of the map.
 * @param {Graph} graph
 * @returns {string}
 */
export function graphToString(graph) {
	const textGraph = graph.map((floor) =>
		floor.map((node) => {
			return emojiFromNodeType(node.type)
		}),
	)
	return textGraph.map((floor) => floor.join('')).join('\n')
}

/**
 * Stores a path directly on a graph
 * @param {Graph} graph
 * @param {Path} path
 * @returns {Graph}
 */
export function storePathOnGraph(graph, path) {
	path.forEach((move) => {
		const a = nodeFromMove(graph, move[0])
		const b = nodeFromMove(graph, move[1])
		if (!Array.isArray(a.edges)) a.edges = []
		if (!Array.isArray(b.edges)) b.edges = []
		if (!a.edges.includes(b.id)) a.edges.push(b.id)
	})
	return graph
}

/**
 * @param {Graph} graph
 * @param {Move} move
 * @returns {MapNode}
 */
function nodeFromMove(graph, [floor, node]) {
	return graph[floor][node]
}

/** @enum {string} different type of nodes and their emoji equivalents */
export const MapNodeTypes = {
	start: '👣',
	M: '💀',
	C: '🏕️',
	Q: '❓',
	E: '👹',
	boss: '🌋',
}

export function nodeTypeToName(nodeType) {
	return {
		start: 'Start room',
		C: 'Campfire',
		M: 'Monster',
		E: 'Elite monster',
		boss: 'Boss',
	}[nodeType]
}

/**
 * A node in the dungeon map graph
 * @param {MapNodeTypes} [type] - a string key to represent the type of room
 * @returns {MapNode}
 */
function createMapNode(type) {
	return {
		id: '',
		type,
		room: undefined,
		edges: [],
		didVisit: false,
	}
}

/**
 * The type of node is decided by the floor number and the room types.
 * @param {string} nodeTypes - a string of possible node types
 * @param {number} [floor]
 * @param {ReturnType<typeof createRng>} rng
 * @returns {string}
 */
function decideNodeType(nodeTypes, floor, rng) {
	if (floor < 2) return 'M'
	if (floor < 3) return rng.pick(Array.from('MC'))
	if (floor > 6) return rng.pick(Array.from('MMEEC'))
	return rng.pick(Array.from(nodeTypes))
}

/**
 * Converts the string type of a node to an emoji string.
 * @param {string} [type]
 * @returns {string}
 */
export function emojiFromNodeType(type) {
	if (!type) return ' '
	return MapNodeTypes[type]
}

/**
 * Create a room from the node's type.
 * Encounter registries contain factories that consume the injected room RNG.
 * @param {string} type
 * @param {number} floor
 * @param {ReturnType<typeof createRng>} [inputRng]
 * @returns {Room}
 */
export function decideRoomType(type, floor, inputRng) {
	const rng = inputRng || createRng(deriveSeed('room-fallback', type, floor))
	const pickRandomFromObj = (obj) => {
		const key = rng.pick(Object.keys(obj))
		const room = obj[key]
		return typeof room === 'function' ? room(rng) : room
	}
	if (floor === 0) return StartRoom()
	if (type === 'C') return CampfireRoom()
	if (type === 'M') return pickRandomFromObj(monsters)
	if (type === 'E') return pickRandomFromObj(elites)
	if (type === 'boss') return pickRandomFromObj(bosses)
	throw new Error(`Could not match node type "${type}" with a dungeon room`)
}
