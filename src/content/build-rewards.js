import {createRng, deriveSeed} from '../game/rng.js'
import {getCurrentNode} from '../game/utils-state.js'
import {equipment} from './equipment.js'
import {relics} from './relics.js'

function ownedIds(state) {
	return new Set([...(state.relics || []).map((item) => item.id), ...(state.equipment || []).map((item) => item.id)])
}

/**
 * Build rewards are intentionally less frequent than card rewards. Elites always
 * offer one, while ordinary combats do so every third floor.
 */
export function isBuildRewardEligible(state) {
	const node = getCurrentNode(state.dungeon)
	if (!node || node.type === 'start') return false
	if (node.type === 'E' || node.type === 'boss') return true
	return node.type === 'M' && state.dungeon.y > 0 && state.dungeon.y % 3 === 0
}

export function getBuildRewards(state, count = 3) {
	const node = getCurrentNode(state.dungeon)
	const runSeed = state.seed ?? state.createdAt ?? 'legacy'
	const rng = createRng(deriveSeed(runSeed, 'build-reward', state.dungeon.y, state.dungeon.x, node?.type || 'room'))
	const owned = ownedIds(state)
	const relicPool = rng.shuffle(relics.filter((item) => !owned.has(item.id)))
	const equipmentPool = rng.shuffle(equipment.filter((item) => !owned.has(item.id)))
	const requestedRelics = Math.min(Math.max(1, count - 1), relicPool.length)
	const rewards = relicPool.slice(0, requestedRelics).map((item) => ({...item, kind: 'relic'}))
	if (equipmentPool.length && rewards.length < count) rewards.push({...equipmentPool[0], kind: 'equipment'})
	if (rewards.length < count) {
		const fallback = rng
			.shuffle([
				...relicPool.slice(requestedRelics).map((item) => ({...item, kind: 'relic'})),
				...equipmentPool.slice(1).map((item) => ({...item, kind: 'equipment'})),
			])
			.slice(0, count - rewards.length)
		rewards.push(...fallback)
	}
	return rewards.slice(0, count)
}
