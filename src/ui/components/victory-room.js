import {getBuildRewards, isBuildRewardEligible} from '../../content/build-rewards.js'
import {getCombatGoldReward} from '../../content/economy.js'
import {getCardRewards} from '../../game/cards.js'
import {createRng, hashSeed} from '../../game/rng.js'
import {getCurrRoom} from '../../game/utils-state.js'
import {html} from '../lib.js'
import BuildRewardChooser from './build-reward-chooser.js'
import CardChooser from './card-chooser.js'

function runRewardAction(type, parameter) {
	const run = globalThis.window?.stw?.run
	if (typeof run !== 'function') throw new Error('Victory reward host could not access the game action runner')
	return run(type, parameter)
}

/**
 * @param {object} props
 * @prop {object} props.gameState
 * @prop {function} props.onContinue
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
	const goldReward = room.goldRewardClaimed || getCombatGoldReward(state)
	const introText = copyRng.pick(victoryRoomIntroTexts)

	return html`
		<div class="Container Container--center">
			<h1 center>Victory!</h1>
			<h2 center>${introText}</h2>

			${
				!room.goldRewardClaimed
					? html`
						<p center>
							<button class="Button Button--primary" onClick=${() => runRewardAction('claimCombatGold')}>
								Collect ${goldReward} gold
							</button>
						</p>
					`
					: html`<p center><strong>+${room.goldRewardClaimed} gold collected.</strong></p>`
			}

			${
				!room.cardRewardClaimed &&
				html`
				<${CardChooser}
					animate
					cards=${rewards}
					didSelectCard=${(card) => runRewardAction('claimCardReward', {card})}
					buttonLabel="Add to deck"
					showUpgrades=${false}
				/>
			`
			}
			${room.cardRewardClaimed ? html`<p center>Card reward added to your deck.</p>` : null}

			${
				buildRewards.length
					? html`<${BuildRewardChooser}
						rewards=${buildRewards}
						onSelect=${(reward) => runRewardAction('claimBuildReward', {kind: reward.kind, id: reward.id})}
					/>`
					: null
			}
			${room.buildRewardClaimed ? html`<p center>Build reward installed.</p>` : null}

			<ul class="Options">
				<button class="Button" disabled=${!room.goldRewardClaimed} onClick=${props.onContinue}>
					${room.goldRewardClaimed ? 'Continue to the next room' : 'Collect gold to continue'}
				</button>
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
