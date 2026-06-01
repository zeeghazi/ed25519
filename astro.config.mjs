import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	site: 'https://ed25519.com',
	vite: {
		plugins: [tailwindcss()],
	},
});
