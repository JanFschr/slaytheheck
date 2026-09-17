import {Component, html, render} from '../lib.js'
import {clearLocalRun, loadLocalRun} from '../save-load.js'
import GameScreen from './game-screen.js'
import SplashScreen from './splash-screen.js'
import WinScreen from './win-screen.js'
import '../styles/index.css'
// import {init as initSounds} from '../sounds.js'

/** @enum {string} */
const GameModes = {
	splash: 'splash',
	gameplay: 'gameplay',
	win: 'win',
}

function activeContentPack() {
	return globalThis.__SLAY_CONTENT_PACK__?.id
}

function stageLocalRun(contentPack) {
	const saved = loadLocalRun(contentPack)
	if (!saved) return false
	globalThis.__SLAY_RESUME_STATE__ = saved.state
	return true
}

/**
 * Our root component for the game.
 * Controls what to render.
 */
export default class SlayTheWeb extends Component {
	constructor() {
		super()
		const urlParams = new URLSearchParams(window.location.search)
		const contentConfig = globalThis.__SLAY_CONTENT_PACK__ || {}
		const initialGameMode = urlParams.has('debug') || contentConfig.autoStart ? GameModes.gameplay : GameModes.splash

		// Dedicated auto-start content packs resume their own local slot unless an
		// explicit seed or URL save was requested.
		if (contentConfig.autoStart && !urlParams.has('seed') && !window.location.hash) {
			stageLocalRun(contentConfig.id)
		}

		this.state = {
			gameMode: initialGameMode,
			selectedDeck: null, // Stores the player's deck choice from the deck selection screen
		}

		this.handleNewGame = this.handleNewGame.bind(this)
		this.handleContinue = this.handleContinue.bind(this)
		this.handleWin = this.handleWin.bind(this)
		this.handleLoose = this.handleLoose.bind(this)
	}

	handleNewGame(selectedDeck) {
		// await initSounds()
		clearLocalRun(activeContentPack())
		delete globalThis.__SLAY_RESUME_STATE__
		this.setState({
			gameMode: GameModes.gameplay,
			selectedDeck,
		})

		// A new run must not immediately restore an old URL save. Dedicated content
		// pack pages keep their query parameters (for example an explicit seed).
		const url = new URL(window.location.href)
		url.hash = ''
		if (!globalThis.__SLAY_CONTENT_PACK__) url.search = ''
		window.history.pushState('', document.title, `${url.pathname}${url.search}`)
	}

	handleContinue() {
		// URL saves remain backwards compatible and take precedence. Otherwise stage
		// the browser-local save so createNewGame can hydrate it on mount.
		if (!window.location.hash) stageLocalRun(activeContentPack())
		this.setState({gameMode: GameModes.gameplay})
	}

	handleWin() {
		clearLocalRun(activeContentPack())
		this.setState({gameMode: GameModes.win})
	}

	handleLoose() {
		clearLocalRun(activeContentPack())
		this.setState({gameMode: GameModes.splash})
	}

	render() {
		const {gameMode, selectedDeck} = this.state
		if (gameMode === GameModes.splash) {
			return html` <${SplashScreen} onNewGame=${this.handleNewGame} onContinue=${this.handleContinue} /> `
		}
		if (gameMode === GameModes.gameplay) {
			return html`
				<${GameScreen} selectedDeck=${selectedDeck} onWin=${this.handleWin} onLoose=${this.handleLoose} />
			`
		}
		if (gameMode === GameModes.win) {
			return html`<${WinScreen} onNewGame=${this.handleNewGame} />`
		}
	}
}

if (!customElements.get('slay-the-web')) {
	customElements.define(
		'slay-the-web',
		class SlayTheWebElement extends HTMLElement {
			connectedCallback() {
				render(html` <${SlayTheWeb} /> `, this)
			}
		},
	)
}
