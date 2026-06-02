# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A client-side-only Ed25519 toolkit (https://ed25519.com), a multi-page **Astro 6**
site (migrated from a React SPA for SEO/AdSense). Key generation, signing, and verification
run entirely in the browser — keys never leave the device. Don't add anything that sends key
material off-device.

## Commands

Uses **pnpm**.

    pnpm dev       # Astro dev server
    pnpm build     # production build → dist/ (static)
    pnpm preview   # preview the build
    pnpm check     # astro check (type + content)
    pnpm test      # Vitest unit tests for src/lib
    pnpm format    # Prettier (tabs, single quotes, no semicolons)

## Architecture

- **Crypto:** `src/lib/ed25519.ts` wraps `@noble/ed25519` **v3** using the **async** API
  (`getPublicKeyAsync`/`signAsync`/`verifyAsync`), which uses built-in WebCrypto SHA-512.
  Do NOT import `@noble/hashes` or set `ed.hashes.sha512` — that's only for the sync API.
  `src/lib/hex.ts` handles hex↔bytes; both are unit-tested under `tests/`.
- **Design system:** tokens from `DESIGN.md` live in `src/styles/global.css` as Tailwind v4
  `@theme` variables. Dark mode = a `.dark` class on `<html>` set pre-paint by an inline head
  script in `BaseLayout.astro`; tokens are overridden under `.dark`. The tool/console uses a
  separate set of **fixed** `--color-term-*` tokens so it stays a dark terminal in both themes.
- **Pages:** Astro pages in `src/pages/`; shared chrome in `src/layouts/BaseLayout.astro`;
  components in `src/components/{ui,sections,tool}`. The landing page (`src/pages/index.astro`)
  is tool-first: a slim hero over a tabbed terminal **console** (generate/sign/verify), on one
  continuous grid+glow backdrop, with the footer as a separate block.
- **The tool** (`src/components/tool/*`) is vanilla TS in `.astro` `<script>` blocks — no UI
  framework ships to the browser. All sections AND the chrome (Nav/Footer) share a
  single `max-w-[1200px]` column, so content edges align across every page.

## Hosting

Cloudflare via `@astrojs/cloudflare` (`wrangler.jsonc`). All pages are static except
`src/pages/api/contact.ts` (`prerender = false`), the one server route — it emails the owner
via the Cloudflare Email Routing `send_email` binding (`SEB`). Build emits static assets to
`dist/client/` and the worker to `dist/server/` (the adapter writes a deploy-ready
`dist/server/wrangler.json`; the root `wrangler.jsonc` omits `main` on purpose). The route
reads bindings via `import { env } from 'cloudflare:workers'` — Astro v6 removed
`Astro.locals.runtime.env`. See `docs/DEPLOY.md`.

## Blog

Posts are Markdown in `src/content/blog/`, defined as a Content Layer collection in
`src/content.config.ts`. To add one: copy an existing post, rename the file (filename = slug),
edit frontmatter + body, set `draft: false`. No CLI. See `docs/AUTHORING.md`.

## Specs & plans

Design spec and phased implementation plans live in `docs/superpowers/`.
