import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'

// Cloudflare adapter is deferred to Phase 2 (first server route = contact form).
// Phase 1 is fully static; `dist/` deploys to Cloudflare Pages as-is.
export default defineConfig({
	site: 'https://ed25519.com',
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
})
