import {canPlay} from '../../game/conditions.js'
import {Component, html} from '../lib.js'
import {resolveCardArt} from '../theme-assets.js'

export default class Cards extends Component {
	// props = {gameState: {}, type ''}
	render(props) {
		const cards = props.gameState[props.type]
		return html` <div class="Cards">${cards.map((card) => Card({card, gameState: props.gameState}))}</div> `
	}
}

/**
 * Renders a card
 * @param {object} props
 * @param {import('../../game/cards.js').CARD} props.card
 * @param {import('../../game/actions.js').State} [props.gameState]
 * @returns {?} what?
 */
export function Card(props) {
	const {card, gameState} = props
	const isDisabled = !canPlay(gameState, card)
	const image = resolveCardArt(card)

	return html`
		<stw-card
			class="Card"
			data-card-type=${card.type}
			data-card-target=${card.target}
			data-definition-id=${card.definitionId}
			data-rarity=${card.rarity}
			data-tags=${card.tags?.join(' ') || ''}
			key=${card.id}
			data-id=${card.id}
			upgraded=${card.upgraded ? '' : null}
			disabled=${isDisabled}
		>
			<div class="Card-inner">
				<span class="Card-inspectHint" title="Open card details" aria-hidden="true">VIEW</span>
				<p class="Card-energy EnergyBadge">
					<span>${card.energy}</span>
				</p>
				<figure class="Card-media">
					<img
						src=${image}
						alt=${card.name}
						data-theme-card-art
						data-definition-id=${card.definitionId || ''}
						data-card-name=${card.name || ''}
						data-card-image=${card.image || ''}
					/>
				</figure>
				<p class="Card-type">${card.type}</p>
				<h3 class="Card-name">${card.name}</h3>
				<p class="Card-description">${card.description}</p>
			</div>
		</stw-card>
	`
}
