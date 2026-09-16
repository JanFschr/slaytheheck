import {getBuildRewards, isBuildRewardEligible} from '../../content/build-rewards.js'
import {getCardRewards} from '../../game/cards.js'
import {createRng, hashSeed} from '../../game/rng.js'
import {getCurrRoom} from '../../game/utils-state.js'
import {html} from '../lib.js'
import BuildRewardChooser from './build-reward-chooser.js'
import CardChooser from './card-chooser.js'

/**
 * @param {object} props
 * @prop {function} props.onSelectCard
 * @prop {object} props.gameState
 * @returns {import('preact').VNode}
 */
export default function VictoryRoom(props) {
	const state = props.gameState
	const room = getCurrRoom(state)
	const runSeed = state.seed ?? state.createdAt ?? 'legacy'
	const roomKey = `${state.dungeon.y}:${state.dungeon.x}`
	const rewardRng = createRng(`${runSeed}:reward:${roomKey}`)
	const copyRng = createRng(`${runSeed}:victory-copy:${roomKey}`)
	const rewards = getCardRewards(3, rewardRng.next).map((card, index) => {
		card.id = `reward-${hashSeed(`${runSeed}:${roomKey}:${index}:${card.definitionId}`).toString(36)}`
		return card
	})
	const buildRewards = isBuildRewardEligible(state) && !room.buildRewardClaimed ? getBuildRewards(state, 3) : []
	const introText = copyRng.pick(victoryRoomIntroTexts)

	return html`
		<div class="Container Container--center">
			<h1 center>Victory!</h1>
			<h2 center>${introText}</h2>
			${
				!state.didPickCard &&
				html`
				<${CardChooser}
					animate
					cards=${rewards}
					didSelectCard=${(card) => props.onSelectCard(card)}
					buttonLabel="Add to deck"
					showUpgrades=${false}
				/>
			`
			}
			${buildRewards.length ? html`<${BuildRewardChooser} rewards=${buildRewards} />` : null}
			${room.buildRewardClaimed ? html`<p center>Build reward installed.</p>` : null}
			<ul class="Options">
				<button class="Button" onClick=${props.onContinue}>Continue to the next room</button>
			</ul>
		</div>
	`
}

const victoryRoomIntroTexts = [
	'A win under your belt and new cards on the table. Pick wisely.',
	"Victory's sweet, but a new card? Sweeter.",
	'Monster down, morale up.',
	"Ah, the smell of defeat! Now, how 'bout we celebrate with some fresh cardboard?",
	'Sure, you could skip the rewards. As you please.',
	"You've slain, now you gain. What's it gonna be, hero?",
	"Ah, victory! Don't linger too long; those cards won't pick themselves.",
	'Where the cards are your oyster',
	'Choose a card, any card!',
	"Rewards await. But remember, a deck can't thrive on clutter. Unless you have corruption. Then it can.",
	"Ah, the Victory Room, where today's choices are tomorrow's victories or, you know, defeats.",
	"New cards up for grabs. Don't underestimate the power of fresh cardboard.",
]
