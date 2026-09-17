import {html, useEffect, useState} from '../lib.js'
import {clearLocalRun, saveLocalRun, saveToUrl} from '../save-load.js'
import {APPEARANCE_OPTIONS, getAppearance, setAppearance, skinsForTheme} from '../theme.js'
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
	const [appearance, setAppearanceState] = useState(getAppearance())
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

	function changeTheme(event) {
		const theme = APPEARANCE_OPTIONS.find((entry) => entry.id === event.currentTarget.value)
		if (!theme) return
		setAppearanceState(setAppearance({theme: theme.id, skin: theme.defaultSkin}))
	}

	function changeSkin(event) {
		setAppearanceState(setAppearance({...appearance, skin: event.currentTarget.value}))
	}

	const availableSkins = skinsForTheme(appearance.theme)

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
					<li class="AppearanceControls">
						<label>
							<span>Theme</span>
							<select aria-label="Visual theme" value=${appearance.theme} onChange=${changeTheme}>
								${APPEARANCE_OPTIONS.map(
									(option) => html`<option value=${option.id}>${option.label}</option>`,
								)}
							</select>
						</label>
						${
							availableSkins.length > 1 &&
							html`
								<label>
									<span>Skin</span>
									<select aria-label="Theme skin" value=${appearance.skin} onChange=${changeSkin}>
										${availableSkins.map(
											(option) => html`<option value=${option.id}>${option.label}</option>`,
										)}
									</select>
								</label>
							`
						}
					</li>
					<li>
						<label>Sound <input type="checkbox" checked=${!muted} onClick=${() => toggleSound()} /></label>
					</li>
					<li>
						<button class="Button" danger onClick=${abandonGame}>Abandon game</button>
					</li>
				</ul>
			</div>
		</div>
	`
}
