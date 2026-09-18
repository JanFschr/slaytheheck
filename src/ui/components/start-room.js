import {Component, html} from '../lib.js'

export default class StartRoom extends Component {
	render() {
		return html`
			<div class="Container Container--center StartRoom">
				<div class="Box StartRoom-panel">
					<h1 class="StartRoom-title">It begins…</h1>
					<p class="StartRoom-copy">Fight your way through the dungeon, build your deck and defeat the boss at the end.</p>
					<ul class="Options StartRoom-actions">
						<li><button class="Button" onClick=${() => this.props.onContinue()}>Open the map</button></li>
					</ul>
				</div>
			</div>
		`
	}
}
