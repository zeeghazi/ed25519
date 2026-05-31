# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **client-side-only** Ed25519 cryptographic toolkit (live at https://ed25519.com). It's a
React 19 + TypeScript single-page app built with Vite 7. There is **no backend** — all key
generation, signing, and verification happen in the browser via
[`@noble/ed25519`](https://github.com/paulmillr/noble-ed25519). Keys and secrets never leave
the page. Keep it that way: any feature that would send key material off-device breaks the
core security promise of the app.

The UI is terminal-inspired and walks through the canonical Ed25519 workflow:
**generate → sign → verify**.

## Commands

Uses **pnpm** (`pnpm-lock.yaml` is committed).

```bash
pnpm install        # install dependencies
pnpm dev            # Vite dev server with HMR
pnpm build          # type-check (tsc -b) + production build to dist/
pnpm preview        # serve the production build locally
pnpm lint           # ESLint (flat config, eslint.config.js)
pnpm format         # Prettier --write . (sorts Tailwind classes)
pnpm deploy         # build, then publish dist/ to the gh-pages branch
```

There is no test suite.

## Architecture

- **Entry:** `index.html` (heavy SEO/OpenGraph/JSON-LD `<head>`) loads `src/main.tsx`, which
  mounts the React app and imports `src/index.css`.
- **Page:** `src/pages/HomePage.tsx` is the only page — it renders the terminal header, the
  three workflow components, and the global `<Toaster>` (react-hot-toast).
- **Components** (`src/components/`) — each is a self-contained workflow step holding its own
  state, hex/byte conversion, validation, and toast feedback:
  - `KeyGeneration.tsx` — generates a keypair (private key 64 hex chars, public key 64 hex chars)
  - `MessageSigning.tsx` — signs a message with a private key (signature = 128 hex chars)
  - `SignatureVerification.tsx` — verifies a signature against message + public key

### Crypto setup — important

`@noble/ed25519` v2 ships **without** a hash function, so synchronous Ed25519 needs SHA-512
wired in manually. Each crypto component does this at module scope:

```ts
import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m))
```

This line is currently **duplicated in all three components**. When adding a new component
that calls `ed.sign`/`ed.getPublicKey`/`ed.verify`, you must set `ed.etc.sha512Sync` again or
the call will throw — or refactor it into a shared module imported once.

Keys/signatures are passed around as hex strings and converted to/from `Uint8Array` inline in
each component; messages are encoded with `new TextEncoder()`.

## Styling

Tailwind CSS **v4** via the `@tailwindcss/vite` plugin (configured in `vite.config.ts`) — there
is no `tailwind.config.js`. The aesthetic is a dark terminal theme, with each component
color-coded (keygen = cyan, sign = emerald, verify = violet). `prettier-plugin-tailwindcss`
auto-sorts class names, so run `pnpm format` after editing markup.

## TypeScript config

Project-references layout: `tsconfig.json` only references `tsconfig.app.json` (browser code
under `src/`, strict mode, `noUnusedLocals`/`noUnusedParameters`) and `tsconfig.node.json`
(Vite tooling). Edit `tsconfig.app.json` for app-code settings.

## Deployment

GitHub Pages on the custom domain `ed25519.com`. `pnpm deploy` runs `predeploy` (the build)
then `gh-pages -d dist`, pushing the built `dist/` to the `gh-pages` branch. Because of the
custom domain, the Vite `base` is left as the default `/` (see the commented-out `base` in
`vite.config.ts`). Don't hardcode a `/ed25519` base path — it would break the custom-domain
deploy.
