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

function contentConfig() {
	return globalThis.__SLAY_CONTENT_PACK__ || {}
}

function activeContentPack() {
	return contentConfig().id
}

function localSavesEnabled() {
	return contentConfig().localSave !== false
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
		const config = contentConfig()
		const initialGameMode = urlParams.has('debug') || config.autoStart ? GameModes.gameplay : GameModes.splash

		// Dedicated auto-start content packs resume their own local slot unless an
		// explicit seed/URL save was requested or the route disables local saves.
		if (config.autoStart && localSavesEnabled() && !urlParams.has('seed') && !window.location.hash) {
			stageLocalRun(config.id)
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
		if (localSavesEnabled()) clearLocalRun(activeContentPack())
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
		if (localSavesEnabled() && !window.location.hash) stageLocalRun(activeContentPack())
		this.setState({gameMode: GameModes.gameplay})
	}

	handleWin() {
		if (localSavesEnabled()) clearLocalRun(activeContentPack())
		this.setState({gameMode: GameModes.win})
	}

	handleLoose() {
		if (localSavesEnabled()) clearLocalRun(activeContentPack())
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
