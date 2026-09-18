import {html, useEffect, useRef} from '../lib.js'
import {Card} from './cards.js'

export default function CardFocus({cards = [], focusedCardId, gameState, onClose, onFocusCard}) {
	const rootRef = useRef(null)
	const pointerStart = useRef(null)
	const currentIndex = cards.findIndex((card) => card.id === focusedCardId)
	const card = currentIndex >= 0 ? cards[currentIndex] : null

	useEffect(() => {
		if (!card) return
		requestAnimationFrame(() => rootRef.current?.focus())
	}, [focusedCardId])

	if (!card) return null

	const showPrevious = currentIndex > 0
	const showNext = currentIndex < cards.length - 1

	const focusIndex = (index) => {
		const nextCard = cards[index]
		if (nextCard) onFocusCard(nextCard.id)
	}

	const handleKeyDown = (event) => {
		if (event.key === 'Escape') {
			event.preventDefault()
			event.stopPropagation()
			onClose()
			return
		}
		if (event.key === 'ArrowLeft' && showPrevious) {
			event.preventDefault()
			event.stopPropagation()
			focusIndex(currentIndex - 1)
		}
		if (event.key === 'ArrowRight' && showNext) {
			event.preventDefault()
			event.stopPropagation()
			focusIndex(currentIndex + 1)
		}
	}

	const handlePointerDown = (event) => {
		pointerStart.current = {x: event.clientX, y: event.clientY}
	}

	const handlePointerUp = (event) => {
		const start = pointerStart.current
		pointerStart.current = null
		if (!start) return

		const deltaX = event.clientX - start.x
		const deltaY = event.clientY - start.y
		const horizontal = Math.abs(deltaX) > Math.abs(deltaY)

		if (horizontal && Math.abs(deltaX) > 52) {
			if (deltaX > 0 && showPrevious) focusIndex(currentIndex - 1)
			if (deltaX < 0 && showNext) focusIndex(currentIndex + 1)
			return
		}

		if (!horizontal && deltaY > 72) onClose()
	}

	return html`
		<div
			ref=${rootRef}
			class="CardFocus"
			role="dialog"
			aria-modal="true"
			aria-label=${`${card.name} card details`}
			tabIndex="-1"
			onKeyDown=${handleKeyDown}
			onPointerDown=${handlePointerDown}
			onPointerUp=${handlePointerUp}
			onClick=${(event) => {
				if (event.target === event.currentTarget) onClose()
			}}
		>
			<div class="CardFocus-backdrop" aria-hidden="true"></div>
			<button class="CardFocus-close" type="button" aria-label="Close card details" onClick=${onClose}>×</button>

			<button
				class="CardFocus-nav CardFocus-nav--previous"
				type="button"
				aria-label="Previous card"
				disabled=${!showPrevious}
				onClick=${(event) => {
					event.stopPropagation()
					focusIndex(currentIndex - 1)
				}}
			>
				‹
			</button>

			<div class="CardFocus-stage" onClick=${(event) => event.stopPropagation()}>
				<div class="CardFocus-cardShell">
					<${Card} card=${card} gameState=${gameState} />
				</div>
				<div class="CardFocus-meta" aria-label="Card metadata">
					<span>${card.type}</span>
					<span aria-hidden="true">•</span>
					<span>${card.rarity || 'basic'}</span>
					<span aria-hidden="true">•</span>
					<span>Cost ${card.energy}</span>
				</div>
				<div class="CardFocus-position">${currentIndex + 1} / ${cards.length}</div>
				<div class="CardFocus-hint">Swipe sideways to browse · swipe down to close</div>
			</div>

			<button
				class="CardFocus-nav CardFocus-nav--next"
				type="button"
				aria-label="Next card"
				disabled=${!showNext}
				onClick=${(event) => {
					event.stopPropagation()
					focusIndex(currentIndex + 1)
				}}
			>
				›
			</button>
		</div>
	`
}
