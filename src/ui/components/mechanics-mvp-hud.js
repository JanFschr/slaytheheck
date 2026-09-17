import {createPortal} from 'preact/compat'
import {getCurrRoom} from '../../game/utils-state.js'
import {html, useEffect, useRef, useState} from '../lib.js'

const resourceDefinitions = [
	{
		resource: 'heat',
		icon: '▲',
		label: 'Heat',
		max: 10,
		dangerFrom: 8,
		title: 'Heat is a combat resource. At 8+ Heat, ending the turn causes overload damage and vents 4 Heat.',
	},
	{
		resource: 'drones',
		icon: '◉',
		label: 'Drones',
		max: 5,
		title: 'Drones are deployed combat units represented as a stack. Each Drone deals 2 damage to every enemy before your turn ends.',
	},
	{
		resource: 'corruption',
		icon: '◈',
		label: 'Void',
		max: 6,
		title: 'Void is your Corruption resource. It powers Void cards and is usually gained by paying HP or exhausting cards.',
	},
]

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

function Resource({resource, icon, label, value, max, title, dangerFrom, expanded, onToggle}) {
	const safeValue = Math.max(0, Math.min(max, Number(value) || 0))
	const isDanger = Boolean(dangerFrom && safeValue >= dangerFrom)
	const accessibleDetail = `${label} ${safeValue} of ${max}. ${title}`
	const infoId = `mechanics-resource-info-${resource}`

	return html`
		<button
			type="button"
			class="MechanicsMvpHud-resource"
			data-resource=${resource}
			data-danger=${isDanger ? 'true' : null}
			title=${title}
			aria-label=${accessibleDetail}
			aria-expanded=${expanded ? 'true' : 'false'}
			aria-controls=${expanded ? infoId : null}
			aria-haspopup="dialog"
			onClick=${onToggle}
		>
			<span class="MechanicsMvpHud-icon" aria-hidden="true">${icon}</span>
			<strong>${label}</strong>
			<span class="MechanicsMvpHud-value">${safeValue}/${max}</span>
			<${ResourcePips} value=${safeValue} max=${max} dangerFrom=${dangerFrom} />
		</button>
	`
}

function MechanicsMvpHudContent({gameState}) {
	const isDevRun = gameState.runProfile === 'dev'
	const [seed, setSeed] = useState(gameState.seed || '')
	const [activeResource, setActiveResource] = useState(null)
	const hudRef = useRef(null)
	const resources = gameState.resources || {}
	const roomType = getCurrRoom(gameState).type
	const resourceViews = resourceDefinitions.map((definition) => ({
		...definition,
		value: resources[definition.resource] || 0,
	}))
	const activeResourceInfo = resourceViews.find((entry) => entry.resource === activeResource)

	useEffect(() => {
		if (!activeResource) return undefined

		function closeOnOutsidePointer(event) {
			if (!hudRef.current?.contains(event.target)) setActiveResource(null)
		}

		function closeOnEscape(event) {
			if (event.key === 'Escape') setActiveResource(null)
		}

		document.addEventListener('pointerdown', closeOnOutsidePointer)
		document.addEventListener('keydown', closeOnEscape)
		return () => {
			document.removeEventListener('pointerdown', closeOnOutsidePointer)
			document.removeEventListener('keydown', closeOnEscape)
		}
	}, [activeResource])

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
		<aside ref=${hudRef} class="MechanicsMvpHud" data-room-type=${roomType} aria-label="Combat resources">
			<span class="MechanicsMvpHud-label">${isDevRun ? 'Mechanics MVP · DEV' : 'Mechanics MVP'}</span>
			<div class="MechanicsMvpHud-resources">
				${resourceViews.map(
					(entry) => html`
						<${Resource}
							...${entry}
							expanded=${activeResource === entry.resource}
							onToggle=${() => setActiveResource((current) => (current === entry.resource ? null : entry.resource))}
						/>
					`,
				)}
			</div>
			${
				activeResourceInfo &&
				html`
					<div
						class="MechanicsMvpHud-popover"
						id=${`mechanics-resource-info-${activeResourceInfo.resource}`}
						role="dialog"
						aria-label=${`${activeResourceInfo.label} information`}
					>
						<div class="MechanicsMvpHud-popoverHeader">
							<strong>
								<span aria-hidden="true">${activeResourceInfo.icon}</span>
								${activeResourceInfo.label}
							</strong>
							<span class="MechanicsMvpHud-popoverValue">
								${Math.max(0, Math.min(activeResourceInfo.max, Number(activeResourceInfo.value) || 0))}/${
									activeResourceInfo.max
								}
							</span>
							<button
								type="button"
								class="MechanicsMvpHud-popoverClose"
								aria-label=${`Close ${activeResourceInfo.label} information`}
								onClick=${() => setActiveResource(null)}
							>
								×
							</button>
						</div>
						<p>${activeResourceInfo.title}</p>
					</div>
				`
			}
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
