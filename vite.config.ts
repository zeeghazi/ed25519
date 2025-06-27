import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
	// for gh pages leave undefined (defaults to /) for custom domain
	// base: '/ed25519',
	plugins: [react(), tailwindcss()],
})
