/** @typedef {import('./monster.js').MONSTER} MONSTER */

/**
 * @typedef {object} Room - a room in the dungeon
 * @prop {RoomTypes} type - the type of room
 * @prop {Array<MONSTER>} [monsters] - for monster rooms
 * @prop {object} [reward] - the reward given to the player, if any
 * @prop {string} [choice] - for campfire/event rooms, the choice made by the player
 */

/** @enum {string} different type of rooms */
export const RoomTypes = {
	start: 'start',
	campfire: 'campfire',
	monster: 'monster',
	elite: 'elite',
	boss: 'boss',
	event: 'event',
	merchant: 'merchant',
	treasure: 'treasure',
}

/**
 * This is usually where you start. The first node on the map.
 * @returns {Room} the starting room
 */
export function StartRoom() {
	return {
		type: RoomTypes.start,
	}
}

/**
 * A campfire gives our hero the opportunity to rest, remove or upgrade a card.
 * @typedef {{type: RoomTypes, choice?: string}} CampfireRoom
 * @returns {CampfireRoom}
 */
export function CampfireRoom() {
	return {
		type: RoomTypes.campfire,
		// choices: ['rest', 'remove', 'upgrade'],
	}
}

/**
 * @param {...MONSTER} monsters - pass it one or more monsters (as multiple arguments, not an array)
 * @returns {Room}
 */
export function MonsterRoom(...monsters) {
	return {
		type: RoomTypes.monster,
		monsters,
	}
}

export function EventRoom(eventId) {
	return {
		type: RoomTypes.event,
		eventId,
	}
}

export function MerchantRoom() {
	return {
		type: RoomTypes.merchant,
		purchasedOffers: [],
		usedServices: [],
		closed: false,
	}
}

export function TreasureRoom() {
	return {
		type: RoomTypes.treasure,
		claimed: false,
	}
}
