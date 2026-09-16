import {defineConfig} from 'astro/config'
import preact from '@astrojs/preact'

const site = process.env.ASTRO_SITE
const base = process.env.ASTRO_BASE

// https://astro.build/config
export default defineConfig({
	...(site ? {site} : {}),
	...(base ? {base} : {}),
	srcDir: './src/ui',
	vite: {
		build: {
			sourcemap: true,
		},
	},
	devToolbar: {
		enabled: false
	},
	integrations: [
		preact(),
	],
})
