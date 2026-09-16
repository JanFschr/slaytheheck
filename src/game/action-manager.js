import {Queue} from '../utils.js'
import actions from './actions.js'
import {runTriggers, triggerEvent} from './triggers.js'

/** @typedef {import('./actions.js').State} State */

/**
 * @typedef {object} FutureAction
 * @prop {string} type - the name of a function in actions.js
 * @prop {any} [any] - arguments are passed to the action
 */

/**
 * @typedef {object} PastAction
 * @prop {string} type - the name of a function in actions.js
 * @prop {State} state
 */

/**
 * @typedef {object} ActionManager
 * @prop {function(FutureAction):void} enqueue
 * @prop {function(State):State} dequeue
 * @prop {function():PastAction} undo
 * @prop {function():State} redo
 * @prop {Queue} future
 * @prop {Queue} past
 * @prop {Queue} redoStack
 */

/**
 * The action manager makes use of queues to keep track of future and past actions in the game state + undo.
 * It also exposes a lifecycle seam around queued actions so relics/equipment can react without hard-coding
 * item-specific conditions into actions.js.
 * @param {object} props
 * @param {boolean} props.debug - whether to log actions to the console
 * @returns {ActionManager} action manager
 */
export default function ActionManager(props) {
	const future = new Queue()
	const past = new Queue()
	const redoStack = new Queue()

	/**
	 * Execute a trigger action directly against core actions. Trigger-generated
	 * actions intentionally do not recurse through the lifecycle system yet.
	 * @param {State} state
	 * @param {{type: string, parameter?: object}} triggerAction
	 */
	function executeTriggerAction(state, triggerAction) {
		const action = actions[triggerAction.type]
		if (!action) throw new Error(`Unknown trigger action: ${triggerAction.type}`)
		return action(state, triggerAction.parameter || {})
	}

	/**
	 * Enqueued items are added to the "future" list
	 * @param {FutureAction} action
	 */
	function enqueue(action) {
		if (props.debug) console.log('am:enqueue', action)
		future.enqueue({action})
		// Clear redo stack when new actions are taken
		redoStack.list = []
	}

	/**
	 * Dequeing runs the oldest action (from the `future` queue) on the state.
	 * The action is then moved to the `past` queue.
	 * @param {State} state
	 * @returns {State} new state
	 */
	function dequeue(state) {
		const {action} = future.dequeue() || {}
		if (props.debug) console.log('am:dequeue', action)
		if (!action) return state

		let nextState
		try {
			const context = {action}
			nextState = runTriggers(state, 'beforeAction', context, executeTriggerAction)
			nextState = runTriggers(nextState, triggerEvent.beforeAction(action.type), context, executeTriggerAction)
			nextState = actions[action.type](nextState, action)
			nextState = runTriggers(nextState, triggerEvent.afterAction(action.type), context, executeTriggerAction)
			nextState = runTriggers(nextState, 'afterAction', context, executeTriggerAction)
		} catch (err) {
			console.warn('am:Failed running action', action)
			throw new Error(err)
		}
		past.enqueue({action, state})
		return nextState
	}

	/**
	 * Returns an object with the most recently run action and how the state looked before.
	 * @returns {PastAction}
	 */
	function undo() {
		if (props.debug) console.log('am:undo')
		const item = this.past.list.pop()
		if (item) redoStack.enqueue(item)
		return item
	}

	/**
	 * Redoes the most recently undone action
	 * @returns {PastAction}
	 */
	function redo() {
		if (props.debug) console.log('am:redo')
		const item = redoStack.list.pop()
		if (item) past.enqueue(item)
		return item
	}

	return {
		enqueue,
		dequeue,
		undo,
		redo,
		future,
		past,
		redoStack,
	}
}
