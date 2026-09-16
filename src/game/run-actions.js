import {produce} from 'immer'
import {getBuildRewards} from '../content/build-rewards.js'
import {economy, getCombatGoldReward, getTreasureGoldReward} from '../content/economy.js'
import {getEquipmentById} from '../content/equipment.js'
import {getRelicById} from '../content/relics.js'
import {createShopCard, getShopInventory, isShopOfferOwned} from '../content/shop.js'
import actions from './actions.js'
import {getCurrRoom, isRoomCompleted} from './utils-state.js'

function cloneDefinition(value) {
	if (typeof structuredClone === 'function') return structuredClone(value)
	return JSON.parse(JSON.stringify(value))
}

function addRelic(state, {id}) {
	const definition = getRelicById(id)
	if ((state.relics || []).some((item) => item.id === id)) return state
	return produce(state, (draft) => {
		if (!draft.relics) draft.relics = []
		draft.relics.push(cloneDefinition(definition))
	})
}

function equipItem(state, {id}) {
	const definition = getEquipmentById(id)
	return produce(state, (draft) => {
		if (!draft.equipment) draft.equipment = []
		draft.equipment = draft.equipment.filter((item) => item.slot !== definition.slot)
		draft.equipment.push(cloneDefinition(definition))
	})
}

function claimBuildReward(state, {kind, id}) {
	const room = getCurrRoom(state)
	if (room.buildRewardClaimed) return state
	const nextState = kind === 'equipment' ? equipItem(state, {id}) : addRelic(state, {id})
	return produce(nextState, (draft) => {
		getCurrRoom(draft).buildRewardClaimed = id
	})
}

function addGold(state, {amount = 0} = {}) {
	return produce(state, (draft) => {
		draft.gold = Math.max(0, (draft.gold || 0) + amount)
	})
}

function spendGold(state, {amount = 0} = {}) {
	const gold = state.gold || 0
	if (amount < 0) throw new Error('Gold cost cannot be negative')
	if (gold < amount) throw new Error(`Not enough gold: need ${amount}, have ${gold}`)
	return produce(state, (draft) => {
		draft.gold = gold - amount
	})
}

function losePlayerHealth(state, {amount = 0} = {}) {
	return produce(state, (draft) => {
		draft.player.currentHealth = Math.max(0, draft.player.currentHealth - Math.max(0, amount))
		if (draft.player.currentHealth < 1) draft.endedAt = Date.now()
	})
}

function findCardById(state, cardId) {
	for (const pile of ['deck', 'hand', 'drawPile', 'discardPile', 'exhaustPile']) {
		const card = state[pile]?.find((candidate) => candidate.id === cardId)
		if (card) return card
	}
	return null
}

function removeCardById(state, {cardId}) {
	if (!cardId) return state
	return produce(state, (draft) => {
		for (const pile of ['deck', 'hand', 'drawPile', 'discardPile', 'exhaustPile']) {
			draft[pile] = draft[pile].filter((card) => card.id !== cardId)
		}
	})
}

function upgradeCardById(state, {cardId}) {
	const card = findCardById(state, cardId)
	if (!card || card.upgraded) return state
	return actions.upgradeCard(state, {card})
}

function completeEvent(state, {choice}) {
	return produce(state, (draft) => {
		const room = getCurrRoom(draft)
		if (room.type !== 'event') throw new Error('Current room is not an event')
		room.choice = choice || 'completed'
	})
}

function claimCardReward(state, {card}) {
	const room = getCurrRoom(state)
	if (room.type !== 'monster' || !isRoomCompleted(room)) throw new Error('Card rewards require a completed combat')
	if (room.cardRewardClaimed || !card) return state
	const nextState = actions.addCardToDeck(state, {card})
	return produce(nextState, (draft) => {
		getCurrRoom(draft).cardRewardClaimed = card.id || card.definitionId || card.name
	})
}

function claimCombatGold(state) {
	const room = getCurrRoom(state)
	if (room.type !== 'monster') throw new Error('Combat gold can only be claimed after combat')
	if (!isRoomCompleted(room)) throw new Error('Combat gold requires a completed combat')
	if (room.goldRewardClaimed) return state
	const amount = getCombatGoldReward(state)
	return produce(addGold(state, {amount}), (draft) => {
		getCurrRoom(draft).goldRewardClaimed = amount
	})
}

function buyShopOffer(state, {offerId}) {
	const room = getCurrRoom(state)
	if (room.type !== 'merchant') throw new Error('Current room is not a merchant')
	if (room.closed) throw new Error('Merchant is closed')
	if ((room.purchasedOffers || []).includes(offerId)) return state
	const offer = getShopInventory(state).find((candidate) => candidate.id === offerId)
	if (!offer) throw new Error(`Unknown shop offer: ${offerId}`)
	if (isShopOfferOwned(state, offer)) return state

	let nextState = spendGold(state, {amount: offer.price})
	if (offer.kind === 'card') nextState = actions.addCardToDeck(nextState, {card: createShopCard(offer)})
	if (offer.kind === 'relic') nextState = addRelic(nextState, {id: offer.id})
	if (offer.kind === 'equipment') nextState = equipItem(nextState, {id: offer.id})

	return produce(nextState, (draft) => {
		const currentRoom = getCurrRoom(draft)
		if (!currentRoom.purchasedOffers) currentRoom.purchasedOffers = []
		currentRoom.purchasedOffers.push(offerId)
	})
}

function markShopService(state, {service}) {
	return produce(state, (draft) => {
		const room = getCurrRoom(draft)
		if (room.type !== 'merchant') throw new Error('Current room is not a merchant')
		if (!room.usedServices) room.usedServices = []
		if (!room.usedServices.includes(service)) room.usedServices.push(service)
	})
}

function applyShopCardService(state, {service, cardId}) {
	const room = getCurrRoom(state)
	if (room.type !== 'merchant') throw new Error('Current room is not a merchant')
	if (room.closed) throw new Error('Merchant is closed')
	if ((room.usedServices || []).includes(service)) return state

	const card = findCardById(state, cardId)
	if (!card) throw new Error(`Unknown card for merchant service: ${cardId}`)

	let price
	let nextState
	if (service === 'remove') {
		price = economy.cardRemovePrice
		nextState = spendGold(state, {amount: price})
		nextState = removeCardById(nextState, {cardId})
	} else if (service === 'upgrade') {
		if (card.upgraded) throw new Error('Card is already upgraded')
		price = economy.cardUpgradePrice
		nextState = spendGold(state, {amount: price})
		nextState = upgradeCardById(nextState, {cardId})
	} else {
		throw new Error(`Unknown merchant service: ${service}`)
	}

	return markShopService(nextState, {service})
}

function closeMerchant(state) {
	return produce(state, (draft) => {
		const room = getCurrRoom(draft)
		if (room.type !== 'merchant') throw new Error('Current room is not a merchant')
		room.closed = true
	})
}

function claimTreasure(state) {
	const room = getCurrRoom(state)
	if (room.type !== 'treasure') throw new Error('Current room is not treasure')
	if (room.claimed) return state

	const gold = getTreasureGoldReward(state)
	const reward = getBuildRewards(state, 1)[0]
	let nextState = addGold(state, {amount: gold})
	if (reward?.kind === 'equipment') nextState = equipItem(nextState, {id: reward.id})
	if (reward?.kind === 'relic') nextState = addRelic(nextState, {id: reward.id})

	return produce(nextState, (draft) => {
		const currentRoom = getCurrRoom(draft)
		currentRoom.claimed = true
		currentRoom.goldReward = gold
		currentRoom.buildReward = reward?.id
	})
}

export const runActions = {
	addGold,
	addRelic,
	applyShopCardService,
	buyShopOffer,
	claimBuildReward,
	claimCardReward,
	claimCombatGold,
	claimTreasure,
	closeMerchant,
	completeEvent,
	equipItem,
	losePlayerHealth,
	markShopService,
	removeCardById,
	spendGold,
	upgradeCardById,
}

export default runActions
