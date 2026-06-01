# Deploying ed25519.com to Cloudflare Pages

Phase 1 is a fully static site, so it deploys to Cloudflare Pages with no adapter.

## Build settings

- Framework preset: **Astro**
- Build command: `pnpm build`
- Build output directory: `dist`
- Node version: 20+ (24 recommended)

## Connect the repo

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select this repo and the deploy branch.
3. Enter the build settings above.

## Environment variables (Pages → Settings → Variables)

| Name                  | Value                | Notes                     |
| --------------------- | -------------------- | ------------------------- |
| `PUBLIC_SITE_URL`     | https://ed25519.com  | canonical / OG base       |
| `PUBLIC_ADSENSE_ID`   | (your pub-id)        | optional; enables AdSense |
| `PUBLIC_ANALYTICS_ID` | (GA4 / Plausible id) | optional                  |

## Custom domain

Pages → Custom domains → add `ed25519.com`; follow the records prompt in the dashboard.

## Cloudflare adapter (Phase 2)

Phase 1 has **no server routes**, so `@astrojs/cloudflare` and `wrangler.jsonc`
are intentionally **not** configured — the static `dist/` is all Pages needs.
They will be added in **Phase 2**, when the contact form (the first on-demand
route) arrives, along with the Cloudflare Email Routing setup.
