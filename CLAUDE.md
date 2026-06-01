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
  framework ships to the browser. All sections share a single `max-w-[1100px]` column.

## Hosting

Cloudflare Pages, **static** (no adapter in Phase 1). All pages prerender to `dist/`.
The `@astrojs/cloudflare` adapter + `wrangler.jsonc` are deferred to **Phase 2**, when the
contact form (the first server route) is added. See `docs/DEPLOY.md`.

## Blog (Phase 2)

Posts will be Markdown in `src/content/blog/`. To add one: copy an existing post, rename the
file (filename = slug), edit frontmatter + body, set `draft: false`. No CLI.

## Specs & plans

Design spec and phased implementation plans live in `docs/superpowers/`.
