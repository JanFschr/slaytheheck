import {html, useEffect, useState} from '../lib.js'
import {clearLocalRun, saveLocalRun, saveToUrl} from '../save-load.js'
import {toggleMute} from '../sounds.js'
import BuildHud from './build-hud.js'
import MechanicsMvpHud from './mechanics-mvp-hud.js'
import RuntimeChoicePortal from './runtime-choice.js'
import {StrategicRoomPortal} from './strategic-room.js'

/** @typedef {import('../../game/new-game.js').Game} Game */
/** @typedef {import('../../game/actions.js').State} State */

/**
 * Do something
 * @param {object} props
 * @param {State} props.gameState
 * @returns {import('preact').VNode}
 */
export default function Menu({gameState}) {
	const [muted, setMuted] = useState(false)
	const [saveStatus, setSaveStatus] = useState('')
	const localSaveEnabled = gameState?.localSaveEnabled !== false

	useEffect(() => {
		if (!gameState?.player || !localSaveEnabled) return
		if (gameState.player.currentHealth < 1 || gameState.won) {
			clearLocalRun(gameState.contentPack)
			return
		}
		saveLocalRun(gameState)
	}, [gameState, localSaveEnabled])

	function toggleSound() {
		toggleMute(!muted)
		setMuted(!muted)
	}

	function saveNow() {
		const saved = saveLocalRun(gameState)
		setSaveStatus(saved ? 'Saved on this device.' : 'Local save unavailable.')
	}

	function abandonGame() {
		if (localSaveEnabled) clearLocalRun(gameState.contentPack)
		window.location.href = import.meta.env.BASE_URL || '/'
	}

	return html`
		<${RuntimeChoicePortal} gameState=${gameState} />
		<${StrategicRoomPortal} gameState=${gameState} />
		<${BuildHud} gameState=${gameState} />
		<${MechanicsMvpHud} gameState=${gameState} />
		<div class="Container">
			<br />
			<br />
			<div class="Box">
				<ul class="Options">
					${
						localSaveEnabled
							? html`
								<li><strong>Local autosave is on.</strong> This run is stored only in this browser.</li>
								<li>
									<button class="Button" onClick=${saveNow}>Save locally now</button>
									${saveStatus && html`<small> ${saveStatus}</small>`}
								</li>
							`
							: html`<li><strong>Dev run.</strong> Local autosave is disabled so every reload starts clean.</li>`
					}
					<li>
						<button
							class="Button"
							onClick=${() => saveToUrl(gameState)}
							title="Store the save in the URL so it can be copied to another browser."
						>
							Create shareable save URL
						</button>
					</li>
					<li>
						<button class="Button" danger onClick=${abandonGame}>Abandon game</button>
					</li>
					<li>
						<label>Sound <input type="checkbox" checked=${!muted} onClick=${() => toggleSound()} /></label>
					</li>
				</ul>
			</div>
		</div>
	`
}
