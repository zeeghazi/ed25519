# Deploying ed25519.com to Cloudflare

As of Phase 2 the site uses the **`@astrojs/cloudflare`** adapter. Every page is static
(prerendered) **except** `src/pages/api/contact.ts` (`prerender = false`), the single
server route that powers the contact form. The build therefore emits a Workers-with-assets
bundle, not a plain static folder.

## Build output layout

`pnpm build` produces:

- `dist/client/` — all static assets (HTML, CSS, JS, fonts, sitemap, robots, OG image).
- `dist/server/entry.mjs` — the server worker (serves `/api/contact`, falls back to assets).
- `dist/server/wrangler.json` — a **deploy-ready** config the adapter generates from the
  root `wrangler.jsonc` (it adds `main: entry.mjs`, `assets.directory: ../client`, and
  inherits the `send_email` binding). This is the file `wrangler deploy` / Workers Builds use.

The root **`wrangler.jsonc`** holds the source config (name, compat date, `nodejs_compat`,
the `assets` dir, and the `send_email` `SEB` binding). It intentionally **omits `main`** —
the Cloudflare vite plugin validates `main` at the start of `pnpm build`, before the worker
exists, so setting it there would break clean builds. The adapter fills it in for `dist/server`.

## Build settings

- Framework preset: **Astro**
- Build command: `pnpm build`
- Deploy: connect the repo via **Workers Builds** (Workers & Pages → Create), or run
  `npx wrangler deploy` from `dist/server` / using the generated config. Node 20+ (24 recommended).

## Contact form — Cloudflare Email Routing (free)

The contact route emails the site owner through the `send_email` binding `SEB`. To enable it:

1. Cloudflare dashboard → the `ed25519.com` zone → **Email** → **Email Routing** → enable.
   Cloudflare auto-adds the required MX/TXT records.
2. Add and **verify** a destination address (your inbox) — click the link Cloudflare emails you.
3. In `wrangler.jsonc`, set the `send_email` `destination_address` to that verified address
   (currently the placeholder `hello@ed25519.com`).
4. Set the env var **`CONTACT_TO_EMAIL`** (below) to the same verified address.
5. Ensure the sender domain (`noreply@ed25519.com`) belongs to the verified zone.

The route reads bindings via `import { env } from 'cloudflare:workers'` (Astro v6 removed
`Astro.locals.runtime.env`). **Local note:** sending only works on Cloudflare. Locally the
route still validates input and, with no bindings wired, returns a clear `503` "not configured"
response — that is expected; real sending is verified on deploy.

## Environment variables (Workers/Pages → Settings → Variables)

| Name                  | Value                 | Notes                                 |
| --------------------- | --------------------- | ------------------------------------- |
| `PUBLIC_SITE_URL`     | https://ed25519.com   | canonical / OG base                   |
| `PUBLIC_ADSENSE_ID`   | (your pub-id)         | optional; enables AdSense             |
| `PUBLIC_ANALYTICS_ID` | (GA4 / Plausible id)  | optional                              |
| `CONTACT_TO_EMAIL`    | your verified address | required for the contact form to send |

## Custom domain

Workers & Pages → your project → Custom domains → add `ed25519.com`; follow the records prompt.
