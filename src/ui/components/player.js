import {
	poison as poisonPower,
	regen as regenPower,
	strength as strengthPower,
	vulnerable as vulnerablePower,
	weak as weakPower,
} from '../../game/powers.js'
import {Component, html} from '../lib.js'

/**
 * @typedef {object} TargetProps
 * @prop {string} type - a string enum "player" or "enemy"?
 * @prop {object} model - the player or monster model
 * @prop {number} model.currentHealth
 * @prop {number} model.maxHealth
 * @prop {number} model.currentEnergy
 * @prop {number} model.maxEnergy
 * @prop {string} name
 */

/**
 * Renders a player
 * @param {TargetProps} props
 */
export const Player = (props) => {
	return html`<${Target} ...${props} type="player" />`
}

const visibleIntentTypes = ['damage', 'block', 'weak', 'vulnerable', 'poison']

function SpecialIntent({label, tooltip}) {
	return html`
		<div class="Target-intent Target-intent--text ${tooltip && 'tooltipped tooltipped-n'}" aria-label=${tooltip}>
			${label}
		</div>
	`
}

export const Monster = (props) => {
	const monster = props.model
	const state = props.gameState
	const intent = monster.intents[monster.nextIntent]

	function MonsterIntent([type, amount]) {
		const weakened = monster.powers.weak
		const vulnerable = state.player.powers.vulnerable

		if (type === 'damage' && weakened) amount = weakPower.use(amount)
		if (type === 'damage' && vulnerable) amount = vulnerablePower.use(amount)

		let tooltip = ''
		if (type === 'damage') tooltip = `Will deal ${amount} damage`
		if (type === 'block') tooltip = `Will block for ${amount}`
		if (type === 'weak') tooltip = `Will apply ${amount} Weak`
		if (type === 'vulnerable') tooltip = `Will apply ${amount} Vulnerable`
		if (type === 'poison') tooltip = `Will apply ${amount} Poison`

		if (type === 'vulnerable' || type === 'weak') amount = undefined

		return html`
			<div class="Target-intent ${tooltip && 'tooltipped tooltipped-n'}" aria-label=${tooltip}>
				<img alt=${type} src=${`/images/${type}.png`} /> ${amount}
			</div>
		`
	}

	const visibleIntents = intent
		? visibleIntentTypes.filter((type) => intent[type]).map((type) => [type, intent[type]])
		: []
	const specialIntents = (intent?.actions || []).flatMap((action) => {
		const parameter = action.parameter || {}
		if (action.type === 'addResource' && parameter.resource) {
			const name = parameter.resource === 'corruption' ? 'Void' : parameter.resource[0].toUpperCase() + parameter.resource.slice(1)
			return [
				{
					label: `${name} +${parameter.amount || 0}`,
					tooltip: `Will add ${parameter.amount || 0} ${name} to your combat resources`,
				},
			]
		}
		if (action.type === 'summon') return [{label: 'Summon', tooltip: 'Will summon another enemy'}]
		return []
	})

	return html`
		<${Target} ...${props} type="enemy" name=${monster.name}>
			${visibleIntents.map((entry) => MonsterIntent(entry))}
			${specialIntents.map((entry) => html`<${SpecialIntent} ...${entry} />`)}
		<//>
	`
}

class Target extends Component {
	componentDidUpdate(prevProps) {
		const lostHealth = prevProps.model.currentHealth - this.props.model.currentHealth
		if (lostHealth > 0) this.setState({lostHealth})
	}

	render({model, type, name, children}, state) {
		const isDead = model.currentHealth < 1
		const hp = isDead ? 0 : model.currentHealth

		return html`
			<div class=${`Target${isDead ? ' Target--isDead' : ''}`} data-type=${type}>
				<header class="Target-header">
					${model.sprite && html`<img-sprite class="Target-sprite" sprite=${model.sprite} scale="2"></img-sprite>`}
					<h3 class="Target-intents">
						<span class="Target-name">${name}</span>
						${children}
					</h3>
				</header>
				<${Healthbar} max=${model.maxHealth} value=${hp} block=${model.block} />
				<${Powers} powers=${model.powers} />
				<div class="Target-combatText Split">
					<${FCT} key=${model.block} value=${model.block} class="FCT FCT--block" />
					<${FCT} key=${hp} value=${state.lostHealth} />
				</div>
			</div>
		`
	}
}

function Healthbar({value, max, block}) {
	return html`
		<div class="Healthbar ${block ? `Healthbar--hasBlock` : ''}">
			<p class="Healthbar-label">
				<span>${value}/${max}</span>
			</p>
			<div class="Healthbar-bar" style=${`width: ${(value / max) * 100}%`}></div>
			<div class="Healthbar-bar Healthbar-blockBar" style=${`width: ${(block / max) * 100}%`}>
				${block > 0 ? block : ''}
			</div>
		</div>
	`
}

const Powers = (props) => {
	return html`
		<div class="Target-powers">
			<${Power} amount=${props.powers.vulnerable} power=${vulnerablePower} />
			<${Power} amount=${props.powers.regen} power=${regenPower} />
			<${Power} amount=${props.powers.weak} power=${weakPower} />
			<${Power} amount=${props.powers.strength} power=${strengthPower} />
			<${Power} amount=${props.powers.poison} power=${poisonPower} />
		</div>
	`
}

const Power = ({power, amount}) => {
	if (!amount) return null
	return html`<span class="tooltipped tooltipped-s" aria-label=${power.description}>
		${power.name} ${amount}
	</span>`
}

function FCT(props) {
	if (!props.value) return html`<p></p>`
	return html`<p class="FCT" ...${props}>${props.value}</p>`
}
