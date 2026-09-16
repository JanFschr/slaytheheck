import {createPortal} from 'preact/compat'
import {html} from '../lib.js'

function ItemChip({item, kind}) {
	const detail = kind === 'equipment' ? `${item.slot}: ${item.description}` : item.description
	return html`
		<span class="BuildHud-chip" data-kind=${kind} title=${detail} aria-label=${`${item.name}. ${detail}`}>
			<span aria-hidden="true">${item.icon}</span>
			<span class="BuildHud-chipName">${item.name}</span>
		</span>
	`
}

function BuildHudContent({gameState}) {
	const relics = gameState.relics || []
	const equipment = gameState.equipment || []

	return html`
		<aside class="BuildHud" aria-label="Current build and gold">
			<span class="BuildHud-gold" title="Gold">💰 ${gameState.gold || 0}</span>
			${relics.length ? html`<span class="BuildHud-count">Relics ${relics.length}</span>` : null}
			${relics.map((item) => html`<${ItemChip} item=${item} kind="relic" />`)}
			${equipment.length ? html`<span class="BuildHud-count">Gear ${equipment.length}</span>` : null}
			${equipment.map((item) => html`<${ItemChip} item=${item} kind="equipment" />`)}
		</aside>
	`
}

/** The menu is always mounted; portal the HUD so its visibility is independent of the menu overlay. */
export default function BuildHud({gameState}) {
	if (!gameState || typeof document === 'undefined') return null
	return createPortal(html`<${BuildHudContent} gameState=${gameState} />`, document.body)
}
