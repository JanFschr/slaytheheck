import {html} from '../lib.js'

export default function BuildRewardChooser({rewards, onSelect}) {
	if (!rewards?.length) return null

	function claim(reward) {
		if (onSelect) return onSelect(reward)
		const run = globalThis.window?.stw?.run
		if (typeof run !== 'function') throw new Error('Build reward host could not access the game action runner')
		run('claimBuildReward', {kind: reward.kind, id: reward.id})
	}

	return html`
		<section class="BuildRewardChooser" aria-labelledby="build-reward-title">
			<h3 id="build-reward-title">Choose a build reward</h3>
			<div class="BuildRewardChooser-grid">
				${rewards.map(
					(reward) => html`
						<button
							class="BuildRewardCard"
							data-kind=${reward.kind}
							data-rarity=${reward.rarity}
							onClick=${() => claim(reward)}
						>
							<span class="BuildRewardCard-icon" aria-hidden="true">${reward.icon}</span>
							<span class="BuildRewardCard-kind">${reward.kind === 'equipment' ? reward.slot : 'relic'}</span>
							<strong>${reward.name}</strong>
							<span>${reward.description}</span>
							<small>${reward.rarity}</small>
						</button>
					`,
				)}
			</div>
		</section>
	`
}
