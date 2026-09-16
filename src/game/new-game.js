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

/**
 * Creates a new game.
 * @param {boolean} debug - whether to log actions to the console
 * @param {{seed?: string|number}} [options]
 * @returns {Game}
 */
export default function createNewGame(debug = false, options = {}) {
	const actionManager = ActionManager({debug})
	const seed = String(options.seed ?? createRunSeed())

	/**
	 * @returns {State} with a dungeon, start deck and cards drawn
	 */
	function createNewState() {
		let state = actions.createNewState()
		// Store the seed as ordinary serializable state. Subsystems can derive their
		// own deterministic RNG stream from it without sharing mutable global RNG.
		state.seed = seed
		state.relics = []
		state.equipment = []
		state = actions.setDungeon(state)
		state = actions.addStarterDeck(state)
		state = actions.drawCards(state)
		return state
	}

	return {
		state: createNewState(),
		seed,
		actions,
		enqueue: actionManager.enqueue,
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
