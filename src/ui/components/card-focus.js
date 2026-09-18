let activeFocus = null

function getHandCards(container) {
	return Array.from(container.querySelectorAll('.Hand .Card'))
}

function cleanClone(card) {
	const clone = card.cloneNode(true)
	clone.classList.remove('is-tapSelected')
	clone.removeAttribute('tabindex')
	clone.removeAttribute('role')
	clone.removeAttribute('aria-disabled')
	clone.removeAttribute('data-tap-play-enabled')
	clone.querySelector('.Card-inspectHint')?.remove()
	clone.dataset.cardFocusClone = 'true'
	return clone
}

export function closeCardFocus() {
	if (!activeFocus) return
	activeFocus.remove()
	activeFocus = null
	document.documentElement.classList.remove('has-card-focus')
}

export function openCardFocus(container, cardId) {
	closeCardFocus()

	const cards = getHandCards(container)
	let currentIndex = cards.findIndex((card) => card.dataset.id === cardId)
	if (currentIndex < 0) return

	const root = document.createElement('div')
	root.className = 'CardFocus'
	root.setAttribute('role', 'dialog')
	root.setAttribute('aria-modal', 'true')
	root.tabIndex = -1

	const backdrop = document.createElement('div')
	backdrop.className = 'CardFocus-backdrop'
	backdrop.setAttribute('aria-hidden', 'true')

	const close = document.createElement('button')
	close.className = 'CardFocus-close'
	close.type = 'button'
	close.setAttribute('aria-label', 'Close card details')
	close.textContent = '×'

	const previous = document.createElement('button')
	previous.className = 'CardFocus-nav CardFocus-nav--previous'
	previous.type = 'button'
	previous.setAttribute('aria-label', 'Previous card')
	previous.textContent = '‹'

	const next = document.createElement('button')
	next.className = 'CardFocus-nav CardFocus-nav--next'
	next.type = 'button'
	next.setAttribute('aria-label', 'Next card')
	next.textContent = '›'

	const stage = document.createElement('div')
	stage.className = 'CardFocus-stage'

	const shell = document.createElement('div')
	shell.className = 'CardFocus-cardShell'

	const meta = document.createElement('div')
	meta.className = 'CardFocus-meta'

	const position = document.createElement('div')
	position.className = 'CardFocus-position'

	const hint = document.createElement('div')
	hint.className = 'CardFocus-hint'
	hint.textContent = 'Swipe sideways to browse · swipe down to close'

	stage.append(shell, meta, position, hint)
	root.append(backdrop, close, previous, stage, next)
	document.body.appendChild(root)
	activeFocus = root
	document.documentElement.classList.add('has-card-focus')

	function render(index) {
		const card = cards[index]
		if (!card) return
		currentIndex = index
		const clone = cleanClone(card)
		const name = card.querySelector('.Card-name')?.textContent?.trim() || 'Card'
		const type = card.dataset.cardType || 'card'
		const rarity = card.dataset.rarity || 'basic'
		const cost = card.querySelector('.Card-energy span')?.textContent?.trim() || '—'

		root.setAttribute('aria-label', `${name} card details`)
		shell.replaceChildren(clone)
		meta.replaceChildren()
		for (const text of [type, '•', rarity, '•', `Cost ${cost}`]) {
			const item = document.createElement('span')
			item.textContent = text
			meta.appendChild(item)
		}
		position.textContent = `${currentIndex + 1} / ${cards.length}`
		previous.disabled = currentIndex === 0
		next.disabled = currentIndex === cards.length - 1
	}

	function move(delta) {
		const targetIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + delta))
		if (targetIndex !== currentIndex) render(targetIndex)
	}

	let pointerStart = null
	root.addEventListener('pointerdown', (event) => {
		pointerStart = {x: event.clientX, y: event.clientY}
	})
	root.addEventListener('pointerup', (event) => {
		if (!pointerStart) return
		const deltaX = event.clientX - pointerStart.x
		const deltaY = event.clientY - pointerStart.y
		pointerStart = null
		const horizontal = Math.abs(deltaX) > Math.abs(deltaY)
		if (horizontal && Math.abs(deltaX) > 52) {
			move(deltaX > 0 ? -1 : 1)
			return
		}
		if (!horizontal && deltaY > 72) closeCardFocus()
	})

	root.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			event.preventDefault()
			event.stopPropagation()
			closeCardFocus()
		}
		if (event.key === 'ArrowLeft') {
			event.preventDefault()
			move(-1)
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault()
			move(1)
		}
	})

	close.addEventListener('click', (event) => {
		event.stopPropagation()
		closeCardFocus()
	})
	previous.addEventListener('click', (event) => {
		event.stopPropagation()
		move(-1)
	})
	next.addEventListener('click', (event) => {
		event.stopPropagation()
		move(1)
	})
	backdrop.addEventListener('click', closeCardFocus)
	stage.addEventListener('click', (event) => event.stopPropagation())

	render(currentIndex)
	requestAnimationFrame(() => root.focus())
}
