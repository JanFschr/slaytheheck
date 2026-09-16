/**
 * Resolve a public asset against Astro/Vite's configured base path.
 * This keeps assets working both at domain root and on GitHub Pages subpaths.
 * @param {string} path
 */
export function assetUrl(path) {
	const base = import.meta.env.BASE_URL || '/'
	const normalizedBase = base.endsWith('/') ? base : `${base}/`
	const normalizedPath = String(path).replace(/^\/+/, '')
	return `${normalizedBase}${normalizedPath}`
}

/** @param {string} path */
export function imageUrl(path) {
	return assetUrl(`images/${String(path).replace(/^\/+/, '')}`)
}
