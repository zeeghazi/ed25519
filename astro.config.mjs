import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ed25519.com',
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
