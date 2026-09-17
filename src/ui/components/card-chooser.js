import {createCard} from '../../game/cards.js'
import gsap from '../animations.js'
import {Component, html} from '../lib.js'
import {Card} from './cards.js'

export default class CardChooser extends Component {
	constructor(props) {
		super(props)
		this.state = {
			selectedIndex: null,
		}
	}

	componentDidMount() {
		if (this.props.animate) {
			// Animate all the cards in with a nice animation and staggered delay with gsap
			const cards = this.base.querySelectorAll('.CardBox')
			gsap.effects.dealCards(cards)
		}
	}

	handleCardClick(index) {
		const selectedIndex = this.state.selectedIndex === index ? null : index
		this.setState({selectedIndex})

		if (selectedIndex !== null) {
			requestAnimationFrame(() => {
				const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
				this.base.querySelectorAll('.CardBox')[selectedIndex]?.scrollIntoView({
					behavior: reduceMotion ? 'auto' : 'smooth',
					block: 'nearest',
					inline: 'center',
				})
			})
		}
	}

	handleCardKeyDown(event, index) {
		if (event.key !== 'Enter' && event.key !== ' ') return
		event.preventDefault()
		this.handleCardClick(index)
	}

	handleButtonClick() {
		const {selectedIndex} = this.state
		if (selectedIndex === null) return

		const card = this.props.cards[selectedIndex]
		const cardEl = this.base.querySelector(`[data-id="${card.id}"]`)

		setTimeout(() => {
			this.props.didSelectCard(card)
		}, 300)

		gsap.effects.addCardToDeck(cardEl)
	}

	render(props, state) {
		const {selectedIndex} = state
		const hasUpgrades = props.showUpgrades !== false && props.cards.some((card) => !card.upgraded)
		const showButton = props.buttonLabel !== undefined

		return html`
			<article class="RewardsBox">
				<div class="Cards ${hasUpgrades ? 'Cards--withUpgrades' : ''}">
					${props.cards.map(
						(card, index) =>
							html`<div
								class="CardBox"
								role="button"
								tabIndex="0"
								aria-label=${`Choose ${card.name}`}
								aria-pressed=${selectedIndex === index ? 'true' : 'false'}
								selected=${selectedIndex === index ? '' : null}
								flipped=${hasUpgrades && selectedIndex === index ? '' : null}
								onClick=${() => this.handleCardClick(index)}
								onKeyDown=${(event) => this.handleCardKeyDown(event, index)}
							>
								${Card({card, gameState: props.gameState})}
								${hasUpgrades && Card({card: createCard(card.name, true), gameState: props.gameState})}
							</div>`,
					)}
				</div>
				${
					showButton &&
					html`
					<p center>
						<button
							class="Button Button--primary"
							disabled=${selectedIndex === null}
							onClick=${() => this.handleButtonClick()}
						>
							${props.buttonLabel}
						</button>
					</p>
				`
				}
			</article>
		`
	}
}
