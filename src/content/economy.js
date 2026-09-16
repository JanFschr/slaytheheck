import {createRng, deriveSeed} from '../game/rng.js'
import {getCurrentNode} from '../game/utils-state.js'

export const economy = {
	startingGold: 50,
	cardRemovePrice: 75,
	cardUpgradePrice: 60,
}

export function getCombatGoldReward(state) {
	const node = getCurrentNode(state.dungeon)
	const runSeed = state.seed ?? state.createdAt ?? 'legacy'
	const rng = createRng(deriveSeed(runSeed, 'combat-gold', state.dungeon.y, state.dungeon.x, node?.type || 'M'))
	if (node?.type === 'boss') return 100 + rng.int(0, 25)
	if (node?.type === 'E') return 45 + rng.int(0, 20)
	return 20 + rng.int(0, 15)
}

export function getTreasureGoldReward(state) {
	const runSeed = state.seed ?? state.createdAt ?? 'legacy'
	const rng = createRng(deriveSeed(runSeed, 'treasure-gold', state.dungeon.y, state.dungeon.x))
	return 45 + rng.int(0, 30)
}
