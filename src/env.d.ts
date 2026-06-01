/// <reference types="astro/client" />

interface Env {
	SEB: { send(message: unknown): Promise<void> }
	CONTACT_TO_EMAIL: string
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>

declare namespace App {
	interface Locals extends Runtime {}
}
