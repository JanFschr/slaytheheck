/**
 * Built-in decks use stable card definition ids. Custom/legacy decks may still
 * contain display names because createCard accepts both formats.
 * @typedef {Object} Deck
 * @property {string} id
 * @property {string} name
 * @property {string[]} cards
 * @property {boolean} [custom] - whether this is a custom (user) deck
 */

/** @type {Deck} */
export const deck1 = {
	id: 'classic',
	name: 'Classic',
	cards: [
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
	],
}

/** @type {Deck} */
export const deck2 = {
	id: 'one-of-each',
	name: 'One of each',
	cards: [
		'core:adrenaline',
		'core:bash',
		'core:bludgeon',
		'core:body-slam',
		'core:clash',
		'core:cleave',
		'core:defend',
		'core:flourish',
		'core:intimidate',
		'core:iron-wave',
		'core:mask-of-the-faceless',
		'core:pommel-strike',
		'core:ritual-rain',
		'core:soul-drain',
		'core:strike',
		'core:succube',
		'core:sucker-punch',
		'core:summer-of-sam',
		'core:terror',
		'core:thunderclap',
		'core:voodoo-gift',
	],
}
