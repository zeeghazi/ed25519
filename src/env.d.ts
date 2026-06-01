/// <reference types="astro/client" />

// Worker bindings, read at runtime via `import { env } from 'cloudflare:workers'`
// (the contact API route). Declaring `Cloudflare.Env` merges these into the type
// of that `env` object. Astro v6 removed `Astro.locals.runtime.env`.
declare namespace Cloudflare {
	interface Env {
		SEB: { send(message: unknown): Promise<void> }
		CONTACT_TO_EMAIL: string
	}
}

// Adapter v13 exposes `Astro.locals.cfContext`; `Runtime` is not generic here.
type Runtime = import('@astrojs/cloudflare').Runtime

declare namespace App {
	interface Locals extends Runtime {}
}
