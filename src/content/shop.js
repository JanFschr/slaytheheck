import {createCard, getCardRewards} from '../game/cards.js'
import {createRng, deriveSeed, deterministicId} from '../game/rng.js'
import {equipment} from './equipment.js'
import {relics} from './relics.js'

function cardPrice(card) {
	if (card.rarity === 'rare') return 90
	if (card.rarity === 'uncommon') return 65
	return 45
}

export function getShopInventory(state) {
	const runSeed = state.seed ?? state.createdAt ?? 'legacy'
	const roomKey = `${state.dungeon.y}:${state.dungeon.x}`
	const rng = createRng(deriveSeed(runSeed, 'shop', roomKey))

	const cardOffers = getCardRewards(3, rng.next).map((card, index) => ({
		id: deterministicId('shop-card', runSeed, roomKey, index, card.definitionId),
		kind: 'card',
		definitionId: card.definitionId,
		name: card.name,
		description: card.description,
		rarity: card.rarity,
		price: cardPrice(card),
	}))

	// Do not filter by current ownership here. Shop stock must remain identical
	// before and after a purchase; the UI/action layer marks owned items instead.
	const availableRelics = rng.shuffle(relics)
	const availableEquipment = rng.shuffle(equipment)
	const offers = [...cardOffers]

	if (availableRelics[0]) {
		offers.push({
			...availableRelics[0],
			kind: 'relic',
			price: availableRelics[0].rarity === 'rare' ? 135 : 105,
		})
	}
	if (availableEquipment[0]) {
		offers.push({
			...availableEquipment[0],
			kind: 'equipment',
			price: availableEquipment[0].rarity === 'rare' ? 145 : 115,
		})
	}

	return offers
}

export function isShopOfferOwned(state, offer) {
	if (offer.kind === 'relic') return (state.relics || []).some((item) => item.id === offer.id)
	if (offer.kind === 'equipment') return (state.equipment || []).some((item) => item.id === offer.id)
	return false
}

export function createShopCard(offer) {
	if (offer.kind !== 'card') throw new Error('Shop offer is not a card')
	return createCard(offer.definitionId, false, {instanceId: offer.id})
}
