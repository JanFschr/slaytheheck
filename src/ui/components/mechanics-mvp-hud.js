import {createPortal} from 'preact/compat'
import {html, useState} from '../lib.js'

function Resource({label, value, max, title}) {
	return html`
		<span class="MechanicsMvpHud-resource" title=${title}>
			<strong>${label}</strong>
			<span>${value}/${max}</span>
		</span>
	`
}

function MechanicsMvpHudContent({gameState}) {
	const isDevRun = gameState.runProfile === 'dev'
	const [seed, setSeed] = useState(gameState.seed || '')
	const resources = gameState.resources || {}

	function restartWithSeed(event) {
		event.preventDefault()
		const url = new URL(window.location.href)
		url.hash = ''
		if (isDevRun) {
			url.search = ''
		} else {
			const nextSeed = seed.trim() || gameState.seed
			url.searchParams.set('seed', nextSeed)
		}
		window.location.href = url.toString()
	}

	return html`
		<aside class="MechanicsMvpHud" aria-label="Mechanics MVP resources">
			<span class="MechanicsMvpHud-label">${isDevRun ? 'Mechanics MVP · DEV' : 'Mechanics MVP'}</span>
			<div class="MechanicsMvpHud-resources">
				<${Resource}
					label="Heat"
					value=${resources.heat || 0}
					max=${10}
					title="At 8+ Heat, ending the turn causes overload damage and vents 4 Heat."
				/>
				<${Resource}
					label="Drones"
					value=${resources.drones || 0}
					max=${5}
					title="Each Drone deals 2 damage to every enemy before your turn ends."
				/>
				<${Resource}
					label="Void"
					value=${resources.corruption || 0}
					max=${6}
					title="Corruption powers Void cards and is usually gained by paying HP or exhausting cards."
				/>
			</div>
			<form class="MechanicsMvpHud-seed" onSubmit=${restartWithSeed}>
				<label>
					<span>Seed</span>
					<input
						value=${seed}
						readOnly=${isDevRun}
						onInput=${(event) => !isDevRun && setSeed(event.currentTarget.value)}
						aria-label="Run seed"
					/>
				</label>
				<button class="Button" type="submit">${isDevRun ? 'Restart dev run' : 'Restart'}</button>
			</form>
		</aside>
	`
}

export default function MechanicsMvpHud({gameState}) {
	if (gameState?.contentPack !== 'mechanics-mvp' || typeof document === 'undefined') return null
	return createPortal(html`<${MechanicsMvpHudContent} gameState=${gameState} />`, document.body)
}
