import {createPortal} from 'preact/compat'
import {html, useState} from '../lib.js'

function ResourcePips({value, max, dangerFrom}) {
	return html`
		<span class="MechanicsMvpHud-pips" aria-hidden="true">
			${Array.from({length: max}, (_, index) => {
				const level = index + 1
				const classes = [
					'MechanicsMvpHud-pip',
					level <= value ? 'is-filled' : '',
					dangerFrom && level >= dangerFrom ? 'is-dangerZone' : '',
				]
					.filter(Boolean)
					.join(' ')
				return html`<i class=${classes}></i>`
			})}
		</span>
	`
}

function Resource({resource, icon, label, value, max, title, dangerFrom}) {
	const safeValue = Math.max(0, Math.min(max, Number(value) || 0))
	const isDanger = Boolean(dangerFrom && safeValue >= dangerFrom)
	const accessibleDetail = `${label} ${safeValue} of ${max}. ${title}`

	return html`
		<span
			class="MechanicsMvpHud-resource"
			data-resource=${resource}
			data-danger=${isDanger ? 'true' : null}
			title=${title}
			tabIndex="0"
			aria-label=${accessibleDetail}
		>
			<span class="MechanicsMvpHud-icon" aria-hidden="true">${icon}</span>
			<strong>${label}</strong>
			<span class="MechanicsMvpHud-value">${safeValue}/${max}</span>
			<${ResourcePips} value=${safeValue} max=${max} dangerFrom=${dangerFrom} />
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
		<aside class="MechanicsMvpHud" aria-label="Combat resources">
			<span class="MechanicsMvpHud-label">${isDevRun ? 'Mechanics MVP · DEV' : 'Mechanics MVP'}</span>
			<div class="MechanicsMvpHud-resources">
				<${Resource}
					resource="heat"
					icon="▲"
					label="Heat"
					value=${resources.heat || 0}
					max=${10}
					dangerFrom=${8}
					title="At 8+ Heat, ending the turn causes overload damage and vents 4 Heat."
				/>
				<${Resource}
					resource="drones"
					icon="◉"
					label="Drones"
					value=${resources.drones || 0}
					max=${5}
					title="Each Drone deals 2 damage to every enemy before your turn ends."
				/>
				<${Resource}
					resource="corruption"
					icon="◈"
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
