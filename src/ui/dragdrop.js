import {Draggable} from 'gsap/Draggable.js'
import {cardHasValidTarget, getTargetStringFromElement} from '../game/utils-state.js'
import gsap from './animations.js'
import * as sounds from './sounds.js'

/** Class to add to the element we are dragging over */
const overClass = 'is-dragOver'
const selectedClass = 'is-tapSelected'
const tapTargetClass = 'is-tapTarget'

/** Makes the card fly back into the hand */
function animateCardToHand(draggable) {
	return gsap.to(draggable.target, {x: draggable.startX, y: draggable.startY, zIndex: 0})
}

/**
 * This gets called continuously while dragging a card.
 * @param {HTMLElement} target - element being dragged
 * @param {HTMLElement} targetEl - element below the target
 */
function canDropOnTarget(target, targetEl) {
	if (!targetEl) return false
	const hasValidTarget = cardHasValidTarget(
		target.getAttribute('data-card-target'),
		getTargetStringFromElement(targetEl),
	)
	const targetIsDead = targetEl.classList.contains('Target--isDead')
	return hasValidTarget && !targetIsDead
}

function hasCoarsePointer() {
	return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
}

/** @param {Element} container */
function clearTapSelection(container) {
	container.querySelectorAll(`.${selectedClass}`).forEach((card) => card.classList.remove(selectedClass))
	container.querySelectorAll(`.${tapTargetClass}`).forEach((target) => target.classList.remove(tapTargetClass))
}

/**
 * @param {Element} container
 * @param {HTMLElement} card
 * @param {NodeListOf<HTMLElement>} targets
 */
function selectCardForTap(container, card, targets) {
	clearTapSelection(container)
	card.classList.add(selectedClass)
	targets.forEach((target) => {
		if (canDropOnTarget(card, target)) target.classList.add(tapTargetClass)
	})
	sounds.selectCard()
}

/**
 * Adds tap/keyboard card play. This is the primary interaction on touch devices
 * and an accessible alternative to dragging on desktop.
 * @param {Element} container
 * @param {NodeListOf<HTMLElement>} targets
 * @param {NodeListOf<HTMLElement>} cards
 * @param {Function} afterRelease
 */
function enableTapToPlay(container, targets, cards, afterRelease) {
	const playOnTarget = (targetEl) => {
		/** @type {HTMLElement | null} */
		const selectedCard = container.querySelector(`.Hand .Card.${selectedClass}`)
		if (!selectedCard || !canDropOnTarget(selectedCard, targetEl)) return
		const targetString = getTargetStringFromElement(targetEl)
		clearTapSelection(container)
		afterRelease(selectedCard.dataset.id, targetString, selectedCard)
	}

	targets.forEach((target) => {
		if (target.dataset.tapPlayEnabled) return
		target.dataset.tapPlayEnabled = 'true'
		target.tabIndex = 0
		target.addEventListener('click', () => playOnTarget(target))
		target.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return
			event.preventDefault()
			playOnTarget(target)
		})
	})

	cards.forEach((card) => {
		card.tabIndex = 0
		card.setAttribute('role', 'button')
		card.setAttribute('aria-disabled', card.hasAttribute('disabled') ? 'true' : 'false')
		if (card.dataset.tapPlayEnabled) return
		card.dataset.tapPlayEnabled = 'true'

		const selectOrConfirm = () => {
			if (card.hasAttribute('disabled') || card.dataset.wasDragged === 'true') return
			const alreadySelected = card.classList.contains(selectedClass)
			const cardTarget = card.getAttribute('data-card-target')

			// Self-targeting cards use a second tap as an explicit confirmation.
			if (alreadySelected && cardTarget === 'player') {
				const playerTarget = Array.from(targets).find((target) => canDropOnTarget(card, target))
				if (playerTarget) playOnTarget(playerTarget)
				return
			}

			selectCardForTap(container, card, targets)
		}

		card.addEventListener('click', selectOrConfirm)
		card.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return
			event.preventDefault()
			selectOrConfirm()
		})
	})
}

/**
 * Enables card interaction. Touch/coarse-pointer devices use tap-to-play;
 * fine pointers additionally get the original drag-and-drop interaction.
 * @param {Element} container
 * @param {Function} afterRelease
 */
export default function enableDragDrop(container, afterRelease) {
	/** @type {NodeListOf<HTMLElement>} */
	const targets = container.querySelectorAll('.Target')
	const cards = container.querySelectorAll('.Hand .Card')

	clearTapSelection(container)
	enableTapToPlay(container, targets, cards, afterRelease)

	cards.forEach((card) => {
		const existingDraggable = Draggable.get(card)
		if (existingDraggable) existingDraggable.kill()

		// Dragging fights horizontal hand scrolling on phones/tablets. Tap-to-play
		// stays enabled everywhere, so only create Draggable for fine pointers.
		if (hasCoarsePointer()) return

		Draggable.create(card, {
			onDragStart() {
				card.dataset.wasDragged = 'true'
				clearTapSelection(container)
				// Kill any animations trying to move this card
				gsap.killTweensOf(this.target)
				// Reset to proper hand position
				this.startX = 0
				this.startY = 0
				sounds.selectCard()
			},

			onDrag() {
				const cardEl = this.target

				if (cardEl.attributes.disabled) {
					this.endDrag()
				}

				for (const targetEl of targets) {
					if (this.hitTest(targetEl, '40%') && canDropOnTarget(cardEl, targetEl)) {
						targetEl.classList.add(overClass)
					} else {
						targetEl.classList.remove(overClass)
					}
				}
			},

			onRelease() {
				const cardEl = this.target

				// Find the (first) DOM element we dropped the card on.
				let targetEl
				for (const t of targets) {
					if (this.hitTest(t, '40%')) {
						targetEl = t
						break
					}
				}

				// Either trigger the callback with a valid target, or animate the card back into the hand.
				if (canDropOnTarget(cardEl, targetEl)) {
					const targetString = getTargetStringFromElement(targetEl)
					afterRelease(cardEl.dataset.id, targetString, cardEl)
				} else {
					animateCardToHand(this)
					sounds.cardToHand()
				}

				// Remove active class from any other targets.
				targets.forEach((t) => {
					t.classList.remove(overClass)
				})
				requestAnimationFrame(() => {
					delete cardEl.dataset.wasDragged
				})
			},
		})
	})
}
