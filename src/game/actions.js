import {produce} from 'immer'
import {createDefaultDungeon} from '../content/dungeons.js'
import {clamp} from '../utils.js'
import {CardTargets, createCard} from './cards.js'
import {conditionsAreValid} from './conditions.js'
import {normalizeMonsterIntent} from './monster.js'
import powers from './powers.js'
import {createRng, deriveSeed, deterministicId} from './rng.js'
import {getCurrRoom, getRoomTargets, isDungeonCompleted} from './utils-state.js'

/** @typedef {import('./dungeon.js').Dungeon} Dungeon */
/** @typedef {import('./cards.js').CARD} CARD */
/** @typedef {import('./rooms.js').Room} Room */
/** @typedef {import('./cards.js').CardPowers} CardPowers */

/**
	We don't mutate the state directly, instead we run "action functions" on it.
 * @template T
 * @callback ActionFn
 * @param {State} state the current state
 * @param {T} [props] an object of arguments
 * @returns {State} a new state object
 */

/**
 * The big "game state" object
 * @typedef {object} State
 * @prop {number} createdAt
 * @prop {number} endedAt
 * @prop {boolean} won
 * @prop {number} turn
 * @prop {string} [seed]
 * @prop {Record<string, number>} [rng] serializable counters for independent RNG streams
 * @prop {Array} deck
 * @prop {Array} drawPile
 * @prop {Array} hand
 * @prop {Array} discardPile
 * @prop {Array} exhaustPile
 * @prop {Player} player
 * @prop {Dungeon} [dungeon]
 * @prop {boolean} didCheat
 */

/**
 * @typedef {object} Player
 * @prop {number} currentEnergy
 * @prop {number} maxEnergy
 * @prop {number} currentHealth
 * @prop {number} maxHealth
 * @prop {number} block
 * @prop {object} powers
 */

function getStateSeed(state) {
	return String(state.seed ?? state.createdAt ?? 'legacy-run')
}

function getRngCounter(state, stream) {
	return state.rng?.[stream] || 0
}

function getStreamRng(state, stream) {
	const counter = getRngCounter(state, stream)
	return {
		counter,
		rng: createRng(deriveSeed(getStateSeed(state), stream, counter)),
	}
}

function setRngCounter(draft, stream, counter) {
	if (!draft.rng) draft.rng = {}
	draft.rng[stream] = counter
}

function shuffleForState(state, list, stream = 'deck') {
	const {rng, counter} = getStreamRng(state, stream)
	return {value: rng.shuffle(list), nextCounter: counter + 1}
}

function createRunCards(state, identifiers) {
	const firstIndex = getRngCounter(state, 'cardInstances')
	const seed = getStateSeed(state)
	const cards = identifiers.map((identifier, offset) =>
		createCard(identifier, false, {
			instanceId: deterministicId('card', seed, 'instance', firstIndex + offset, identifier),
		}),
	)
	return {cards, nextCounter: firstIndex + identifiers.length}
}

function resolveSelf(value, selfTarget) {
	return value === 'self' ? selfTarget : value
}

/** Execute one declarative action descriptor from a card or monster intent. */
function executeActionDescriptor(state, action, context = {}) {
	const actionFn = allActions[action.type]
	if (!actionFn) throw new Error(`Unknown action descriptor: ${action.type}`)
	const parameter = {...(action.parameter || {})}
	if (parameter.target) parameter.target = resolveSelf(parameter.target, context.self)
	if (parameter.source) parameter.source = resolveSelf(parameter.source, context.self)
	return actionFn(state, {...parameter, ...(context.extra || {})})
}

/**
 * Everything starts here.
 * @returns {State} the big game state object
 */
function createNewState() {
	return {
		turn: 1,
		deck: [],
		drawPile: [],
		hand: [],
		discardPile: [],
		exhaustPile: [],
		player: {
			maxEnergy: 3,
			currentEnergy: 3,
			maxHealth: 72,
			currentHealth: 72,
			block: 0,
			powers: {},
		},
		dungeon: undefined,
		createdAt: Date.now(),
		endedAt: undefined,
		won: false,
		didCheat: false,
	}
}

/**
 * By default a new game doesn't come with a dungeon. You have to set one explicitly.
 * Keep the historical mutable setup semantics: test fixtures and dungeon editors
 * intentionally adjust coordinates/rooms immediately after injecting a dungeon.
 * @param {State} state
 * @param {Dungeon} [dungeon]
 * @returns {State}
 */
function setDungeon(state, dungeon) {
	state.dungeon = dungeon || createDefaultDungeon({seed: getStateSeed(state)})
	return state
}

/** Draws a starter deck and deterministically shuffles it. */
function addStarterDeck(state) {
	const identifiers = [
		'core:defend',
		'core:defend',
		'core:defend',
		'core:defend',
		'core:strike',
		'core:strike',
		'core:strike',
		'core:strike',
		'core:strike',
		'core:bash',
	]
	const {cards: deck, nextCounter: cardCounter} = createRunCards(state, identifiers)
	const shuffled = shuffleForState(state, deck)
	return produce(state, (draft) => {
		draft.deck = deck
		draft.drawPile = shuffled.value
		setRngCounter(draft, 'cardInstances', cardCounter)
		setRngCounter(draft, 'deck', shuffled.nextCounter)
	})
}

/**
 * Move X cards from deck to hand.
 * @type {ActionFn<{amount: number}>}
 */
function drawCards(state, options) {
	const amount = options?.amount ? options.amount : 5
	const shouldRecycle = state.drawPile.length < amount
	const recycled = shouldRecycle ? shuffleForState(state, state.drawPile.concat(state.discardPile)) : null

	return produce(state, (draft) => {
		if (recycled) {
			draft.drawPile = recycled.value
			draft.discardPile = []
			setRngCounter(draft, 'deck', recycled.nextCounter)
		}
		const newCards = draft.drawPile.slice(0, amount)
		draft.hand = draft.hand.concat(newCards)
		for (let i = 0; i < amount; i++) draft.drawPile.shift()
	})
}

/** @type {ActionFn<{card: CARD}>} */
function addCardToHand(state, {card}) {
	return produce(state, (draft) => {
		draft.hand.push(card)
	})
}

/** @type {ActionFn<{card: CARD}>} */
function discardCard(state, {card}) {
	return produce(state, (draft) => {
		draft.hand = state.hand.filter((c) => c.id !== card.id)
		if (card.exhaust) draft.exhaustPile.push(card)
		else draft.discardPile.push(card)
	})
}

/** @type {ActionFn<{}>} */
function discardHand(state) {
	return produce(state, (draft) => {
		draft.hand.forEach((card) => {
			draft.discardPile.push(card)
		})
		draft.hand = []
	})
}

/** @type {ActionFn<{card: object}>} */
function removeCard(state, {card}) {
	return produce(state, (draft) => {
		draft.deck = state.deck.filter((c) => c.id !== card.id)
	})
}

/** @type {ActionFn<{card: object}>} */
function upgradeCard(state, {card}) {
	return produce(state, (draft) => {
		const upgradedCard = createCard(card.definitionId || card.name, true, {instanceId: card.id})
		const piles = [draft.deck, draft.hand, draft.drawPile, draft.discardPile, draft.exhaustPile]
		piles.forEach((pile) => {
			const index = pile.findIndex((c) => c.id === card.id)
			if (index !== -1) pile[index] = upgradedCard
		})
	})
}

/**
 * Adds block to any ordinary room target.
 * @type {ActionFn<{target: string, amount: number}>}
 */
function addBlock(state, {target, amount}) {
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((model) => {
			model.block = (model.block || 0) + amount
		})
	})
}

/**
 * Add stacks of a power. turnEndCompensation preserves the historical monster
 * debuff behavior because powers are decremented later in the same end-turn pass.
 * @type {ActionFn<{target: string, power: string, amount: number, turnEndCompensation?: boolean}>}
 */
function addPower(state, {target, power, amount, turnEndCompensation = false}) {
	const appliedAmount = amount + (turnEndCompensation ? 1 : 0)
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((model) => {
			model.powers[power] = (model.powers[power] || 0) + appliedAmount
		})
	})
}

/**
 * Deal damage from a source through the common weak/strength pipeline.
 * @type {ActionFn<{source?: string, target: string, amount: number}>}
 */
function dealDamage(state, {source = 'player', target, amount = 0}) {
	let finalAmount = amount
	const sourceModel = source ? getRoomTargets(state, source)[0] : null
	if (sourceModel?.powers?.strength) finalAmount += powers.strength.use(sourceModel.powers.strength)
	if (sourceModel?.powers?.weak) finalAmount = powers.weak.use(finalAmount)
	return removeHealth(state, {target, amount: finalAmount})
}

/**
 * Play a card.
 * @type {ActionFn<{card: object, target?: string}>}
 */
function playCard(state, {card, target}) {
	if (!card) throw new Error('No card to play')
	if (!target) target = card.target
	if (typeof target !== 'string') throw new Error(`Wrong target to play card: ${target},${card.target}`)
	if (target === 'enemy') throw new Error('Wrong target, did you mean "enemy0" or "allEnemies"?')
	if (state.player.currentEnergy < card.energy) throw new Error('Not enough energy to play card')
	let newState = discardCard(state, {card})
	newState = produce(newState, (draft) => {
		draft.player.currentEnergy = newState.player.currentEnergy - card.energy
		if (card.block) draft.player.block = newState.player.block + card.block
	})
	if (card.type === 'attack' || card.damage) {
		const newTarget = card.target === CardTargets.allEnemies ? card.target : target
		newState = dealDamage(newState, {source: 'player', target: newTarget, amount: card.damage})
	}
	if (card.powers) newState = applyCardPowers(newState, {target, card})
	newState = useCardActions(newState, {target, card})
	return newState
}

/** @type {ActionFn<{card: object, target?: string}>} */
export function useCardActions(state, {target, card}) {
	if (!card.actions) return state
	let nextState = state

	card.actions.forEach((action) => {
		if (action.conditions && !conditionsAreValid(state, action.conditions)) return
		const parameter = {...(action.parameter || {}), target}
		nextState = executeActionDescriptor(nextState, {...action, parameter}, {extra: {card}})
	})
	return nextState
}

/** @type {ActionFn<{target: string, amount: number}>} */
function addHealth(state, {target, amount}) {
	return produce(state, (draft) => {
		const targets = getRoomTargets(draft, target)
		targets.forEach((t) => {
			t.currentHealth = clamp(t.currentHealth + amount, 0, t.maxHealth)
		})
	})
}

/** @type {ActionFn<{card: CARD}>} */
function addRegenEqualToAllDamage(state, {card}) {
	if (!card) throw new Error('missing card!')
	return produce(state, (draft) => {
		const room = getCurrRoom(state)
		const aliveMonsters = room.monsters.filter((monster) => monster.currentHealth > 0)
		const {regen = 0} = state.player.powers
		const totalDamage = aliveMonsters.length * card.damage
		draft.player.powers.regen = totalDamage + regen
	})
}

/** @type {ActionFn<{}>} */
const removePlayerDebuffs = (state) => {
	return produce(state, (draft) => {
		draft.player.powers.weak = 0
		draft.player.powers.vulnerable = 0
	})
}

/** @type {ActionFn<{amount?: number}>} */
function addEnergyToPlayer(state, props) {
	const amount = props?.amount ? props.amount : 1
	return produce(state, (draft) => {
		draft.player.currentEnergy = draft.player.currentEnergy + amount
	})
}

/** @type {ActionFn<{target: string, amount: number}>} */
const removeHealth = (state, {target, amount = 0}) => {
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((t) => {
			if (t.powers.vulnerable) amount = powers.vulnerable.use(amount)
			const amountAfterBlock = t.block - amount
			if (amountAfterBlock < 0) {
				t.block = 0
				t.currentHealth = t.currentHealth + amountAfterBlock
			} else {
				t.block = amountAfterBlock
			}
			if (target === 'player' && t.currentHealth < 1) draft.endedAt = Date.now()
		})
	})
}

/** @type {ActionFn<{target: CardTargets, amount: number}>} */
const setHealth = (state, {target, amount}) => {
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((t) => {
			t.currentHealth = amount
		})
	})
}

/** @type {ActionFn<{card: CARD, target: CardTargets}>} */
function applyCardPowers(state, {card, target}) {
	let nextState = state
	for (const [name, stacks] of Object.entries(card.powers)) {
		let powerTarget = target
		if (card.target === CardTargets.player) powerTarget = 'player'
		if (card.target === CardTargets.allEnemies) powerTarget = 'allEnemies'
		nextState = addPower(nextState, {target: powerTarget, power: name, amount: stacks})
	}
	return nextState
}

/** @param {CardPowers} powers */
function _decreasePowers(powers) {
	Object.entries(powers).forEach(([name, stacks]) => {
		if (stacks > 0) powers[name] = stacks - 1
	})
}

/** @type {ActionFn<{}>} */
function decreasePlayerPowerStacks(state) {
	return produce(state, (draft) => {
		_decreasePowers(draft.player.powers)
	})
}

/** @type {ActionFn<{}>} */
function decreaseMonsterPowerStacks(state) {
	return produce(state, (draft) => {
		getCurrRoom(draft).monsters.forEach((monster) => {
			_decreasePowers(monster.powers)
		})
	})
}

/** @type {ActionFn<{}>} */
function endTurn(state) {
	let newState = discardHand(state)
	if (state.player.powers.regen) {
		newState = produce(newState, (draft) => {
			const amount = powers.regen.use(newState.player.powers.regen)
			let newHealth
			if (newState.player.currentHealth + amount > newState.player.maxHealth) {
				newHealth = newState.player.maxHealth
			} else {
				newHealth = addHealth(newState, {target: 'player', amount}).player.currentHealth
			}
			draft.player.currentHealth = newHealth
		})
	}
	newState = playMonsterActions(newState)
	newState = decreasePlayerPowerStacks(newState)
	newState = decreaseMonsterPowerStacks(newState)
	const isDead = newState.player.currentHealth < 0
	const didWin = isDungeonCompleted(newState)
	const gameOver = isDead || didWin
	newState = produce(newState, (draft) => {
		if (didWin) draft.won = true
		if (gameOver) draft.endedAt = Date.now()
	})
	if (!gameOver) newState = newTurn(newState)
	return newState
}

/** @type {ActionFn<{}>} */
function newTurn(state) {
	const newState = drawCards(state)
	return produce(newState, (draft) => {
		draft.turn++
		draft.player.currentEnergy = 3
		draft.player.block = 0
	})
}

/** @type {ActionFn<{}>} */
function endEncounter(state) {
	const shuffled = shuffleForState(state, state.deck)
	const nextState = produce(state, (draft) => {
		draft.hand = []
		draft.discardPile = []
		draft.exhaustPile = []
		draft.drawPile = shuffled.value
		setRngCounter(draft, 'deck', shuffled.nextCounter)
	})
	return drawCards(nextState)
}

/** @type {ActionFn<{}>} Run all monster intents in current room. */
function playMonsterActions(state) {
	const room = getCurrRoom(state)
	if (!room.monsters) return state
	let nextState = state
	room.monsters.forEach((_monster, index) => {
		nextState = takeMonsterTurn(nextState, index)
	})
	return nextState
}

/** @type {ActionFn<number>} Runs one monster intent through ordinary core actions. */
function takeMonsterTurn(state, monsterIndex) {
	const room = getCurrRoom(state)
	const monster = room.monsters[monsterIndex]
	if (!monster) return state
	const rawIntent = monster.intents[monster.nextIntent || 0]
	const intent = rawIntent ? normalizeMonsterIntent(rawIntent) : null
	const wasAlive = monster.currentHealth > 0

	let nextState = produce(state, (draft) => {
		const draftMonster = getCurrRoom(draft).monsters[monsterIndex]
		draftMonster.block = 0
		if (!wasAlive || !intent) return
		draftMonster.nextIntent =
			draftMonster.nextIntent === draftMonster.intents.length - 1 ? 0 : draftMonster.nextIntent + 1
	})

	if (!wasAlive || !intent) return nextState
	for (const action of intent.actions || []) {
		nextState = executeActionDescriptor(nextState, action, {self: `enemy${monsterIndex}`})
	}
	return nextState
}

/** @type {ActionFn<{card: CARD}>} */
function addCardToDeck(state, {card}) {
	return produce(state, (draft) => {
		draft.deck.push(card)
	})
}

/** @type {ActionFn<{move: {x: number, y: number}}>} */
function move(state, {move}) {
	const nextState = endEncounter(state)
	return produce(nextState, (draft) => {
		draft.player.powers = {}
		draft.player.currentEnergy = 3
		draft.player.block = 0
		draft.dungeon.graph[move.y][move.x].didVisit = true
		draft.dungeon.pathTaken.push([move.x, move.y])
		draft.dungeon.x = move.x
		draft.dungeon.y = move.y
	})
}

/** @type {ActionFn<{target: CardTargets}>} */
function dealDamageEqualToBlock(state, {target}) {
	if (state.player.block) return removeHealth(state, {target, amount: state.player.block})
	return state
}

/** @type {ActionFn<{target: CardTargets}>} */
function dealDamageEqualToVulnerable(state, {target}) {
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((t) => {
			if (t.powers.vulnerable) t.currentHealth -= t.powers.vulnerable
		})
		return draft
	})
}

/** @type {ActionFn<{target: CardTargets}>} */
function dealDamageEqualToWeak(state, {target}) {
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((t) => {
			if (t.powers.weak) t.currentHealth -= t.powers.weak
		})
		return draft
	})
}

/** @type {ActionFn<{target: CardTargets, power: string, amount: number}>} */
function setPower(state, {target, power, amount}) {
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((model) => {
			model.powers[power] = amount
		})
	})
}

/** @type {ActionFn<{room: Room, choice: string, reward: CARD}>} */
function makeCampfireChoice(state, {choice, reward}) {
	return produce(state, (draft) => {
		const room = getCurrRoom(draft)
		room.choice = choice
		room.reward = reward
	})
}

/** @type {ActionFn<{}>} */
function iddqd(state) {
	console.log('iddqd')
	return produce(state, (draft) => {
		draft.dungeon.graph.forEach((floor) => {
			floor.forEach((node) => {
				if (!node.room?.monsters) return
				node.room.monsters.forEach((monster) => {
					monster.currentHealth = 1
				})
			})
		})
	})
}

/** @type {ActionFn<{cardNames: string[]}>} */
function setDeck(state, {cardNames}) {
	const {cards: deck, nextCounter: cardCounter} = createRunCards(state, cardNames)
	const shuffled = shuffleForState(state, deck)
	return produce(state, (draft) => {
		draft.deck = deck
		draft.drawPile = shuffled.value
		setRngCounter(draft, 'cardInstances', cardCounter)
		setRngCounter(draft, 'deck', shuffled.nextCounter)
	})
}

/** @type {ActionFn<{}>} */
function setDidCheat(state) {
	return produce(state, (draft) => {
		draft.didCheat = true
	})
}

const allActions = {
	addBlock,
	addCardToDeck,
	addCardToHand,
	addEnergyToPlayer,
	addHealth,
	addPower,
	addRegenEqualToAllDamage,
	addStarterDeck,
	applyCardPowers,
	createNewState,
	dealDamage,
	dealDamageEqualToBlock,
	dealDamageEqualToVulnerable,
	dealDamageEqualToWeak,
	discardCard,
	discardHand,
	drawCards,
	endEncounter,
	endTurn,
	iddqd,
	makeCampfireChoice,
	move,
	playCard,
	removeCard,
	removeHealth,
	removePlayerDebuffs,
	setDeck,
	setDidCheat,
	setDungeon,
	setHealth,
	setPower,
	takeMonsterTurn,
	upgradeCard,
}

export default allActions
