/**
 * The type of a power
 * @typedef POWER
 * @prop {string} id - stable rules id, independent from display name
 * @prop {string} name
 * @prop {string} description
 * @prop {string} type
 * @prop {string=} target
 * @prop {Function=} use
 * @prop {string[]} [keywords]
 */

// Class representing a power.
export class Power {
	/**
	 * @param {POWER} power - The base power to create a class from
	 */
	constructor(power) {
		const {id, name, description, type, target, use, keywords = []} = power
		this.id = id
		this.name = name
		this.description = description
		this.type = type
		this.target = target
		this.use = use
		this.keywords = [...keywords]
	}
}

export const regen = new Power({
	id: 'regen',
	type: 'buff',
	name: 'Regen',
	description: 'Heals an amount of health points equal to Regen stacks',
	target: 'player',
	use: (stacks) => stacks,
	keywords: ['healing'],
})

export const poison = new Power({
	id: 'poison',
	type: 'debuff',
	name: 'Poison',
	description: 'Hurts equal to poison stacks (todo: make poison reduce at start of turn, not end)',
	use: (stacks) => stacks,
	keywords: ['damage-over-time'],
})

export const vulnerable = new Power({
	id: 'vulnerable',
	type: 'debuff',
	name: 'Vulnerable',
	description: 'Takes 50% more damage while Vulnerable',
	use: (dmg) => Math.floor(dmg * 1.5),
	keywords: ['damage-taken'],
})

export const weak = new Power({
	id: 'weak',
	type: 'debuff',
	name: 'Weak',
	description: 'Weakened targets deal 25% less damage',
	use: (dmg) => Math.floor(dmg * 0.75),
	keywords: ['damage-dealt'],
})

export const strength = new Power({
	id: 'strength',
	type: 'buff',
	name: 'Strength',
	description: 'Strengthened targets deal +x damage',
	use: (stacks) => stacks,
	keywords: ['damage-dealt'],
})

export const powerRegistry = {
	regen,
	poison,
	vulnerable,
	weak,
	strength,
}

/** @param {string} id */
export function getPower(id) {
	return powerRegistry[id]
}

export default powerRegistry
