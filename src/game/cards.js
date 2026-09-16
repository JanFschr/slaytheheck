import {cards, cardUpgrades} from '../content/cards.js'
import {uuid} from '../utils.js'

// This file contains the logic to create cards.
// While cards are described in plain object form, they are always converted to a class equivalent.
// The actual cards belong in content/cards.js.

/** @enum {string} */
export const CardTypes = {
	attack: 'attack',
	skill: 'skill',
	power: 'power',
	status: 'status',
	curse: 'curse',
}

/** @enum {string} */
export const CardRarities = {
	basic: 'basic',
	special: 'special',
	common: 'common',
	uncommon: 'uncommon',
	rare: 'rare',
	curse: 'curse',
}

/** @enum {string} - must be either "player", "enemyx" (where x is the index) or "allEnemies" */
export const CardTargets = {
	player: 'player',
	enemy: 'enemy',
	allEnemies: 'allEnemies',
}

/**
 * @typedef {object} CardPowers
 * @prop {number=} regen
 * @prop {number=} vulnerable
 * @prop {number=} weak
 */

/**
 * @typedef {object} CardAction - allows the card to run all defined actions
 * @prop {string} type - name of the action to call. See game/actions.js
 * @prop {object} [parameter] - props to pass to the action
 * @prop {Array<{type: string}>} [conditions] - list of conditions
 */

/**
 * All cards extend this class.
 * `id` identifies one card instance in a run; `definitionId` identifies the
 * stable content definition and must not change when display names are reskinned.
 * @typedef CARD
 * @prop {string=} id
 * @prop {string} definitionId
 * @prop {string} name
 * @prop {string} description
 * @prop {string} image
 * @prop {number} energy
 * @prop {CardTypes} type - specifies the type of card
 * @prop {CardRarities} rarity
 * @prop {string[]} tags - build/archetype tags, e.g. "tech" or "poison"
 * @prop {string[]} keywords - rules keywords rendered/explained by the UI
 * @prop {number} [damage] - damages the target.
 * @prop {number} [block] - applies block to the target.
 * @prop {CardTargets} target - a special "target" string to specify which targets the card affects.
 * @prop {boolean=} exhaust - whether the card will exhaust when played.
 * @prop {boolean=} upgraded
 * @prop {CardPowers} [powers] - Cards can apply POWERS with the `powers` object.
 * @prop {Array<CardAction>} [actions] - Cards can _optionally_ define a list of `actions`.
 * @prop {Array<{type: string}>} [conditions] - Conditions that have to pass for the card to be playable.
 */

export class Card {
	/** @param {CARD} props */
	constructor(props) {
		this.id = uuid()
		this.definitionId = props.definitionId
		this.name = props.name
		this.type = CardTypes[props.type]
		this.rarity = CardRarities[props.rarity] || CardRarities.common
		this.tags = [...(props.tags || [])]
		this.keywords = [...(props.keywords || [])]
		this.energy = props.energy
		this.target = CardTargets[props.target]
		this.damage = props.damage || 0
		this.block = props.block || 0
		this.powers = props.powers
		this.description = props.description
		this.conditions = props.conditions
		this.actions = props.actions
		this.image = props.image
		this.upgraded = props.upgraded || false
		this.exhaust = props.exhaust || false
	}
}

/** @param {object} card */
function cloneDefinition(card) {
	if (typeof structuredClone === 'function') return structuredClone(card)
	return JSON.parse(JSON.stringify(card))
}

/**
 * Resolve a stable definition id or the legacy display name to a card definition.
 * @param {string} identifier
 * @returns {CARD|undefined}
 */
export function getCardDefinition(identifier) {
	return cards.find((card) => card.definitionId === identifier || card.name === identifier)
}

/**
 * Creates a new card. Turns a plain object card into a class-based one.
 * Both stable definition ids (`core:strike`) and legacy display names (`Strike`) are accepted.
 * @param {string} identifier - stable definition id or exact display name
 * @param {boolean} [shouldUpgrade] - whether to upgrade the card
 * @returns {CARD} a new card
 */
export function createCard(identifier, shouldUpgrade) {
	if (identifier.includes('+')) {
		const baseIdentifier = upgradeNameMap[identifier] || identifier.replace('+', '')
		return createCard(baseIdentifier, true)
	}

	const definition = getCardDefinition(identifier)
	if (!definition) throw new Error(`Card not found: ${identifier}`)

	let card = cloneDefinition(definition)
	if (shouldUpgrade) {
		const upgradeFn = cardUpgrades[card.definitionId] || cardUpgrades[card.name]
		if (!upgradeFn) throw new Error(`Card has no upgrade function: ${card.definitionId}`)
		card = upgradeFn(card)
		card.upgraded = true
		if (!card.name.includes('+')) card.name += '+'
	}
	return new Card(card)
}

const upgradeNameMap = {}

// Build the map automatically from cards and their upgrade functions.
cards.forEach((card) => {
	const upgradeFn = cardUpgrades[card.definitionId] || cardUpgrades[card.name]
	if (upgradeFn) {
		const upgradedCard = upgradeFn(cloneDefinition(card))
		if (upgradedCard.name !== `${card.name}+`) {
			upgradeNameMap[upgradedCard.name] = card.definitionId
		}
	}
})

/**
 * Returns X random cards from a list of card definitions.
 * Injecting a random function makes rewards deterministic without coupling this
 * module to one global RNG implementation.
 * @param {Array<CARD>} list - collection of POJO cards
 * @param {number} amount - how many
 * @param {() => number} [random]
 * @returns {Array<CARD>} results
 */
export function getRandomCards(list, amount, random = Math.random) {
	const results = []
	for (let i = 0; i < amount; i++) {
		const randomIndex = Math.floor(random() * list.length)
		const definition = list[randomIndex]
		results.push(createCard(definition.definitionId))
	}
	return results
}

/**
 * Returns X random, nicer and unique cards.
 * @param {number} [amount]
 * @param {() => number} [random]
 * @returns {Array<CARD>} a list of cards
 */
export function getCardRewards(amount = 3, random = Math.random) {
	const excluded = new Set(['core:strike', 'core:defend'])
	const niceCards = cards.filter((card) => !excluded.has(card.definitionId))
	const rewards = []
	while (rewards.length < amount) {
		const card = getRandomCards(niceCards, 1, random)[0]
		const isDuplicate = rewards.some((reward) => reward.definitionId === card.definitionId)
		if (!isDuplicate) rewards.push(card)
	}
	return rewards
}
