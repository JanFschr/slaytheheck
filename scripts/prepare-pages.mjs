import {readFile, readdir, writeFile} from 'node:fs/promises'
import {extname, join} from 'node:path'

const distDir = 'dist'
const extensions = new Set(['.html', '.js', '.css'])
const localPrefixes = [
	'images',
	'changelog',
	'collection',
	'debug',
	'deck-builder',
	'manual',
	'map-demo',
	'monsters',
	'sounds',
	'sprites',
	'stats',
	'text',
]

function normalizeBase(value) {
	if (!value || value === '/') return ''
	return `/${value.replace(/^\/+|\/+$/g, '')}`
}

const base = normalizeBase(process.env.ASTRO_BASE)

if (!base) {
	console.log('ASTRO_BASE is empty; no Pages URL rewriting required.')
	process.exit(0)
}

const localPrefixPattern = localPrefixes.join('|')
const rootLocalUrl = new RegExp(`/(?!${base.slice(1)}/)(?=(?:${localPrefixPattern})(?:[/?#]|["'\\x60]|$))`, 'g')
const unresolvedLocalUrl = new RegExp(`/(?!${base.slice(1)}/)(?:${localPrefixPattern})(?:[/?#]|["'\\x60]|$)`)

async function walk(directory) {
	const entries = await readdir(directory, {withFileTypes: true})
	const files = []

	for (const entry of entries) {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) files.push(...(await walk(path)))
		else if (extensions.has(extname(entry.name))) files.push(path)
	}

	return files
}

const files = await walk(distDir)
let changedFiles = 0

for (const file of files) {
	const original = await readFile(file, 'utf8')
	let content = original.replace(rootLocalUrl, `${base}/`)

	// The home route is the only root-only URL we rewrite. Restrict it to HTML
	// attributes so JavaScript path comparisons such as `pathname === '/'` stay intact.
	if (extname(file) === '.html') {
		content = content.replace(/\b(href|src)=(['"])\/\2/g, `$1=$2${base}/$2`)
	}

	if (content !== original) {
		await writeFile(file, content)
		changedFiles += 1
	}
}

const unresolved = []
for (const file of files) {
	const content = await readFile(file, 'utf8')
	if (unresolvedLocalUrl.test(content) || (extname(file) === '.html' && /\b(?:href|src)=(['"])\/\1/.test(content))) {
		unresolved.push(file)
	}
}

if (unresolved.length > 0) {
	throw new Error(`Unresolved root-relative Pages URLs in: ${unresolved.join(', ')}`)
}

console.log(`Prepared ${changedFiles} file(s) for GitHub Pages base ${base}.`)
