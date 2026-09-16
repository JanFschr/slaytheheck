// List of filenames from /src/content/cards/*.js
const cardIndex = [
	'adrenaline',
	'bash',
	'bludgeon',
	'body-slam',
	'clash',
	'cleave',
	'defend',
	'flourish',
	'intimidate',
	'iron-wave',
	'mask-of-the-faceless',
	'pommel-strike',
	'ritual-rain',
	'soul-drain',
	'strike',
	'succube',
	'sucker-punch',
	'summer-of-sam',
	'terror',
	'thunderclap',
	'voodoo-gift',
]

/**
 * A collection of all existing cards in this game.
 * Every definition gets a stable, setting-independent id based on its content file.
 * @type {import('../game/cards.js').CARD[]}
 */
export const cards = []

/** A map of stable definition ids and legacy display names to upgrade functions. */
export const cardUpgrades = {}

// Fill out the cards and upgrades maps.
for (const fileName of cardIndex) {
	const module = await import(`./cards/${fileName}.js`)
	const definitionId = module.default.definitionId || `core:${fileName}`
	const definition = {
		rarity: 'common',
		tags: [],
		keywords: [],
		...module.default,
		definitionId,
	}
	cards.push(definition)
	cardUpgrades[definitionId] = module.upgrade
	// Backward compatibility for old saves, deck definitions and console commands.
	cardUpgrades[definition.name] = module.upgrade
}
