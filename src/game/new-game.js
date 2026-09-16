import {economy} from '../content/economy.js'
import {
	createMechanicsMvpDungeon,
	mechanicsMvpId,
	mechanicsMvpModifiers,
	mechanicsMvpStarterDeck,
} from '../content/mechanics-mvp.js'
import ActionManager from './action-manager.js'
import actions from './actions.js'
import {createRunSeed} from './rng.js'

/** @typedef {import('./actions.js').State} State */

/**
 * @typedef {object} Game
 * @prop {State} state
 * @prop {string} seed
 * @prop {object} actions
 * @prop {Function} enqueue - stores an action in the "future"
 * @prop {Function} dequeue - runs the oldest "future" action, and stores result in the "past"
 * @prop {Function} undo - undoes the last "past" action
 * @prop {{list: Array<{type: string}>}} future
 * @prop {{list: Array<{action: string, state: State}>}} past
 */

function browserContentConfig() {
	if (typeof globalThis === 'undefined') return {}
	return globalThis.__SLAY_CONTENT_PACK__ || {}
}

/**
 * Creates a new game.
 * @param {boolean} debug - whether to log actions to the console
 * @param {{seed?: string|number, contentPack?: string}} [options]
 * @returns {Game}
 */
export default function createNewGame(debug = false, options = {}) {
	const actionManager = ActionManager({debug})
	const browserConfig = browserContentConfig()
	const contentPack = options.contentPack ?? browserConfig.id
	const seed = String(options.seed ?? browserConfig.seed ?? createRunSeed())

	/**
	 * @returns {State} with a dungeon, start deck and cards drawn
	 */
	function createNewState() {
		let state = actions.createNewState()
		// Store the seed as ordinary serializable state. Subsystems can derive their
		// own deterministic RNG stream from it without sharing mutable global RNG.
		state.seed = seed
		state.contentPack = contentPack
		state.gold = contentPack === mechanicsMvpId ? 100 : economy.startingGold
		state.relics = []
		state.equipment = []
		state.resources = {heat: 0, drones: 0, corruption: 0}
		state.modifiers = []

		if (contentPack === mechanicsMvpId) {
			state.modifiers = structuredClone(mechanicsMvpModifiers)
			state = actions.setDungeon(state, createMechanicsMvpDungeon({seed}))
			state = actions.setDeck(state, {cardNames: mechanicsMvpStarterDeck})
		} else {
			state = actions.setDungeon(state)
			state = actions.addStarterDeck(state)
		}
		state = actions.drawCards(state)
		return state
	}

	return {
		state: createNewState(),
		seed,
		actions,
		enqueue(action) {
			if (this.state.pendingChoice) {
				if (action.type !== 'resolveChoice') {
					if (debug) console.warn('game: action blocked while choice is pending', action)
					return false
				}
				// A choice response must run before any already queued top-level actions;
				// otherwise the next dequeue would only capture that older action as a
				// continuation and require an unnecessary second confirmation.
				actionManager.future.list.unshift({action})
				actionManager.redoStack.list = []
				return true
			}
			actionManager.enqueue(action)
			return true
		},
		dequeue() {
			try {
				const nextState = actionManager.dequeue(this.state)
				if (nextState) this.state = nextState
			} catch (err) {
				console.warn(err)
			}
		},
		undo() {
			const prevGame = actionManager.undo()
			if (prevGame) this.state = prevGame.state
			return prevGame
		},
		future: actionManager.future,
		past: actionManager.past,
	}
}
