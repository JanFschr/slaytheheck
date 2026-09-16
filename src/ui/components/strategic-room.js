import {createPortal} from 'preact/compat'
import {economy} from '../../content/economy.js'
import {getEventById} from '../../content/events.js'
import {getShopInventory, isShopOfferOwned} from '../../content/shop.js'
import {getCurrRoom} from '../../game/utils-state.js'
import {html} from '../lib.js'

function EventRoomView({gameState, onRun, onContinue}) {
	const room = getCurrRoom(gameState)
	const event = getEventById(room.eventId)

	function runDescriptor(descriptor) {
		const {type, parameter, ...direct} = descriptor
		onRun(type, parameter || direct)
	}

	function choose(choice) {
		for (const action of choice.actions) runDescriptor(action)
	}

	if (room.choice) {
		return html`
			<div class="StrategicRoom">
				<h1>${event.title}</h1>
				<p>The terminal goes quiet. Your choice is locked in.</p>
				<button class="Button Button--primary" onClick=${onContinue}>Continue</button>
			</div>
		`
	}

	return html`
		<div class="StrategicRoom">
			<header>
				<span class="StrategicRoom-kicker">Event</span>
				<h1>${event.title}</h1>
				<p>${event.text}</p>
			</header>
			<div class="StrategicRoom-options">
				${event.choices.map((choice) => {
					const disabled = choice.requiresGold && (gameState.gold || 0) < choice.requiresGold
					return html`
						<button class="StrategicRoom-option" disabled=${disabled} onClick=${() => choose(choice)}>
							<strong>${choice.label}</strong>
							<span>${choice.description}</span>
						</button>
					`
				})}
			</div>
		</div>
	`
}

function MerchantRoomView({gameState, onRun, onContinue}) {
	const room = getCurrRoom(gameState)
	const offers = getShopInventory(gameState)
	const purchased = new Set(room.purchasedOffers || [])
	const usedServices = new Set(room.usedServices || [])
	const gold = gameState.gold || 0
	const canUpgrade = gameState.deck.some((card) => !card.upgraded)

	function chooseCardService(service) {
		const isRemove = service === 'remove'
		onRun('requestChoice', {
			kind: 'cards',
			pile: 'deck',
			prompt: isRemove ? 'Choose a card to remove' : 'Choose a card to upgrade',
			filter: isRemove ? undefined : {upgraded: false},
			min: 1,
			max: 1,
			onResolve: [
				{
					type: 'applyShopCardService',
					parameter: {service, cardId: '$selected'},
				},
			],
		})
	}

	if (room.closed) {
		return html`
			<div class="StrategicRoom">
				<h1>Merchant</h1>
				<p>The shutters roll down behind you.</p>
				<button class="Button Button--primary" onClick=${onContinue}>Continue</button>
			</div>
		`
	}

	return html`
		<div class="StrategicRoom StrategicRoom--merchant">
			<header>
				<span class="StrategicRoom-kicker">Merchant</span>
				<h1>Black-Market Relay</h1>
				<p>Spend gold to sharpen this run. Inventory is fixed by the run seed.</p>
			</header>
			<div class="MerchantGrid">
				${offers.map((offer) => {
					const sold = purchased.has(offer.id)
					const alreadyOwned = isShopOfferOwned(gameState, offer)
					const disabled = sold || alreadyOwned || gold < offer.price
					return html`
						<button class="MerchantOffer" disabled=${disabled} onClick=${() => onRun('buyShopOffer', {offerId: offer.id})}>
							<span class="MerchantOffer-kind">${offer.kind}${offer.slot ? ` · ${offer.slot}` : ''}</span>
							<strong>${offer.icon || ''} ${offer.name}</strong>
							<span>${offer.description}</span>
							<b>${sold ? 'SOLD' : alreadyOwned ? 'OWNED' : `${offer.price} gold`}</b>
						</button>
					`
				})}
			</div>
			<section class="MerchantServices">
				<h2>Services</h2>
				<button
					class="Button"
					disabled=${usedServices.has('remove') || gold < economy.cardRemovePrice || !gameState.deck.length}
					onClick=${() => chooseCardService('remove')}
				>
					Remove a card · ${economy.cardRemovePrice} gold
				</button>
				<button
					class="Button"
					disabled=${usedServices.has('upgrade') || gold < economy.cardUpgradePrice || !canUpgrade}
					onClick=${() => chooseCardService('upgrade')}
				>
					Upgrade a card · ${economy.cardUpgradePrice} gold
				</button>
			</section>
			<button class="Button Button--primary" onClick=${() => onRun('closeMerchant')}>Leave merchant</button>
		</div>
	`
}

function TreasureRoomView({gameState, onRun, onContinue}) {
	const room = getCurrRoom(gameState)
	return html`
		<div class="StrategicRoom">
			<header>
				<span class="StrategicRoom-kicker">Treasure</span>
				<h1>Sealed Cache</h1>
				<p>One cache. No price. The contents are deterministic for this run.</p>
			</header>
			${
				room.claimed
					? html`
						<div class="TreasureResult">
							<strong>+${room.goldReward} gold</strong>
							${room.buildReward ? html`<span>Installed ${room.buildReward}</span>` : null}
						</div>
						<button class="Button Button--primary" onClick=${onContinue}>Continue</button>
					`
					: html`<button class="Button Button--primary" onClick=${() => onRun('claimTreasure')}>Open cache</button>`
			}
		</div>
	`
}

export default function StrategicRoom(props) {
	const room = getCurrRoom(props.gameState)
	if (room.type === 'event') return html`<${EventRoomView} ...${props} />`
	if (room.type === 'merchant') return html`<${MerchantRoomView} ...${props} />`
	if (room.type === 'treasure') return html`<${TreasureRoomView} ...${props} />`
	return null
}

export function StrategicRoomPortal({gameState}) {
	if (!gameState?.dungeon || typeof document === 'undefined') return null
	const room = getCurrRoom(gameState)
	if (!['event', 'merchant', 'treasure'].includes(room.type) || room.dismissed) return null

	const run = (type, parameter) => {
		const runner = globalThis.window?.stw?.run
		if (typeof runner !== 'function') throw new Error('Strategic room host could not access the game action runner')
		return runner(type, parameter)
	}
	const continueToMap = () => {
		run('dismissStrategicRoom')
		requestAnimationFrame(() => {
			const map = document.querySelector('#Map')
			if (!map?.hasAttribute('open')) map?.querySelector(':scope > button')?.click()
		})
	}

	return createPortal(
		html`<div class="StrategicRoom-backdrop"><${StrategicRoom} gameState=${gameState} onRun=${run} onContinue=${continueToMap} /></div>`,
		document.body,
	)
}
