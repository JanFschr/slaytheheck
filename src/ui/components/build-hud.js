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

export default function BuildHud({gameState}) {
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
