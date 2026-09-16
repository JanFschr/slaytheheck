import {produce} from 'immer'
import {createDefaultDungeon} from '../content/dungeons.js'
import {clamp} from '../utils.js'
import {executeActionLifecycle} from './action-runtime.js'
import {CardTargets, createCard} from './cards.js'
import {conditionsAreValid} from './conditions.js'
import {Monster, normalizeMonsterIntent} from './monster.js'
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
 * @prop {Array} [relics]
 * @prop {Array} [equipment]
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

function createRunCard(state, identifier, upgraded = false) {
	const index = getRngCounter(state, 'cardInstances')
	const seed = getStateSeed(state)
	return {
		card: createCard(identifier, upgraded, {
			instanceId: deterministicId('card', seed, 'instance', index, identifier),
		}),
		nextCounter: index + 1,
	}
}

function resolveSelf(value, selfTarget) {
	return value === 'self' ? selfTarget : value
}

/** Execute one declarative action descriptor through the shared lifecycle runtime. */
function executeActionDescriptor(state, action, context = {}) {
	const parameter = {...(action.parameter || {}), ...(context.extra || {})}
	if (parameter.target) parameter.target = resolveSelf(parameter.target, context.self)
	if (parameter.source) parameter.source = resolveSelf(parameter.source, context.self)
	if (!parameter.source && context.source) parameter.source = context.source
	if (!parameter.source && context.self) parameter.source = context.self
	return executeActionLifecycle(state, {...action, parameter}, allActions, {
		origin: context.origin || 'descriptor',
	})
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

/** Declarative alias for drawCards. */
function draw(state, {amount = 1} = {}) {
	return drawCards(state, {amount})
}

/** @type {ActionFn<{card: CARD}>} */
function addCardToHand(state, {card}) {
	return produce(state, (draft) => {
		draft.hand.push(card)
	})
}

function cardPileKey(pile = 'discard') {
	const aliases = {
		deck: 'deck',
		draw: 'drawPile',
		drawPile: 'drawPile',
		hand: 'hand',
		discard: 'discardPile',
		discardPile: 'discardPile',
		exhaust: 'exhaustPile',
		exhaustPile: 'exhaustPile',
	}
	const key = aliases[pile]
	if (!key) throw new Error(`Unknown card pile: ${pile}`)
	return key
}

/**
 * Add a deterministic card instance to any combat/deck pile.
 * @type {ActionFn<{card?: CARD, definitionId?: string, name?: string, pile?: string, upgraded?: boolean}>}
 */
function addCard(state, {card, definitionId, name, pile = 'discard', upgraded = false} = {}) {
	const pileKey = cardPileKey(pile)
	let nextCard = card
	let nextCounter = null
	if (!nextCard?.id) {
		const identifier = definitionId || nextCard?.definitionId || name || nextCard?.name
		if (!identifier) throw new Error('addCard requires a card, definitionId or name')
		const created = createRunCard(state, identifier, upgraded)
		nextCard = created.card
		nextCounter = created.nextCounter
	}

	return produce(state, (draft) => {
		draft[pileKey].push(nextCard)
		if (nextCounter !== null) setRngCounter(draft, 'cardInstances', nextCounter)
	})
}

/**
 * Exhaust one known card from combat piles or the first N cards from a chosen pile.
 * @type {ActionFn<{card?: CARD, cardId?: string, amount?: number, from?: string}>}
 */
function exhaust(state, {card, cardId, amount = 1, from} = {}) {
	const id = cardId || card?.id
	const explicitPile = from ? cardPileKey(from) : null
	const searchPiles = explicitPile ? [explicitPile] : ['hand', 'drawPile', 'discardPile']

	return produce(state, (draft) => {
		if (id) {
			for (const pileKey of searchPiles) {
				const index = draft[pileKey].findIndex((candidate) => candidate.id === id)
				if (index === -1) continue
				const [exhausted] = draft[pileKey].splice(index, 1)
				draft.exhaustPile.push(exhausted)
				return
			}
			return
		}

		const pileKey = explicitPile || 'hand'
		for (let i = 0; i < amount && draft[pileKey].length; i++) {
			const exhausted = draft[pileKey].shift()
			draft.exhaustPile.push(exhausted)
		}
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
	})
	if (card.block) {
		newState = executeActionDescriptor(
			newState,
			{type: 'addBlock', parameter: {source: 'player', target: 'player', amount: card.block}},
			{source: 'player', extra: {card}, origin: 'card'},
		)
	}
	if (card.type === 'attack' || card.damage) {
		const newTarget = card.target === CardTargets.allEnemies ? card.target : target
		newState = executeActionDescriptor(
			newState,
			{type: 'dealDamage', parameter: {source: 'player', target: newTarget, amount: card.damage}},
			{source: 'player', extra: {card}, origin: 'card'},
		)
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
		nextState = executeActionDescriptor(
			nextState,
			{...action, parameter},
			{
				source: 'player',
				extra: {card},
				origin: 'card',
			},
		)
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

/** Declarative healing action. */
function heal(state, {target = 'player', amount = 0} = {}) {
	return addHealth(state, {target, amount})
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

/** Declarative energy action. */
function gainEnergy(state, {amount = 1} = {}) {
	return addEnergyToPlayer(state, {amount})
}

function enemyIndicesForTarget(state, target) {
	const room = getCurrRoom(state)
	if (target === CardTargets.allEnemies) return room.monsters.map((_monster, index) => index)
	if (typeof target === 'string' && target.startsWith(CardTargets.enemy)) {
		const index = Number(target.slice(CardTargets.enemy.length))
		return Number.isInteger(index) && room.monsters[index] ? [index] : []
	}
	return []
}

function phaseIndexFor(monster, phase) {
	if (!monster.phases?.length) return -1
	if (typeof phase === 'number') return phase
	return monster.phases.findIndex((candidate) => candidate.id === phase)
}

/**
 * Switch a phased monster to a new phase, optionally replacing intents and
 * executing phase entry actions through the same lifecycle runtime.
 */
function changeBossPhase(state, {target, phase}) {
	const transitions = enemyIndicesForTarget(state, target)
		.map((index) => {
			const monster = getCurrRoom(state).monsters[index]
			const nextPhaseIndex = phaseIndexFor(monster, phase)
			const definition = monster.phases?.[nextPhaseIndex]
			return definition ? {index, nextPhaseIndex, definition} : null
		})
		.filter(Boolean)
	if (!transitions.length) return state

	let nextState = produce(state, (draft) => {
		for (const transition of transitions) {
			const monster = getCurrRoom(draft).monsters[transition.index]
			monster.phase = transition.nextPhaseIndex
			monster.phaseId = transition.definition.id
			if (Array.isArray(transition.definition.intents)) {
				monster.intents = transition.definition.intents.map((intent) => normalizeMonsterIntent(intent))
				monster.nextIntent = transition.definition.nextIntent ?? 0
			}
		}
	})

	for (const transition of transitions) {
		for (const action of transition.definition.onEnter || []) {
			if (action.conditions && !conditionsAreValid(nextState, action.conditions)) continue
			nextState = executeActionDescriptor(nextState, action, {
				self: `enemy${transition.index}`,
				source: `enemy${transition.index}`,
				origin: 'bossPhase',
			})
		}
	}
	return nextState
}

function phaseThresholdMet(monster, phase) {
	if (monster.currentHealth <= 0) return false
	if (typeof phase.atHealth === 'number') return monster.currentHealth <= phase.atHealth
	if (typeof phase.atHealthRatio === 'number') {
		return monster.currentHealth / monster.maxHealth <= phase.atHealthRatio
	}
	return false
}

function advanceBossPhases(state, target) {
	let nextState = state
	for (const index of enemyIndicesForTarget(state, target)) {
		while (true) {
			const monster = getCurrRoom(nextState).monsters[index]
			const currentPhase = monster.phase ?? 0
			const nextPhase = monster.phases?.[currentPhase + 1]
			if (!nextPhase || !phaseThresholdMet(monster, nextPhase)) break
			nextState = executeActionDescriptor(
				nextState,
				{
					type: 'changeBossPhase',
					parameter: {source: `enemy${index}`, target: `enemy${index}`, phase: currentPhase + 1},
				},
				{self: `enemy${index}`, source: `enemy${index}`, origin: 'bossPhase'},
			)
		}
	}
	return nextState
}

/** @type {ActionFn<{target: string, amount: number}>} */
const removeHealth = (state, {target, amount = 0}) => {
	const damagedState = produce(state, (draft) => {
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
	return advanceBossPhases(damagedState, target)
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
		nextState = executeActionDescriptor(
			nextState,
			{type: 'addPower', parameter: {source: 'player', target: powerTarget, power: name, amount: stacks}},
			{source: 'player', extra: {card}, origin: 'card'},
		)
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
		const amount = powers.regen.use(newState.player.powers.regen)
		newState = executeActionDescriptor(
			newState,
			{type: 'heal', parameter: {source: 'player', target: 'player', amount}},
			{source: 'player', origin: 'regen'},
		)
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
		nextState = executeActionDescriptor(nextState, action, {
			self: `enemy${monsterIndex}`,
			source: `enemy${monsterIndex}`,
			origin: 'enemyIntent',
		})
	}
	return nextState
}

/**
 * Change a monster's next intent directly or relatively, wrapping around its intent list.
 * @type {ActionFn<{target: string, index?: number, delta?: number}>}
 */
function changeIntent(state, {target, index, delta = 1}) {
	return produce(state, (draft) => {
		getRoomTargets(draft, target).forEach((monster) => {
			const length = monster.intents?.length || 0
			if (!length) return
			const requested = index ?? (monster.nextIntent || 0) + delta
			monster.nextIntent = ((requested % length) + length) % length
		})
	})
}

/**
 * Summon one or more monsters using an isolated serializable RNG stream.
 * A spec may use `hpRange: [min, max]` and ordinary Monster props.
 * @type {ActionFn<{monster?: object, monsters?: object[]}>}
 */
function summon(state, {monster, monsters: monsterSpecs} = {}) {
	const specs = monsterSpecs || (monster ? [monster] : [])
	if (!specs.length) return state
	const firstCounter = getRngCounter(state, 'summon')
	const seed = getStateSeed(state)
	const summoned = specs.map((spec, offset) => {
		const rng = createRng(deriveSeed(seed, 'summon', firstCounter + offset))
		const hp = Array.isArray(spec.hpRange) ? rng.int(spec.hpRange[0], spec.hpRange[1]) : spec.hp
		return Monster({...spec, ...(hp === undefined ? {} : {hp})}, {rng})
	})

	return produce(state, (draft) => {
		getCurrRoom(draft).monsters.push(...summoned)
		setRngCounter(draft, 'summon', firstCounter + specs.length)
	})
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
	addCard,
	addCardToDeck,
	addCardToHand,
	addEnergyToPlayer,
	addHealth,
	addPower,
	addRegenEqualToAllDamage,
	addStarterDeck,
	applyCardPowers,
	changeBossPhase,
	changeIntent,
	changePhase: changeBossPhase,
	createNewState,
	dealDamage,
	dealDamageEqualToBlock,
	dealDamageEqualToVulnerable,
	dealDamageEqualToWeak,
	discardCard,
	discardHand,
	draw,
	drawCards,
	endEncounter,
	endTurn,
	exhaust,
	gainEnergy,
	heal,
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
	summon,
	takeMonsterTurn,
	upgradeCard,
}

export default allActions
