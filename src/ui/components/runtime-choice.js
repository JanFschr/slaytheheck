import {createPortal} from 'preact/compat'
import {html, useEffect, useState} from '../lib.js'
import {Card} from './cards.js'

function cardsForChoice(gameState, choice) {
	if (choice.kind !== 'cards') return []
	const pile = Array.isArray(gameState[choice.pile]) ? gameState[choice.pile] : []
	const candidates = new Set(choice.candidateIds || [])
	return pile.filter((card) => candidates.has(card.id))
}

function RuntimeChoice({gameState, choice}) {
	const [selectedIds, setSelectedIds] = useState([])
	useEffect(() => setSelectedIds([]), [choice.id])

	const cards = cardsForChoice(gameState, choice)
	const min = choice.min ?? 1
	const max = choice.max ?? min
	const canConfirm = selectedIds.length >= min && selectedIds.length <= max

	function toggleSelection(id) {
		setSelectedIds((current) => {
			if (current.includes(id)) return current.filter((candidate) => candidate !== id)
			if (max === 1) return [id]
			if (current.length >= max) return current
			return [...current, id]
		})
	}

	function handleKeyDown(event, id) {
		if (event.key !== 'Enter' && event.key !== ' ') return
		event.preventDefault()
		toggleSelection(id)
	}

	function resolveChoice() {
		if (!canConfirm) return
		const run = globalThis.window?.stw?.run
		if (typeof run !== 'function') throw new Error('Runtime choice host could not access the game action runner')
		run('resolveChoice', {choiceId: choice.id, selectedIds})
	}

	return html`
		<div class="RuntimeChoice-backdrop" role="presentation">
			<section
				class="RuntimeChoice"
				role="dialog"
				aria-modal="true"
				aria-labelledby="runtime-choice-title"
				data-choice-kind=${choice.kind}
				onKeyDown=${(event) => event.stopPropagation()}
			>
				<header class="RuntimeChoice-header">
					<h2 id="runtime-choice-title">${choice.prompt}</h2>
					<p>${min === max ? (min === 0 ? 'Optional choice' : `Choose ${min}`) : `Choose ${min}–${max}`}</p>
				</header>

				${
					choice.kind === 'cards' &&
					html`<div class="RuntimeChoice-cards" role="listbox" aria-multiselectable=${max > 1 ? 'true' : 'false'}>
						${cards.map(
							(card) => html`
								<div
									class="RuntimeChoice-card ${selectedIds.includes(card.id) ? 'is-selected' : ''}"
									role="option"
									tabindex="0"
									aria-selected=${selectedIds.includes(card.id) ? 'true' : 'false'}
									onClick=${() => toggleSelection(card.id)}
									onKeyDown=${(event) => handleKeyDown(event, card.id)}
								>
									${Card({card, gameState})}
								</div>
							`,
						)}
					</div>`
				}

				${
					choice.kind === 'options' &&
					html`<div class="RuntimeChoice-options" role="listbox" aria-multiselectable=${max > 1 ? 'true' : 'false'}>
						${(choice.options || []).map(
							(option) => html`
								<button
									class="Button RuntimeChoice-option ${selectedIds.includes(option.id) ? 'is-selected' : ''}"
									aria-selected=${selectedIds.includes(option.id) ? 'true' : 'false'}
									onClick=${() => toggleSelection(option.id)}
								>
									<strong>${option.label}</strong>
									${option.description && html`<span>${option.description}</span>`}
								</button>
							`,
						)}
					</div>`
				}

				<footer class="RuntimeChoice-actions">
					<span>${selectedIds.length}/${max}</span>
					<button class="Button Button--primary" disabled=${!canConfirm} onClick=${resolveChoice}>
						${min === 0 && selectedIds.length === 0 ? 'Skip' : 'Confirm'}
					</button>
				</footer>
			</section>
		</div>
	`
}

/**
 * The menu is always mounted by the game shell, so it hosts this portal even
 * while the menu itself is closed. The portal is attached to document.body to
 * avoid inheriting visibility/pointer-events from any regular game overlay.
 */
export default function RuntimeChoicePortal({gameState}) {
	const choice = gameState?.pendingChoice
	if (!choice || typeof document === 'undefined') return null
	return createPortal(html`<${RuntimeChoice} gameState=${gameState} choice=${choice} />`, document.body)
}
