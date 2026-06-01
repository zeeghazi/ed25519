import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
	site: 'https://ed25519.com',
	adapter: cloudflare({ imageService: 'passthrough' }),
	integrations: [sitemap(), mdx()],
	vite: {
		plugins: [tailwindcss()],
	},
})
