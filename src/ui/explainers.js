const MOBILE_QUERY = '(max-width: 700px)'

let activeTarget = null
let popover = null

function isMobileExplainerMode() {
	return typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
}

function humanize(value) {
	if (!value) return ''
	return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getExplainerTitle(target) {
	if (target.dataset.explainerTitle) return target.dataset.explainerTitle
	if (target.closest('.EnergyBadge')) return 'Energy'
	if (target.dataset.power) return humanize(target.dataset.power)
	if (target.dataset.intentType) return `${humanize(target.dataset.intentType)} intent`
	return 'Info'
}

function ensurePopover() {
	if (popover) return popover

	popover = document.createElement('section')
	popover.className = 'ExplainerPopover'
	popover.hidden = true
	popover.setAttribute('role', 'dialog')
	popover.setAttribute('aria-modal', 'false')
	popover.innerHTML = `
		<header class="ExplainerPopover-header">
			<strong class="ExplainerPopover-title"></strong>
			<button class="ExplainerPopover-close" type="button" aria-label="Close explanation">×</button>
		</header>
		<p class="ExplainerPopover-description"></p>
	`

	popover.querySelector('.ExplainerPopover-close').addEventListener('click', closeExplainer)
	document.body.appendChild(popover)
	return popover
}

function closeExplainer() {
	if (!popover) return
	popover.hidden = true
	if (activeTarget) activeTarget.setAttribute('aria-expanded', 'false')
	activeTarget = null
}

function openExplainer(target) {
	const description = target.getAttribute('aria-label')?.trim()
	if (!description) return

	if (activeTarget === target && popover && !popover.hidden) {
		closeExplainer()
		return
	}

	if (activeTarget) activeTarget.setAttribute('aria-expanded', 'false')
	activeTarget = target
	activeTarget.setAttribute('aria-expanded', 'true')

	const panel = ensurePopover()
	panel.querySelector('.ExplainerPopover-title').textContent = getExplainerTitle(target)
	panel.querySelector('.ExplainerPopover-description').textContent = description
	panel.hidden = false
}

function getExplainerTarget(eventTarget) {
	if (!(eventTarget instanceof Element)) return null
	return eventTarget.closest('.tooltipped[aria-label]')
}

function handleClick(event) {
	if (!isMobileExplainerMode()) return

	const target = getExplainerTarget(event.target)
	if (target) {
		openExplainer(target)
		return
	}

	if (popover && !popover.hidden && !popover.contains(event.target)) closeExplainer()
}

function handleKeydown(event) {
	if (event.key === 'Escape' && activeTarget) {
		closeExplainer()
		return
	}
	if (!isMobileExplainerMode() || !['Enter', ' '].includes(event.key)) return

	const target = getExplainerTarget(event.target)
	if (!target) return
	event.preventDefault()
	openExplainer(target)
}

document.addEventListener('click', handleClick)
document.addEventListener('keydown', handleKeydown)
window.addEventListener('resize', () => {
	if (!isMobileExplainerMode()) closeExplainer()
})
