# Ed25519.com Astro Migration — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old React/Vite SPA with an Astro 6 foundation and a fully working, deployable landing page (mesh-gradient hero + the generate/sign/verify crypto tool), themed per `DESIGN.md`, with system-aware dark mode and SEO/AdSense scaffolding.

**Architecture:** Astro 6, static output by default (Cloudflare adapter present for Phase 2's contact function; no server routes in Phase 1, so every page prerenders to static HTML). Crypto logic is vanilla TypeScript in `src/lib/` (zero framework runtime) using `@noble/ed25519` v3's **async** API (built-in WebCrypto SHA-512 — no `@noble/hashes`). Design tokens from `DESIGN.md` live as Tailwind v4 `@theme` variables in `src/styles/global.css`; dark mode is a `.dark` class set pre-paint by an inline head script.

**Tech Stack:** Astro 6.4.x · TypeScript (strict) · Tailwind CSS v4 (`@tailwindcss/vite`) · `@noble/ed25519` ^3 · `@astrojs/cloudflare` · `@astrojs/sitemap` · `@fontsource-variable/geist` + `geist-mono` · Vitest · pnpm.

---

## Conventions for the implementing engineer

- **Branch:** Work on `astro-migration` (already checked out). Commit after every task.
- **Formatting:** The repo's Prettier config uses **tabs, single quotes, no semicolons** (`.prettierrc`). Code in this plan is shown with spaces/semicolons for readability — **run `pnpm format` before each commit** so files match repo style. Don't hand-fight indentation.
- **Package manager:** `pnpm` only (Node 24, pnpm 11 confirmed on this machine).
- **Pinned versions** (latest at planning time — install these exact majors):
    - `astro@^6.4.2`, `@astrojs/cloudflare@^13.6.0`, `@astrojs/sitemap@^3.7.3`
    - `tailwindcss@^4.3.0`, `@tailwindcss/vite@^4.3.0`
    - `@noble/ed25519@^3.1.0`
    - `@fontsource-variable/geist@^5.2.9`, `@fontsource-variable/geist-mono@^5.2.8`
    - `vitest@^3`, `prettier@^3`, `prettier-plugin-astro@^0.14.1`
- **DESIGN.md is the source of truth** for every color/size/radius/shadow token. Token hex values in Task 4 are copied from it.
- **noble v3 API (verified against the v3 `.d.ts`):** `ed.utils.randomSecretKey()` → `Uint8Array`; `ed.getPublicKeyAsync(secret)` → `Promise<Uint8Array>`; `ed.signAsync(message, secret)` → `Promise<Uint8Array>`; `ed.verifyAsync(signature, message, publicKey)` → `Promise<boolean>`. The async functions use a built-in WebCrypto SHA-512 provider — **do not** import `@noble/hashes` and **do not** set `ed.hashes.sha512` (that is only needed for the sync API, which we don't use).
- **Tailwind v4 gotchas** (from the `tailwind-4-docs` skill): `@import "tailwindcss";` not `@tailwind`; `@theme` blocks must be top-level; custom utilities via `@utility`; important modifier at the end (`bg-red-500!`); class names must appear as complete literal strings (no runtime string concatenation of class fragments).
- For `src/lib/*` logic, tests are real Vitest tests (TDD). For `.astro` presentational components (no unit-testable logic), the verification step is `pnpm check` (astro+type check) + `pnpm build` succeeding, since markup isn't meaningfully unit-tested.

---

## File structure (Phase 1)

```
astro.config.mjs              Astro + Cloudflare adapter + sitemap + tailwind vite plugin
wrangler.jsonc                Cloudflare Pages project config (name, compat date)
tsconfig.json                 strict, extends astro/tsconfigs/strict
vitest.config.ts             Vitest (node env) for src/lib unit tests
package.json                  scripts: dev/build/preview/check/format/test
.prettierrc                   + prettier-plugin-astro (keep tabs/singleQuote/no-semi)

src/
├── consts.ts                 SITE config: name, url, description, nav[], socials[] (placeholders)
├── env.d.ts                  astro/client types
├── styles/
│   └── global.css            @import tailwind, @theme tokens, dark variant, base, mesh utility
├── lib/
│   ├── hex.ts                bytesToHex / hexToBytes / isHex
│   ├── ed25519.ts            generateKeypair / signMessage / verifySignature (async, noble v3)
│   ├── clipboard.ts          copyText() + toast() helpers
│   ├── theme.ts              theme init/toggle logic
│   └── seo.ts                resolveSeo() + JSON-LD builders
├── components/
│   ├── ui/
│   │   ├── Button.astro
│   │   ├── Card.astro
│   │   ├── Badge.astro
│   │   ├── MeshGradient.astro
│   │   ├── AdSlot.astro
│   │   ├── Icon.astro
│   │   ├── Toast.astro
│   │   ├── ThemeToggle.astro
│   │   └── Seo.astro
│   ├── sections/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── FeatureGrid.astro
│   │   ├── FaqTeaser.astro
│   │   └── CtaBand.astro
│   └── tool/
│       ├── ToolSection.astro
│       ├── KeygenPanel.astro
│       ├── SignPanel.astro
│       └── VerifyPanel.astro
├── layouts/
│   └── BaseLayout.astro
└── pages/
    ├── index.astro
    └── 404.astro

public/
├── robots.txt
├── ads.txt
├── og/default.png
├── manifest.json               (updated)
└── (existing favicons retained)

tests/
├── hex.test.ts
└── ed25519.test.ts
```

Files **deleted** in Task 1: `src/main.tsx`, `src/pages/HomePage.tsx`, `src/components/{KeyGeneration,MessageSigning,SignatureVerification}.tsx`, `src/index.css`, `src/vite-env.d.ts`, `index.html`, `vite.config.ts`, `eslint.config.js`, `tsconfig.app.json`, `tsconfig.node.json`.

---

## Task 1: Remove old React/Vite app and reset package.json

**Files:**

- Delete: `index.html`, `vite.config.ts`, `eslint.config.js`, `tsconfig.app.json`, `tsconfig.node.json`, `src/main.tsx`, `src/pages/HomePage.tsx`, `src/components/*.tsx`, `src/index.css`, `src/vite-env.d.ts`
- Modify: `package.json`, `tsconfig.json`

- [ ] **Step 1: Delete the old SPA files**

```bash
git rm index.html vite.config.ts eslint.config.js tsconfig.app.json tsconfig.node.json \
  src/main.tsx src/pages/HomePage.tsx \
  src/components/KeyGeneration.tsx src/components/MessageSigning.tsx src/components/SignatureVerification.tsx \
  src/index.css src/vite-env.d.ts
```

- [ ] **Step 2: Replace `package.json` with a clean Astro base**

Overwrite `package.json` (dependency versions are pinned by the installs in later tasks):

```json
{
	"name": "ed25519",
	"type": "module",
	"version": "0.0.0",
	"private": true,
	"scripts": {
		"dev": "astro dev",
		"build": "astro build",
		"preview": "astro preview",
		"check": "astro check",
		"test": "vitest run",
		"test:watch": "vitest",
		"format": "prettier --write ."
	}
}
```

- [ ] **Step 3: Replace `tsconfig.json`**

```json
{
	"extends": "astro/tsconfigs/strict",
	"include": [".astro/types.d.ts", "**/*"],
	"exclude": ["dist"]
}
```

- [ ] **Step 4: Verify the working tree no longer references React**

Run: `grep -rn "react" src/ 2>/dev/null; echo "exit:$?"`
Expected: no matches (grep exit 1).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old React/Vite SPA, reset package.json for Astro"
```

---

## Task 2: Scaffold Astro 6 + Tailwind v4 + Vitest

**Files:**

- Create: `astro.config.mjs`, `vitest.config.ts`, `src/env.d.ts`, temp `src/pages/index.astro`
- Modify: `package.json` (deps added by installs), `.prettierrc`

- [ ] **Step 1: Install Astro + Tailwind + tooling**

```bash
pnpm add astro@^6.4.2
pnpm add -D @tailwindcss/vite@^4.3.0 tailwindcss@^4.3.0 vitest@^3 prettier@^3 prettier-plugin-astro@^0.14.1
```

- [ ] **Step 2: Create `astro.config.mjs`** (adapter + sitemap added in Tasks 3 & 19)

```js
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	site: 'https://ed25519.com',
	vite: {
		plugins: [tailwindcss()],
	},
})
```

- [ ] **Step 3: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 4: Create `vitest.config.ts`** (node env — lib code is framework-free)

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
	},
})
```

- [ ] **Step 5: Add `prettier-plugin-astro` to `.prettierrc`** (keep existing tabs/singleQuote/no-semi/es5)

```json
{
	"plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
	"semi": false,
	"singleQuote": true,
	"trailingComma": "es5",
	"useTabs": true,
	"tabWidth": 4,
	"overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

> `prettier-plugin-tailwindcss` must stay **last** in the plugins array to sort classes correctly.

- [ ] **Step 6: Create a temporary smoke page**

`src/pages/index.astro`:

```astro
---

---

<html lang="en">
	<head><meta charset="utf-8" /><title>scaffold ok</title></head>
	<body><h1 class="text-2xl font-bold">scaffold ok</h1></body>
</html>
```

- [ ] **Step 7: Build to verify scaffold**

Run: `pnpm build`
Expected: build completes, `dist/index.html` produced, no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro 6 + Tailwind v4 + Vitest"
```

---

## Task 3: Add Cloudflare adapter + wrangler config

**Files:**

- Create: `wrangler.jsonc`
- Modify: `astro.config.mjs`

> The adapter is required for Phase 2's contact function. In Phase 1 there are no server routes, so all pages prerender to static HTML; adding the adapter now avoids reconfiguring later. In adapter v13, `astro dev`/`preview` run on the real Workers runtime via the Cloudflare Vite plugin — no extra dev config needed.

- [ ] **Step 1: Install the Cloudflare adapter**

```bash
pnpm add @astrojs/cloudflare@^13.6.0
```

- [ ] **Step 2: Wire the adapter into `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
	site: 'https://ed25519.com',
	adapter: cloudflare(),
	vite: {
		plugins: [tailwindcss()],
	},
})
```

- [ ] **Step 3: Create `wrangler.jsonc`**

```jsonc
{
	"name": "ed25519",
	"compatibility_date": "2026-06-01",
	"compatibility_flags": ["nodejs_compat"],
	"pages_build_output_dir": "./dist",
}
```

- [ ] **Step 4: Build with the adapter**

Run: `pnpm build`
Expected: build completes. With no `prerender = false` routes, output is fully static under `dist/`.

> If the build errors because there are zero on-demand routes, that's acceptable to resolve by leaving the adapter configured — the static pages still emit. If a hard error occurs, re-run after Task 17 (real pages exist). Note any such ordering issue in the task checkbox.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Cloudflare adapter + wrangler config"
```

---

## Task 4: Design tokens — `src/styles/global.css` from DESIGN.md

**Files:**

- Create: `src/styles/global.css`
- Modify: temp `src/pages/index.astro` (to exercise the styles)

- [ ] **Step 1: Write the token + base stylesheet**

Create `src/styles/global.css`. Values copied from `DESIGN.md`; dark-mode values invert the surface/text ladder.

```css
@import 'tailwindcss';

/* Dark mode driven by a `.dark` class on <html> (set pre-paint by inline script). */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
	/* ---- Light-mode semantic colors (DESIGN.md) ---- */
	--color-canvas: #ffffff;
	--color-canvas-soft: #fafafa;
	--color-canvas-soft-2: #f5f5f5;
	--color-ink: #171717;
	--color-body: #4d4d4d;
	--color-mute: #888888;
	--color-on-primary: #ffffff;
	--color-hairline: #ebebeb;
	--color-hairline-strong: #a1a1a1;

	--color-link: #0070f3;
	--color-link-deep: #0761d1;
	--color-error: #ee0000;
	--color-warning: #f5a623;
	--color-success: #0070f3;

	/* Brand gradient stops (hero only) */
	--color-grad-develop-start: #007cf0;
	--color-grad-develop-end: #00dfd8;
	--color-grad-preview-start: #7928ca;
	--color-grad-preview-end: #ff0080;
	--color-grad-ship-start: #ff4d4d;
	--color-grad-ship-end: #f9cb28;

	/* ---- Fonts ---- */
	--font-sans: 'Geist Variable', Inter, system-ui, -apple-system, sans-serif;
	--font-mono:
		'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;

	/* ---- Radii (DESIGN.md) ---- */
	--radius-xs: 4px;
	--radius-sm: 6px;
	--radius-md: 8px;
	--radius-lg: 12px;
	--radius-xl: 16px;
	--radius-pill: 100px;

	/* ---- Stacked-shadow elevation (DESIGN.md Levels 1-5) ---- */
	--shadow-e1: inset 0 0 0 1px #00000014;
	--shadow-e2:
		0px 1px 1px #00000005, 0px 2px 2px #0000000a, inset 0 0 0 1px #00000014;
	--shadow-e3:
		0px 2px 2px #0000000a, 0px 8px 8px -8px #0000000a,
		inset 0 0 0 1px #00000014;
	--shadow-e4:
		0px 2px 2px #0000000a, 0px 8px 16px -4px #0000000a,
		inset 0 0 0 1px #00000014;
	--shadow-e5:
		0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a,
		0px 24px 32px -8px #0000000f, inset 0 0 0 1px #00000014;
}

/* Dark-mode token overrides (polarity-flipped surface/text ladder). */
.dark {
	--color-canvas: #0a0a0a;
	--color-canvas-soft: #111111;
	--color-canvas-soft-2: #181818;
	--color-ink: #ededed;
	--color-body: #a1a1a1;
	--color-mute: #707070;
	--color-on-primary: #0a0a0a;
	--color-hairline: #2a2a2a;
	--color-hairline-strong: #444444;
	--color-link: #3291ff;
	--color-link-deep: #0070f3;
	--shadow-e1: inset 0 0 0 1px #ffffff14;
	--shadow-e2: 0px 1px 1px #00000040, inset 0 0 0 1px #ffffff14;
	--shadow-e3: 0px 2px 8px -2px #00000060, inset 0 0 0 1px #ffffff14;
	--shadow-e4: 0px 8px 16px -4px #00000070, inset 0 0 0 1px #ffffff14;
	--shadow-e5: 0px 24px 32px -8px #00000080, inset 0 0 0 1px #ffffff1f;
}

@layer base {
	html {
		background-color: var(--color-canvas-soft);
		color: var(--color-ink);
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
	}
	::selection {
		background-color: #171717;
		color: #f2f2f2;
	}
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation-duration: 0.01ms !important;
			transition-duration: 0.01ms !important;
		}
	}
}

/* Display type scale — sentence-case, aggressive negative tracking (DESIGN.md). */
@utility display-xl {
	font-weight: 600;
	font-size: 48px;
	line-height: 48px;
	letter-spacing: -2.4px;
}
@utility display-lg {
	font-weight: 600;
	font-size: 32px;
	line-height: 40px;
	letter-spacing: -1.28px;
}
@utility display-md {
	font-weight: 600;
	font-size: 24px;
	line-height: 32px;
	letter-spacing: -0.96px;
}

/* Brand mesh gradient — hero scale only. Never miniaturise (DESIGN.md). */
@utility mesh-gradient {
	background-color: var(--color-grad-develop-start);
	background-image:
		radial-gradient(
			at 20% 20%,
			var(--color-grad-develop-end) 0px,
			transparent 50%
		),
		radial-gradient(
			at 80% 0%,
			var(--color-grad-preview-start) 0px,
			transparent 50%
		),
		radial-gradient(
			at 70% 50%,
			var(--color-grad-preview-end) 0px,
			transparent 50%
		),
		radial-gradient(
			at 0% 70%,
			var(--color-grad-ship-start) 0px,
			transparent 50%
		),
		radial-gradient(
			at 90% 80%,
			var(--color-grad-ship-end) 0px,
			transparent 50%
		);
}
```

- [ ] **Step 2: Exercise the styles from the smoke page**

Edit `src/pages/index.astro` frontmatter to add `import '../styles/global.css';` and put `<p class="display-md mesh-gradient">tokens ok</p>` in the body.

Run: `pnpm build`
Expected: build succeeds. Spot check: `grep -rl "mesh-gradient" dist/ | head` finds the bundled CSS.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: design tokens + base styles from DESIGN.md (Tailwind v4 @theme)"
```

---

## Task 5: Self-host Geist + Geist Mono fonts

**Files:**

- Modify: `src/styles/global.css`

- [ ] **Step 1: Install the variable fonts**

```bash
pnpm add @fontsource-variable/geist@^5.2.9 @fontsource-variable/geist-mono@^5.2.8
```

- [ ] **Step 2: Import the fonts at the very top of `src/styles/global.css`** (above `@import 'tailwindcss';`)

```css
@import '@fontsource-variable/geist';
@import '@fontsource-variable/geist-mono';
@import 'tailwindcss';
```

> The `--font-sans`/`--font-mono` tokens (Task 4) already reference `'Geist Variable'` / `'Geist Mono Variable'`, which are the family names these packages register.

- [ ] **Step 3: Verify fonts bundle**

Run: `pnpm build`
Expected: build succeeds; `find dist -name "*.woff2" | head` lists font assets.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: self-host Geist + Geist Mono variable fonts"
```

---

## Task 6: Site config — `src/consts.ts`

**Files:**

- Create: `src/consts.ts`

- [ ] **Step 1: Write the site config (placeholders for identity)**

```ts
export const SITE = {
	name: 'Ed25519.com',
	title: 'Ed25519 Crypto Suite — Generate, Sign & Verify',
	description:
		'Free, in-browser Ed25519 tools: generate keypairs, sign messages, and verify signatures. RFC 8032 EdDSA. Keys never leave your device.',
	url: 'https://ed25519.com',
	locale: 'en_US',
	author: 'Ed25519.com',
	email: 'hello@ed25519.com', // PLACEHOLDER — replace before launch
	twitter: '@ed25519', // PLACEHOLDER
} as const

export const NAV_LINKS = [
	{ label: 'Tool', href: '/#tool' },
	{ label: 'Blog', href: '/blog' },
	{ label: 'FAQ', href: '/faq' },
	{ label: 'About', href: '/about' },
] as const

export const SOCIAL_LINKS = [
	{ label: 'GitHub', href: 'https://github.com/' }, // PLACEHOLDER
] as const

export const FOOTER_SECTIONS = [
	{
		title: 'Tools',
		links: [
			{ label: 'Generate keys', href: '/#keygen' },
			{ label: 'Sign message', href: '/#sign' },
			{ label: 'Verify signature', href: '/#verify' },
		],
	},
	{
		title: 'Learn',
		links: [
			{ label: 'Blog', href: '/blog' },
			{ label: 'FAQ', href: '/faq' },
			{ label: 'About', href: '/about' },
		],
	},
	{
		title: 'Legal',
		links: [
			{ label: 'Privacy', href: '/privacy' },
			{ label: 'Terms', href: '/terms' },
			{ label: 'Contact', href: '/contact' },
		],
	},
] as const
```

> Phase 2 routes (`/blog`, `/faq`, `/about`, `/privacy`, `/terms`, `/contact`) don't exist yet; links are intentionally final so Nav/Footer don't change later. They 404 until Phase 2 — acceptable for Phase 1 internal review.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: site config + nav/footer link data"
```

---

## Task 7: `src/lib/hex.ts` (TDD)

**Files:**

- Create: `src/lib/hex.ts`, `tests/hex.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/hex.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { bytesToHex, hexToBytes, isHex } from '../src/lib/hex'

describe('hex', () => {
	it('bytesToHex encodes bytes as lowercase hex', () => {
		expect(bytesToHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe(
			'00010f10ff'
		)
	})

	it('hexToBytes decodes hex into bytes', () => {
		expect(Array.from(hexToBytes('00010f10ff'))).toEqual([
			0, 1, 15, 16, 255,
		])
	})

	it('round-trips', () => {
		const bytes = new Uint8Array([42, 7, 200, 99, 1])
		expect(Array.from(hexToBytes(bytesToHex(bytes)))).toEqual(
			Array.from(bytes)
		)
	})

	it('hexToBytes strips whitespace', () => {
		expect(Array.from(hexToBytes(' 00 ff '))).toEqual([0, 255])
	})

	it('hexToBytes rejects odd-length input', () => {
		expect(() => hexToBytes('abc')).toThrow()
	})

	it('hexToBytes rejects non-hex characters', () => {
		expect(() => hexToBytes('zz')).toThrow()
	})

	it('isHex validates length and charset', () => {
		expect(isHex('00ff', 4)).toBe(true)
		expect(isHex('00ff', 6)).toBe(false)
		expect(isHex('zzzz', 4)).toBe(false)
	})
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `pnpm test`
Expected: FAIL (`Cannot find module '../src/lib/hex'`).

- [ ] **Step 3: Implement `src/lib/hex.ts`**

```ts
export function bytesToHex(bytes: Uint8Array): string {
	let hex = ''
	for (const b of bytes) hex += b.toString(16).padStart(2, '0')
	return hex
}

export function hexToBytes(hex: string): Uint8Array {
	const clean = hex.replace(/\s/g, '')
	if (clean.length % 2 !== 0) {
		throw new Error('Hex string must have an even number of characters')
	}
	if (!/^[0-9a-fA-F]*$/.test(clean)) {
		throw new Error('Hex string contains non-hex characters')
	}
	const out = new Uint8Array(clean.length / 2)
	for (let i = 0; i < out.length; i++) {
		out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
	}
	return out
}

export function isHex(value: string, expectedLength?: number): boolean {
	const clean = value.replace(/\s/g, '')
	if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) return false
	if (expectedLength !== undefined && clean.length !== expectedLength)
		return false
	return true
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `pnpm test`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: hex encode/decode helpers (TDD)"
```

---

## Task 8: `src/lib/ed25519.ts` (TDD) — noble v3 async wrapper

**Files:**

- Create: `src/lib/ed25519.ts`, `tests/ed25519.test.ts`

> **noble v3 API (verified):** async path uses built-in WebCrypto SHA-512. Use `ed.utils.randomSecretKey()`, `ed.getPublicKeyAsync()`, `ed.signAsync()`, `ed.verifyAsync()`. Do NOT import `@noble/hashes` or set `ed.hashes.sha512`. Step 0 confirms the names at install time as a guard.

- [ ] **Step 0: Install and confirm the v3 export names**

```bash
pnpm add @noble/ed25519@^3.1.0
node -e "import('@noble/ed25519').then(ed=>console.log({utils:Object.keys(ed.utils),hasAsync:['getPublicKeyAsync','signAsync','verifyAsync'].every(k=>typeof ed[k]==='function')}))"
```

Expected: `utils` array contains `randomSecretKey`; `hasAsync: true`.

- [ ] **Step 1: Write failing tests**

`tests/ed25519.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
	generateKeypair,
	signMessage,
	verifySignature,
} from '../src/lib/ed25519'

describe('ed25519', () => {
	it('generates a 64-hex private key and 64-hex public key', async () => {
		const { privateKeyHex, publicKeyHex } = await generateKeypair()
		expect(privateKeyHex).toMatch(/^[0-9a-f]{64}$/)
		expect(publicKeyHex).toMatch(/^[0-9a-f]{64}$/)
		expect(privateKeyHex).not.toBe(publicKeyHex)
	})

	it('signs and verifies a round-trip', async () => {
		const { privateKeyHex, publicKeyHex } = await generateKeypair()
		const sig = await signMessage('hello noble', privateKeyHex)
		expect(sig).toMatch(/^[0-9a-f]{128}$/)
		expect(await verifySignature(sig, 'hello noble', publicKeyHex)).toBe(
			true
		)
	})

	it('fails verification when the message is altered', async () => {
		const { privateKeyHex, publicKeyHex } = await generateKeypair()
		const sig = await signMessage('original', privateKeyHex)
		expect(await verifySignature(sig, 'tampered', publicKeyHex)).toBe(false)
	})

	it('rejects a private key that is not 64 hex chars', async () => {
		await expect(signMessage('x', 'deadbeef')).rejects.toThrow(/64 hex/)
	})

	it('rejects a public key that is not 64 hex chars', async () => {
		await expect(
			verifySignature('00'.repeat(64), 'x', 'abc')
		).rejects.toThrow(/64 hex/)
	})

	it('rejects a signature that is not 128 hex chars', async () => {
		const { publicKeyHex } = await generateKeypair()
		await expect(
			verifySignature('dead', 'x', publicKeyHex)
		).rejects.toThrow(/128 hex/)
	})
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `pnpm test`
Expected: FAIL (`Cannot find module '../src/lib/ed25519'`).

- [ ] **Step 3: Implement `src/lib/ed25519.ts`**

```ts
import * as ed from '@noble/ed25519'
import { bytesToHex, hexToBytes, isHex } from './hex'

const KEY_HEX_LEN = 64 // 32 bytes
const SIG_HEX_LEN = 128 // 64 bytes

export interface Keypair {
	privateKeyHex: string
	publicKeyHex: string
}

export async function generateKeypair(): Promise<Keypair> {
	const secret = ed.utils.randomSecretKey()
	const publicKey = await ed.getPublicKeyAsync(secret)
	return {
		privateKeyHex: bytesToHex(secret),
		publicKeyHex: bytesToHex(publicKey),
	}
}

export async function signMessage(
	message: string,
	privateKeyHex: string
): Promise<string> {
	if (!isHex(privateKeyHex, KEY_HEX_LEN)) {
		throw new Error('Private key must be 64 hex characters (32 bytes)')
	}
	const secret = hexToBytes(privateKeyHex)
	const msg = new TextEncoder().encode(message)
	const sig = await ed.signAsync(msg, secret)
	return bytesToHex(sig)
}

export async function verifySignature(
	signatureHex: string,
	message: string,
	publicKeyHex: string
): Promise<boolean> {
	if (!isHex(publicKeyHex, KEY_HEX_LEN)) {
		throw new Error('Public key must be 64 hex characters (32 bytes)')
	}
	if (!isHex(signatureHex, SIG_HEX_LEN)) {
		throw new Error('Signature must be 128 hex characters (64 bytes)')
	}
	const sig = hexToBytes(signatureHex)
	const pub = hexToBytes(publicKeyHex)
	const msg = new TextEncoder().encode(message)
	try {
		return await ed.verifyAsync(sig, msg, pub)
	} catch {
		return false // malformed-but-correct-length input → invalid, not an exception
	}
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `pnpm test`
Expected: PASS (6 tests). If Step 0 reported a different export name, substitute it consistently and re-run.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: ed25519 generate/sign/verify wrapper, noble v3 async (TDD)"
```

---

## Task 9: `src/lib/clipboard.ts` + `Toast` component

**Files:**

- Create: `src/lib/clipboard.ts`, `src/components/ui/Toast.astro`

- [ ] **Step 1: Implement `src/lib/clipboard.ts`**

```ts
export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}

export function toast(
	message: string,
	type: 'success' | 'error' = 'success'
): void {
	window.dispatchEvent(
		new CustomEvent('toast', { detail: { message, type } })
	)
}
```

- [ ] **Step 2: Implement `src/components/ui/Toast.astro`**

```astro
---
// Fixed toast region. Other scripts call toast() from lib/clipboard, which dispatches
// a 'toast' CustomEvent that this listener renders.
---

<div
	id="toast-region"
	aria-live="polite"
	aria-atomic="true"
	class="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2"
>
</div>

<script>
	type ToastDetail = { message: string; type?: 'success' | 'error' }
	const region = document.getElementById('toast-region')
	window.addEventListener('toast', (e) => {
		if (!region) return
		const { message, type = 'success' } = (e as CustomEvent<ToastDetail>)
			.detail
		const el = document.createElement('div')
		el.setAttribute('role', 'status')
		el.className =
			'pointer-events-auto rounded-md border px-3 py-2 font-mono text-sm shadow-[var(--shadow-e4)] ' +
			(type === 'error'
				? 'border-error/40 bg-canvas text-error'
				: 'border-hairline bg-canvas text-ink')
		el.textContent = message
		region.appendChild(el)
		setTimeout(() => {
			el.style.transition = 'opacity 200ms'
			el.style.opacity = '0'
			setTimeout(() => el.remove(), 220)
		}, 2600)
	})
</script>
```

- [ ] **Step 3: Verify it type-checks**

Run: `pnpm check`
Expected: no errors (Toast unused so far; that's fine).

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: clipboard helper + toast notification component"
```

---

## Task 10: Theme logic + `ThemeToggle`

**Files:**

- Create: `src/lib/theme.ts`, `src/components/ui/ThemeToggle.astro`

> The render-blocking no-FOUC init script lives in `BaseLayout` `<head>` (Task 11). This module powers the toggle button.

- [ ] **Step 1: Implement `src/lib/theme.ts`**

```ts
export type Theme = 'light' | 'dark'

const KEY = 'theme'

export function toggleTheme(): Theme {
	const next: Theme = document.documentElement.classList.contains('dark')
		? 'light'
		: 'dark'
	localStorage.setItem(KEY, next)
	document.documentElement.classList.toggle('dark', next === 'dark')
	return next
}
```

- [ ] **Step 2: Implement `src/components/ui/ThemeToggle.astro`**

```astro
---

---

<button
	id="theme-toggle"
	type="button"
	aria-label="Toggle dark mode"
	class="border-hairline bg-canvas text-ink hover:bg-canvas-soft-2 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
>
	<svg
		class="h-4 w-4 dark:hidden"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path>
	</svg>
	<svg
		class="hidden h-4 w-4 dark:block"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="4"></circle><path
			stroke-linecap="round"
			d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
		></path>
	</svg>
</button>

<script>
	import { toggleTheme } from '../../lib/theme'
	document
		.getElementById('theme-toggle')
		?.addEventListener('click', () => toggleTheme())
</script>
```

- [ ] **Step 3: Verify type-check**

Run: `pnpm check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: theme logic + dark-mode toggle button"
```

---

## Task 11: `src/lib/seo.ts` + `Seo.astro` + `BaseLayout.astro`

**Files:**

- Create: `src/lib/seo.ts`, `src/components/ui/Seo.astro`, `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Implement `src/lib/seo.ts`**

```ts
import { SITE } from '../consts'

export interface SeoInput {
	title?: string
	description?: string
	path?: string // e.g. '/faq'
	ogImage?: string
	noindex?: boolean
}

export interface ResolvedSeo {
	title: string
	description: string
	canonical: string
	ogImage: string
	noindex: boolean
}

export function resolveSeo(input: SeoInput = {}): ResolvedSeo {
	const path = input.path ?? '/'
	return {
		title: input.title ? `${input.title} — ${SITE.name}` : SITE.title,
		description: input.description ?? SITE.description,
		canonical: new URL(path, SITE.url).href,
		ogImage: new URL(input.ogImage ?? '/og/default.png', SITE.url).href,
		noindex: input.noindex ?? false,
	}
}

export function webApplicationJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: SITE.name,
		url: SITE.url,
		applicationCategory: 'SecurityApplication',
		operatingSystem: 'Web Browser',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		description: SITE.description,
	}
}

export function websiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE.name,
		url: SITE.url,
	}
}
```

> `/og/default.png` is created in Task 19. Until then it only 404s on a social scrape, not in the build.

- [ ] **Step 2: Implement `src/components/ui/Seo.astro`**

```astro
---
import { resolveSeo, type SeoInput } from '../../lib/seo'
import { SITE } from '../../consts'

interface Props extends SeoInput {
	jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}
const { jsonLd, ...seoInput } = Astro.props
const seo = resolveSeo(seoInput)
const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []
---

<title>{seo.title}</title>
<meta name="description" content={seo.description} />
<link rel="canonical" href={seo.canonical} />
{seo.noindex && <meta name="robots" content="noindex, nofollow" />}

<meta property="og:type" content="website" />
<meta property="og:site_name" content={SITE.name} />
<meta property="og:title" content={seo.title} />
<meta property="og:description" content={seo.description} />
<meta property="og:url" content={seo.canonical} />
<meta property="og:image" content={seo.ogImage} />
<meta property="og:locale" content={SITE.locale} />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={seo.title} />
<meta name="twitter:description" content={seo.description} />
<meta name="twitter:image" content={seo.ogImage} />

{
	blocks.map((b) => (
		<script type="application/ld+json" set:html={JSON.stringify(b)} />
	))
}
```

- [ ] **Step 3: Implement `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css'
import Seo from '../components/ui/Seo.astro'
import Nav from '../components/sections/Nav.astro'
import Footer from '../components/sections/Footer.astro'
import Toast from '../components/ui/Toast.astro'
import type { SeoInput } from '../lib/seo'

interface Props extends SeoInput {
	jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}
const props = Astro.props
const adsenseId = import.meta.env.PUBLIC_ADSENSE_ID
const analyticsId = import.meta.env.PUBLIC_ANALYTICS_ID
---

<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<link rel="manifest" href="/manifest.json" />
		<meta
			name="theme-color"
			content="#ffffff"
			media="(prefers-color-scheme: light)"
		/>
		<meta
			name="theme-color"
			content="#0a0a0a"
			media="(prefers-color-scheme: dark)"
		/>

		{/* No-FOUC theme init — must run before paint. */}
		<script is:inline>
			;(function () {
				try {
					var t = localStorage.getItem('theme')
					if (t !== 'light' && t !== 'dark') {
						t = window.matchMedia('(prefers-color-scheme: dark)')
							.matches
							? 'dark'
							: 'light'
					}
					if (t === 'dark')
						document.documentElement.classList.add('dark')
				} catch (e) {}
			})()
		</script>

		<Seo {...props} />

		{
			adsenseId && (
				<script
					async
					src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
					crossorigin="anonymous"
				/>
			)
		}
		{
			analyticsId && (
				<script
					async
					src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
				/>
			)
		}
	</head>
	<body class="bg-canvas-soft text-ink min-h-screen">
		<Nav />
		<main>
			<slot />
		</main>
		<Footer />
		<Toast />
	</body>
</html>
```

- [ ] **Step 4: Type-check** (Nav/Footer don't exist yet — expected failures only)

Run: `pnpm check`
Expected: errors limited to missing `Nav.astro`/`Footer.astro`. Resolved in Tasks 13–14.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: SEO module + Seo component + BaseLayout (head, no-FOUC, ad/analytics gates)"
```

---

## Task 12: UI primitives — Button, Card, Badge, MeshGradient, AdSlot, Icon

**Files:**

- Create: `src/components/ui/Button.astro`, `Card.astro`, `Badge.astro`, `MeshGradient.astro`, `AdSlot.astro`, `Icon.astro`

- [ ] **Step 1: `Button.astro`**

```astro
---
interface Props {
	variant?: 'primary' | 'secondary'
	href?: string
	type?: 'button' | 'submit'
	class?: string
	id?: string
}
const {
	variant = 'primary',
	href,
	type = 'button',
	class: cls = '',
	id,
} = Astro.props
const base =
	'inline-flex h-11 items-center justify-center gap-2 rounded-pill px-5 text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const styles =
	variant === 'primary'
		? 'bg-ink text-on-primary hover:bg-ink/90'
		: 'bg-canvas text-ink border border-hairline hover:bg-canvas-soft-2'
const klass = `${base} ${styles} ${cls}`
---

{
	href ? (
		<a href={href} class={klass} id={id}>
			<slot />
		</a>
	) : (
		<button type={type} class={klass} id={id}>
			<slot />
		</button>
	)
}
```

- [ ] **Step 2: `Card.astro`**

```astro
---
interface Props {
	elevation?: 1 | 2 | 3 | 4
	class?: string
	id?: string
}
const { elevation = 3, class: cls = '', id } = Astro.props
const shadow = {
	1: 'shadow-[var(--shadow-e1)]',
	2: 'shadow-[var(--shadow-e2)]',
	3: 'shadow-[var(--shadow-e3)]',
	4: 'shadow-[var(--shadow-e4)]',
}[elevation]
---

<div id={id} class={`rounded-md bg-canvas p-6 ${shadow} ${cls}`}><slot /></div>
```

- [ ] **Step 3: `Badge.astro`**

```astro
---
interface Props {
	class?: string
}
const { class: cls = '' } = Astro.props
---

<span
	class={`inline-flex items-center rounded-full bg-canvas-soft px-2 py-0.5 font-mono text-xs text-body ${cls}`}
	><slot /></span
>
```

- [ ] **Step 4: `MeshGradient.astro`**

```astro
---
interface Props {
	class?: string
}
const { class: cls = '' } = Astro.props
---

<div
	aria-hidden="true"
	class={`mesh-gradient pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl ${cls}`}
>
</div>
```

- [ ] **Step 5: `AdSlot.astro`**

```astro
---
interface Props {
	slot?: string
	minHeight?: number
	class?: string
}
const { slot, minHeight = 280, class: cls = '' } = Astro.props
const adsenseId = import.meta.env.PUBLIC_ADSENSE_ID
---

<div
	class={`mx-auto w-full max-w-3xl ${cls}`}
	style={`min-height:${minHeight}px`}
>
	{
		adsenseId ? (
			<>
				<ins
					class="adsbygoogle block"
					style={`display:block;min-height:${minHeight}px`}
					data-ad-client={adsenseId}
					data-ad-slot={slot}
					data-ad-format="auto"
					data-full-width-responsive="true"
				/>
				<script is:inline>
					(adsbygoogle = window.adsbygoogle || []).push({});
				</script>
			</>
		) : (
			<div class="border-hairline text-mute flex h-full min-h-[inherit] items-center justify-center rounded-md border border-dashed text-xs">
				Advertisement
			</div>
		)
	}
</div>
```

- [ ] **Step 6: `Icon.astro`**

```astro
---
interface Props {
	name: 'key' | 'sign' | 'verify' | 'shield' | 'arrow'
	class?: string
}
const { name, class: cls = 'h-5 w-5' } = Astro.props
const paths: Record<string, string> = {
	key: 'M15 7a4 4 0 1 0-3.9 5l-1.6 1.6V16H8v2H6v2H3v-3l6.1-6.1A4 4 0 0 0 15 7Z',
	sign: 'M4 20h16M4 16l9-9 4 4-9 9H4v-4Z',
	verify: 'M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
	shield: 'M12 3l8 3v6c0 4.4-3.4 7.8-8 9-4.6-1.2-8-4.6-8-9V6l8-3Z',
	arrow: 'M5 12h14M13 6l6 6-6 6',
}
---

<svg
	class={cls}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	aria-hidden="true"
>
	<path stroke-linecap="round" stroke-linejoin="round" d={paths[name]}></path>
</svg>
```

- [ ] **Step 7: Type-check** (still expects Nav/Footer — ignore those two)

Run: `pnpm check`
Expected: only the known missing Nav/Footer errors from Task 11.

- [ ] **Step 8: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: UI primitives (Button, Card, Badge, MeshGradient, AdSlot, Icon)"
```

---

## Task 13: `Nav.astro` (responsive, mobile overlay)

**Files:**

- Create: `src/components/sections/Nav.astro`

- [ ] **Step 1: Implement `Nav.astro`**

```astro
---
import { SITE, NAV_LINKS } from '../../consts'
import ThemeToggle from '../ui/ThemeToggle.astro'
import Button from '../ui/Button.astro'
---

<header
	class="border-hairline bg-canvas/80 sticky top-0 z-40 border-b backdrop-blur"
>
	<nav
		class="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6"
	>
		<a href="/" class="text-ink font-mono text-sm font-medium"
			>{SITE.name}</a
		>

		<ul class="hidden items-center gap-1 md:flex">
			{
				NAV_LINKS.map((l) => (
					<li>
						<a
							href={l.href}
							class="text-body hover:bg-canvas-soft-2 hover:text-ink rounded-full px-3 py-2 text-sm transition-colors"
						>
							{l.label}
						</a>
					</li>
				))
			}
		</ul>

		<div class="flex items-center gap-2">
			<ThemeToggle />
			<div class="hidden md:block">
				<Button href="/#tool" variant="primary" class="h-9 px-4 text-sm"
					>Open tool</Button
				>
			</div>
			<button
				id="nav-open"
				type="button"
				aria-label="Open menu"
				aria-expanded="false"
				aria-controls="mobile-menu"
				class="border-hairline inline-flex h-9 w-9 items-center justify-center rounded-full border md:hidden"
			>
				<svg
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
					><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"
					></path></svg
				>
			</button>
		</div>
	</nav>

	<div id="mobile-menu" hidden class="bg-canvas fixed inset-0 z-50 md:hidden">
		<div class="flex h-16 items-center justify-between px-4">
			<span class="font-mono text-sm font-medium">{SITE.name}</span>
			<button
				id="nav-close"
				type="button"
				aria-label="Close menu"
				class="border-hairline inline-flex h-9 w-9 items-center justify-center rounded-full border"
			>
				<svg
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
					><path stroke-linecap="round" d="M6 6l12 12M18 6 6 18"
					></path></svg
				>
			</button>
		</div>
		<ul class="flex flex-col gap-1 px-4 pt-4">
			{
				NAV_LINKS.map((l) => (
					<li>
						<a
							href={l.href}
							class="text-ink hover:bg-canvas-soft-2 block rounded-md px-3 py-3 text-lg"
						>
							{l.label}
						</a>
					</li>
				))
			}
		</ul>
	</div>
</header>

<script>
	const menu = document.getElementById('mobile-menu') as HTMLElement | null
	const open = document.getElementById('nav-open')
	const close = document.getElementById('nav-close')
	const setOpen = (v: boolean) => {
		if (!menu || !open) return
		menu.hidden = !v
		open.setAttribute('aria-expanded', String(v))
		document.body.style.overflow = v ? 'hidden' : ''
	}
	open?.addEventListener('click', () => setOpen(true))
	close?.addEventListener('click', () => setOpen(false))
	menu?.querySelectorAll('a').forEach((a) =>
		a.addEventListener('click', () => setOpen(false))
	)
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') setOpen(false)
	})
</script>
```

- [ ] **Step 2: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: responsive Nav with mobile overlay menu"
```

---

## Task 14: `Footer.astro`

**Files:**

- Create: `src/components/sections/Footer.astro`

- [ ] **Step 1: Implement `Footer.astro`**

```astro
---
import { SITE, FOOTER_SECTIONS, SOCIAL_LINKS } from '../../consts'
const year = new Date().getFullYear()
---

<footer class="border-hairline bg-canvas border-t">
	<div
		class="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]"
	>
		<div>
			<p class="text-ink font-mono text-sm font-medium">{SITE.name}</p>
			<p class="text-body mt-3 max-w-xs text-sm">{SITE.description}</p>
		</div>
		{
			FOOTER_SECTIONS.map((section) => (
				<div>
					<p class="text-mute font-mono text-xs tracking-wide uppercase">
						{section.title}
					</p>
					<ul class="mt-4 flex flex-col gap-2">
						{section.links.map((l) => (
							<li>
								<a
									href={l.href}
									class="text-body hover:text-ink text-sm transition-colors"
								>
									{l.label}
								</a>
							</li>
						))}
					</ul>
				</div>
			))
		}
	</div>
	<div
		class="border-hairline mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 border-t px-4 py-6 sm:flex-row sm:px-6"
	>
		<p class="text-mute text-xs">
			© {year}
			{SITE.name}. All client-side. Keys never leave your browser.
		</p>
		<ul class="flex gap-4">
			{
				SOCIAL_LINKS.map((l) => (
					<li>
						<a
							href={l.href}
							class="text-body hover:text-ink text-xs"
							rel="noopener"
						>
							{l.label}
						</a>
					</li>
				))
			}
		</ul>
	</div>
</footer>
```

- [ ] **Step 2: Verify the layout now type-checks end-to-end**

Run: `pnpm check`
Expected: no errors (Nav + Footer now exist; BaseLayout resolves).

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: site footer with link columns + client-side privacy note"
```

---

## Task 15: Crypto tool panels + `ToolSection`

**Files:**

- Create: `src/components/tool/KeygenPanel.astro`, `SignPanel.astro`, `VerifyPanel.astro`, `ToolSection.astro`

> Panels are theme-adaptive: light cards in light mode; key/signature output uses a dark "code surface" (`bg-ink text-on-primary font-mono`) that reads as a terminal in both themes. All scripts import from `src/lib`.

- [ ] **Step 1: `KeygenPanel.astro`**

```astro
---
import Card from '../ui/Card.astro'
import Button from '../ui/Button.astro'
import Icon from '../ui/Icon.astro'
---

<Card id="keygen" class="scroll-mt-24">
	<div class="flex items-center gap-2">
		<Icon name="key" class="text-ink h-5 w-5" />
		<h3 class="display-md">Generate a keypair.</h3>
	</div>
	<p class="text-body mt-2 text-sm">
		Creates a cryptographically secure Ed25519 keypair in your browser. The
		private key never leaves this page.
	</p>

	<Button id="keygen-btn" variant="primary" class="mt-5"
		>Generate keypair</Button
	>

	<div class="mt-6 space-y-4">
		<div>
			<label class="text-mute font-mono text-xs tracking-wide uppercase"
				>Public key · 64 hex</label
			>
			<div
				class="bg-ink text-on-primary mt-1 flex items-start gap-2 rounded-md p-3 font-mono text-xs"
			>
				<output id="keygen-public" class="block w-full break-all"
					>—</output
				>
				<button
					data-copy="#keygen-public"
					class="text-on-primary/70 hover:text-on-primary shrink-0"
					aria-label="Copy public key">copy</button
				>
			</div>
		</div>
		<div>
			<label class="text-mute font-mono text-xs tracking-wide uppercase"
				>Private key · 64 hex · keep secret</label
			>
			<div
				class="bg-ink text-on-primary mt-1 flex items-start gap-2 rounded-md p-3 font-mono text-xs"
			>
				<output id="keygen-private" class="block w-full break-all"
					>—</output
				>
				<button
					data-copy="#keygen-private"
					class="text-on-primary/70 hover:text-on-primary shrink-0"
					aria-label="Copy private key">copy</button
				>
			</div>
		</div>
	</div>
</Card>

<script>
	import { generateKeypair } from '../../lib/ed25519'
	import { copyText, toast } from '../../lib/clipboard'

	const btn = document.getElementById(
		'keygen-btn'
	) as HTMLButtonElement | null
	const pub = document.getElementById('keygen-public')
	const priv = document.getElementById('keygen-private')

	btn?.addEventListener('click', async () => {
		btn.disabled = true
		btn.textContent = 'Generating…'
		try {
			const { privateKeyHex, publicKeyHex } = await generateKeypair()
			if (pub) pub.textContent = publicKeyHex
			if (priv) priv.textContent = privateKeyHex
			toast('Keypair generated')
		} catch {
			toast('Failed to generate keypair', 'error')
		} finally {
			btn.disabled = false
			btn.textContent = 'Generate keypair'
		}
	})

	// Shared copy handler for all [data-copy] buttons across the tool panels.
	document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => {
		b.addEventListener('click', async () => {
			const sel = b.dataset.copy
			const text = sel
				? document.querySelector(sel)?.textContent?.trim()
				: ''
			if (!text || text === '—') {
				toast('Nothing to copy', 'error')
				return
			}
			toast((await copyText(text)) ? 'Copied' : 'Copy failed', 'success')
		})
	})
</script>
```

> The `[data-copy]` handler is defined **once here** and binds every `[data-copy]` button on the page, including those in Sign/Verify. Do **not** duplicate this handler in the other panels.

- [ ] **Step 2: `SignPanel.astro`**

```astro
---
import Card from '../ui/Card.astro'
import Button from '../ui/Button.astro'
import Icon from '../ui/Icon.astro'
---

<Card id="sign" class="scroll-mt-24">
	<div class="flex items-center gap-2">
		<Icon name="sign" class="text-ink h-5 w-5" />
		<h3 class="display-md">Sign a message.</h3>
	</div>
	<p class="text-body mt-2 text-sm">
		Produce an EdDSA signature with your private key.
	</p>

	<div class="mt-5 space-y-4">
		<div>
			<label
				for="sign-message"
				class="text-mute font-mono text-xs tracking-wide uppercase"
				>Message</label
			>
			<textarea
				id="sign-message"
				rows="4"
				class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-sm border p-3 font-mono text-sm focus:outline-none"
				placeholder="Type a message to sign…"></textarea>
		</div>
		<div>
			<label
				for="sign-private"
				class="text-mute font-mono text-xs tracking-wide uppercase"
				>Private key · 64 hex</label
			>
			<input
				id="sign-private"
				type="text"
				class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-sm border p-3 font-mono text-xs focus:outline-none"
				placeholder="Paste your 64-hex private key…"
			/>
		</div>
	</div>

	<Button id="sign-btn" variant="primary" class="mt-5">Sign message</Button>

	<div class="mt-6">
		<label class="text-mute font-mono text-xs tracking-wide uppercase"
			>Signature · 128 hex</label
		>
		<div
			class="bg-ink text-on-primary mt-1 flex items-start gap-2 rounded-md p-3 font-mono text-xs"
		>
			<output id="sign-output" class="block w-full break-all">—</output>
			<button
				data-copy="#sign-output"
				class="text-on-primary/70 hover:text-on-primary shrink-0"
				aria-label="Copy signature">copy</button
			>
		</div>
	</div>
</Card>

<script>
	import { signMessage } from '../../lib/ed25519'
	import { toast } from '../../lib/clipboard'

	const btn = document.getElementById('sign-btn') as HTMLButtonElement | null
	const msg = document.getElementById(
		'sign-message'
	) as HTMLTextAreaElement | null
	const priv = document.getElementById(
		'sign-private'
	) as HTMLInputElement | null
	const out = document.getElementById('sign-output')

	btn?.addEventListener('click', async () => {
		if (!msg?.value.trim()) {
			toast('Enter a message', 'error')
			return
		}
		if (!priv?.value.trim()) {
			toast('Enter a private key', 'error')
			return
		}
		btn.disabled = true
		btn.textContent = 'Signing…'
		try {
			const sig = await signMessage(msg.value, priv.value.trim())
			if (out) out.textContent = sig
			toast('Message signed')
		} catch (e) {
			toast(e instanceof Error ? e.message : 'Failed to sign', 'error')
		} finally {
			btn.disabled = false
			btn.textContent = 'Sign message'
		}
	})
</script>
```

- [ ] **Step 3: `VerifyPanel.astro`**

```astro
---
import Card from '../ui/Card.astro'
import Button from '../ui/Button.astro'
import Icon from '../ui/Icon.astro'
---

<Card id="verify" class="scroll-mt-24">
	<div class="flex items-center gap-2">
		<Icon name="verify" class="text-ink h-5 w-5" />
		<h3 class="display-md">Verify a signature.</h3>
	</div>
	<p class="text-body mt-2 text-sm">
		Check a signature against the original message and a public key.
	</p>

	<div class="mt-5 space-y-4">
		<div>
			<label
				for="verify-message"
				class="text-mute font-mono text-xs tracking-wide uppercase"
				>Original message</label
			>
			<textarea
				id="verify-message"
				rows="4"
				class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-sm border p-3 font-mono text-sm focus:outline-none"
				placeholder="The exact message that was signed…"></textarea>
		</div>
		<div>
			<label
				for="verify-public"
				class="text-mute font-mono text-xs tracking-wide uppercase"
				>Public key · 64 hex</label
			>
			<input
				id="verify-public"
				type="text"
				class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-sm border p-3 font-mono text-xs focus:outline-none"
				placeholder="Paste the 64-hex public key…"
			/>
		</div>
		<div>
			<label
				for="verify-signature"
				class="text-mute font-mono text-xs tracking-wide uppercase"
				>Signature · 128 hex</label
			>
			<textarea
				id="verify-signature"
				rows="2"
				class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-sm border p-3 font-mono text-xs focus:outline-none"
				placeholder="Paste the 128-hex signature…"></textarea>
		</div>
	</div>

	<Button id="verify-btn" variant="primary" class="mt-5"
		>Verify signature</Button
	>

	<div
		id="verify-result"
		class="border-hairline bg-canvas-soft text-mute mt-6 rounded-md border p-4 font-mono text-sm"
	>
		Result will appear here…
	</div>
</Card>

<script>
	import { verifySignature } from '../../lib/ed25519'
	import { toast } from '../../lib/clipboard'

	const btn = document.getElementById(
		'verify-btn'
	) as HTMLButtonElement | null
	const msg = document.getElementById(
		'verify-message'
	) as HTMLTextAreaElement | null
	const pub = document.getElementById(
		'verify-public'
	) as HTMLInputElement | null
	const sig = document.getElementById(
		'verify-signature'
	) as HTMLTextAreaElement | null
	const result = document.getElementById('verify-result')

	btn?.addEventListener('click', async () => {
		if (!msg?.value.trim() || !pub?.value.trim() || !sig?.value.trim()) {
			toast('Fill message, public key, and signature', 'error')
			return
		}
		btn.disabled = true
		btn.textContent = 'Verifying…'
		try {
			const ok = await verifySignature(
				sig.value.trim(),
				msg.value,
				pub.value.trim()
			)
			if (result) {
				result.textContent = ok
					? '✓ VALID — signature matches.'
					: '✗ INVALID — signature does not match.'
				result.className =
					'mt-6 rounded-md border p-4 font-mono text-sm ' +
					(ok
						? 'border-success/40 bg-success/5 text-success'
						: 'border-error/40 bg-error/5 text-error')
			}
			toast(
				ok ? 'Signature valid' : 'Signature invalid',
				ok ? 'success' : 'error'
			)
		} catch (e) {
			toast(e instanceof Error ? e.message : 'Failed to verify', 'error')
		} finally {
			btn.disabled = false
			btn.textContent = 'Verify signature'
		}
	})
</script>
```

- [ ] **Step 4: `ToolSection.astro`**

```astro
---
import KeygenPanel from './KeygenPanel.astro'
import SignPanel from './SignPanel.astro'
import VerifyPanel from './VerifyPanel.astro'
import Badge from '../ui/Badge.astro'
import Icon from '../ui/Icon.astro'
---

<section
	id="tool"
	class="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-16 sm:px-6"
>
	<div class="mx-auto max-w-2xl text-center">
		<Badge>RFC 8032 · EdDSA</Badge>
		<h2 class="display-lg mt-4">The complete Ed25519 workflow.</h2>
		<p class="text-body mt-3 inline-flex items-center gap-2 text-sm">
			<Icon name="shield" class="h-4 w-4" /> Everything runs in your browser.
			Keys never leave your device.
		</p>
	</div>

	<div class="mt-10 grid gap-6">
		<KeygenPanel />
		<div class="grid gap-6 lg:grid-cols-2">
			<SignPanel />
			<VerifyPanel />
		</div>
	</div>
</section>
```

- [ ] **Step 5: Type-check + build**

Run: `pnpm check && pnpm build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: theme-adaptive generate/sign/verify tool panels"
```

---

## Task 16: Marketing sections — Hero, FeatureGrid, FaqTeaser, CtaBand

**Files:**

- Create: `src/components/sections/Hero.astro`, `FeatureGrid.astro`, `FaqTeaser.astro`, `CtaBand.astro`

- [ ] **Step 1: `Hero.astro`**

```astro
---
import Button from '../ui/Button.astro'
import Badge from '../ui/Badge.astro'
import MeshGradient from '../ui/MeshGradient.astro'
---

<section class="relative overflow-hidden">
	<MeshGradient class="h-[60%]" />
	<div class="mx-auto max-w-[1200px] px-4 py-24 text-center sm:px-6 md:py-32">
		<Badge>Free · Open · Client-side</Badge>
		<h1 class="display-xl mx-auto mt-5 max-w-3xl text-balance">
			Generate, sign, and verify Ed25519 keys.
		</h1>
		<p class="text-body mx-auto mt-5 max-w-xl text-lg">
			A fast, private toolkit for modern digital signatures. RFC 8032
			EdDSA, computed entirely in your browser — your private keys never
			touch a server.
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<Button href="/#tool" variant="primary">Open the tool</Button>
			<Button href="/blog" variant="secondary">Learn Ed25519</Button>
		</div>
	</div>
</section>
```

- [ ] **Step 2: `FeatureGrid.astro`**

```astro
---
import Card from '../ui/Card.astro'
import Icon from '../ui/Icon.astro'
const features = [
	{
		icon: 'shield',
		title: 'Private by design.',
		body: 'All cryptography runs locally via WebCrypto. No keys, messages, or signatures are ever transmitted.',
	},
	{
		icon: 'key',
		title: 'Modern & fast.',
		body: 'Ed25519 is a state-of-the-art elliptic-curve signature scheme — small keys, fast verification, strong security.',
	},
	{
		icon: 'verify',
		title: 'Standards-based.',
		body: 'A faithful RFC 8032 EdDSA implementation built on the audited @noble/ed25519 library.',
	},
] as const
---

<section class="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
	<div class="grid gap-6 md:grid-cols-3">
		{
			features.map((f) => (
				<Card elevation={2}>
					<Icon name={f.icon} class="text-ink h-6 w-6" />
					<h3 class="display-md mt-4">{f.title}</h3>
					<p class="text-body mt-2 text-sm">{f.body}</p>
				</Card>
			))
		}
	</div>
</section>
```

- [ ] **Step 3: `FaqTeaser.astro`**

```astro
---
import Button from '../ui/Button.astro'
const faqs = [
	{
		q: 'Are my keys sent anywhere?',
		a: 'No. Key generation, signing, and verification run entirely in your browser using the WebCrypto API. Nothing is uploaded.',
	},
	{
		q: 'What is Ed25519?',
		a: 'Ed25519 is an EdDSA signature scheme using Curve25519. It offers high security with small (32-byte) keys and fast verification.',
	},
	{
		q: 'What are the key and signature sizes?',
		a: 'Private and public keys are 32 bytes (64 hex characters). Signatures are 64 bytes (128 hex characters).',
	},
] as const
---

<section class="mx-auto max-w-3xl px-4 py-16 sm:px-6">
	<h2 class="display-lg text-center">Questions, answered.</h2>
	<div
		class="divide-hairline border-hairline bg-canvas mt-8 divide-y rounded-lg border"
	>
		{
			faqs.map((f) => (
				<details class="group p-5">
					<summary class="text-ink flex cursor-pointer list-none items-center justify-between font-medium">
						{f.q}
						<span class="text-mute transition-transform group-open:rotate-45">
							+
						</span>
					</summary>
					<p class="text-body mt-3 text-sm">{f.a}</p>
				</details>
			))
		}
	</div>
	<div class="mt-6 text-center">
		<Button href="/faq" variant="secondary">See all FAQs</Button>
	</div>
</section>
```

- [ ] **Step 4: `CtaBand.astro`**

```astro
---
import Button from '../ui/Button.astro'
---

<section class="bg-ink text-on-primary">
	<div class="mx-auto max-w-[1200px] px-4 py-20 text-center sm:px-6">
		<h2 class="display-lg mx-auto max-w-2xl">Try the Ed25519 tool now.</h2>
		<p class="text-on-primary/70 mx-auto mt-3 max-w-lg text-base">
			Generate a keypair and sign your first message in seconds — no
			signup, no server.
		</p>
		<div class="mt-8">
			<Button href="/#tool" variant="secondary">Open the tool</Button>
		</div>
	</div>
</section>
```

- [ ] **Step 5: Type-check**

Run: `pnpm check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: marketing sections (Hero, FeatureGrid, FaqTeaser, CtaBand)"
```

---

## Task 17: Landing page `src/pages/index.astro`

**Files:**

- Replace: `src/pages/index.astro` (currently the smoke page)

- [ ] **Step 1: Replace the smoke page with the real landing page**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/sections/Hero.astro'
import ToolSection from '../components/tool/ToolSection.astro'
import FeatureGrid from '../components/sections/FeatureGrid.astro'
import FaqTeaser from '../components/sections/FaqTeaser.astro'
import CtaBand from '../components/sections/CtaBand.astro'
import AdSlot from '../components/ui/AdSlot.astro'
import { webApplicationJsonLd, websiteJsonLd } from '../lib/seo'
---

<BaseLayout path="/" jsonLd={[websiteJsonLd(), webApplicationJsonLd()]}>
	<Hero />
	<ToolSection />
	<div class="px-4 py-4 sm:px-6"><AdSlot /></div>
	<FeatureGrid />
	<FaqTeaser />
	<CtaBand />
</BaseLayout>
```

- [ ] **Step 2: Build and verify the landing page renders**

Run: `pnpm build`
Expected: build succeeds; `grep -c "Generate, sign" dist/index.html` ≥ 1.

- [ ] **Step 3: Manual smoke test in the dev server**

Run: `pnpm dev`, open the printed URL. Confirm:

- Hero renders with mesh gradient.
- Generate keypair → public + private fill in; copy buttons toast "Copied".
- Sign with the generated private key → signature appears.
- Verify with message + public key + signature → "VALID"; tamper the message → "INVALID".
- Theme toggle flips light/dark with no flash on reload.
- Mobile width (<768px): hamburger opens the overlay menu.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: assemble Ed25519 landing page"
```

---

## Task 18: `404.astro`

**Files:**

- Create: `src/pages/404.astro`

- [ ] **Step 1: Implement `404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Button from '../components/ui/Button.astro'
---

<BaseLayout title="Page not found" path="/404" noindex={true}>
	<section
		class="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center sm:px-6"
	>
		<p class="text-mute font-mono text-sm">404</p>
		<h1 class="display-xl mt-4">This page doesn’t exist.</h1>
		<p class="text-body mt-4 max-w-md">
			The link may be broken or the page may have moved. Let’s get you
			back to signing.
		</p>
		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<Button href="/" variant="primary">Back home</Button>
			<Button href="/#tool" variant="secondary">Open the tool</Button>
		</div>
	</section>
</BaseLayout>
```

- [ ] **Step 2: Build and confirm 404 output**

Run: `pnpm build`
Expected: `dist/404.html` exists.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: on-brand 404 page"
```

---

## Task 19: SEO/AdSense static files + sitemap + manifest + OG image

**Files:**

- Create: `public/robots.txt`, `public/ads.txt`, `public/og/default.png`
- Modify: `public/manifest.json`, `astro.config.mjs`

- [ ] **Step 1: Install + register the sitemap integration**

```bash
pnpm add @astrojs/sitemap@^3.7.3
```

Update `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
	site: 'https://ed25519.com',
	adapter: cloudflare(),
	integrations: [sitemap()],
	vite: { plugins: [tailwindcss()] },
})
```

- [ ] **Step 2: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://ed25519.com/sitemap-index.xml
```

- [ ] **Step 3: Create `public/ads.txt`** (placeholder — replace publisher id before launch)

```
# Replace pub-0000000000000000 with your AdSense publisher ID before going live.
google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
```

- [ ] **Step 4: Create an OG image at `public/og/default.png`**

```bash
mkdir -p public/og
convert -size 1200x630 xc:'#0a0a0a' -gravity center -fill '#ededed' \
  -pointsize 64 -annotate +0+0 'Ed25519.com' public/og/default.png 2>/dev/null || \
  echo "ImageMagick not found — add a 1200x630 PNG at public/og/default.png manually"
```

If ImageMagick is unavailable, the implementer must drop any valid 1200×630 PNG at `public/og/default.png` so the path resolves. Confirm the file exists before continuing: `test -f public/og/default.png && echo ok`.

- [ ] **Step 5: Update `public/manifest.json`**

```json
{
	"name": "Ed25519.com — Generate, Sign & Verify",
	"short_name": "Ed25519",
	"description": "Free in-browser Ed25519 tools: generate keypairs, sign messages, and verify signatures.",
	"start_url": "/",
	"display": "standalone",
	"background_color": "#0a0a0a",
	"theme_color": "#0a0a0a",
	"icons": [
		{ "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" },
		{
			"src": "/apple-touch-icon.png",
			"sizes": "180x180",
			"type": "image/png"
		}
	]
}
```

- [ ] **Step 6: Build and verify SEO artifacts**

Run: `pnpm build`
Expected: build succeeds; `dist/sitemap-index.xml` and `dist/robots.txt` exist; `grep -c "application/ld+json" dist/index.html` ≥ 2.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: robots, ads.txt, sitemap, OG image, updated manifest"
```

---

## Task 20: Final pass — env example, DEPLOY guide, README, CLAUDE, full verification

**Files:**

- Create: `.env.example`, `docs/DEPLOY.md`
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Create `.env.example`**

```
# Public (exposed to the browser). Leave blank to keep ads/analytics off.
PUBLIC_SITE_URL=https://ed25519.com
PUBLIC_ADSENSE_ID=
PUBLIC_ANALYTICS_ID=
# Phase 2 (contact function) — set in Cloudflare dashboard, not committed:
# CONTACT_TO_EMAIL=
```

- [ ] **Step 2: Write `docs/DEPLOY.md`**

```markdown
# Deploying ed25519.com to Cloudflare Pages

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

| Name                  | Value               | Notes                     |
| --------------------- | ------------------- | ------------------------- |
| `PUBLIC_SITE_URL`     | https://ed25519.com | canonical/OG base         |
| `PUBLIC_ADSENSE_ID`   | (your pub-id)       | optional; enables AdSense |
| `PUBLIC_ANALYTICS_ID` | (GA4/Plausible id)  | optional                  |

## Custom domain

Pages → Custom domains → add `ed25519.com`; follow the records prompt in the dashboard.

## Local preview with Workers runtime

`pnpm build && npx wrangler pages dev dist`

> Contact form (Cloudflare Email Routing) setup is documented in Phase 2.
```

- [ ] **Step 3: Rewrite `README.md`**

```markdown
# Ed25519.com

A fast, private, multi-page toolkit for Ed25519 digital signatures — generate
keypairs, sign messages, and verify signatures entirely in the browser.

- **Stack:** Astro 6, TypeScript, Tailwind CSS v4, `@noble/ed25519` v3 (async WebCrypto).
- **Hosting:** Cloudflare Pages.
- **Privacy:** all cryptography runs client-side; keys never leave your device.

## Develop

    pnpm install
    pnpm dev      # dev server
    pnpm test     # unit tests (src/lib)
    pnpm check    # astro + type check
    pnpm build    # production build → dist/

See `docs/DEPLOY.md` for deployment.
```

- [ ] **Step 4: Rewrite `CLAUDE.md`** for the Astro stack

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A client-side-only Ed25519 toolkit (https://ed25519.com), now a multi-page **Astro 6**
site (migrated from a React SPA for SEO/AdSense). Key generation, signing, and verification
run entirely in the browser — keys never leave the device. Don't add anything that sends key
material off-device.

## Commands

    pnpm dev       # Astro dev server (Cloudflare Workers runtime via Vite plugin)
    pnpm build     # production build → dist/
    pnpm preview   # preview the build
    pnpm check     # astro check (type + content)
    pnpm test      # Vitest unit tests for src/lib
    pnpm format    # Prettier (tabs, single quotes, no semicolons)

## Architecture

- **Crypto:** `src/lib/ed25519.ts` wraps `@noble/ed25519` **v3** using the **async** API
  (`getPublicKeyAsync`/`signAsync`/`verifyAsync`), which uses built-in WebCrypto SHA-512.
  Do NOT import `@noble/hashes` or set `ed.hashes.sha512` — that's only for the sync API.
  `src/lib/hex.ts` handles hex↔bytes; both are unit-tested.
- **Design system:** tokens from `DESIGN.md` live in `src/styles/global.css` as Tailwind v4
  `@theme` variables. Dark mode = a `.dark` class on `<html>` set pre-paint by an inline head
  script in `BaseLayout.astro`; tokens are overridden under `.dark`. Mesh gradient is hero-only.
- **Pages:** Astro pages in `src/pages/`; shared chrome in `src/layouts/BaseLayout.astro`;
  components in `src/components/{ui,sections,tool}`.
- **The tool** (`src/components/tool/*`) is vanilla TS in `.astro` `<script>` blocks — no UI
  framework ships to the browser.

## Hosting

Cloudflare Pages via `@astrojs/cloudflare`. All pages are static; the only server route
(Phase 2 contact form) will set `prerender = false`. See `docs/DEPLOY.md`.

## Blog (Phase 2)

Posts are Markdown in `src/content/blog/`. To add one: copy an existing post, rename the
file (filename = slug), edit frontmatter + body, set `draft: false`. No CLI.

## Specs & plans

Design spec and phased implementation plans live in `docs/superpowers/`.
```

- [ ] **Step 5: Full verification gate**

Run: `pnpm install && pnpm check && pnpm test && pnpm build`
Expected: install clean; `check` no errors; all unit tests pass; build produces `dist/index.html`, `dist/404.html`, `dist/sitemap-index.xml`.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "docs: env example, DEPLOY guide, README + CLAUDE for Astro stack"
```

---

## Phase 1 done — review gate

The site is now deployable to Cloudflare Pages: themed landing page with a working generate/sign/verify tool, responsive nav/footer, dark mode (no FOUC), 404, and SEO/AdSense scaffolding. Run the `web-design-guidelines` skill against `src/` before sign-off, then proceed to the **Phase 2** plan (about/contact/faq/legal/blog + contact Function via Cloudflare Email Routing).

---

## Self-review notes (author)

- **Spec coverage:** Phase 1 spec items map to tasks — §5 design system → Tasks 4–5; §6 tool → Tasks 7–8, 15; §7 Phase-1 list → Tasks 11–18; §9 SEO/ads scaffolding → Tasks 11, 12 (AdSlot), 19; §11 404 → Task 18; §12 scripts/tooling → Tasks 1–2, 20; §13 deploy doc → Task 20. Phase 2 items (about/contact/faq/legal/blog, contact Function, RSS, `content.config.ts`) are deferred to the Phase 2 plan by design.
- **Version deviations from spec (corrected in spec §3/§6):** Astro 5→6 (latest 6.4.x; no API in this plan differs); `@noble/ed25519` ^2 + `@noble/hashes` → ^3 async, no hashes dep (verified against the v3 `.d.ts`). Task 8 Step 0 guards the export names at execution time.
- **Cloudflare adapter:** uses `cloudflare()` plain; adapter v13 runs dev/preview on the real Workers runtime via the Cloudflare Vite plugin, so no `platformProxy` config is needed. `wrangler.jsonc` (current format).
- **Known intentional transient state:** Tasks 11–13 leave `pnpm check` failing on missing Nav/Footer until Task 14 (called out per step). Nav/Footer link to Phase-2 routes that 404 until Phase 2 (noted in Task 6).
- **Type consistency:** `generateKeypair`/`signMessage`/`verifySignature` signatures match between Task 8 and callers in Task 15; `toast()`/`copyText()` match between Task 9 and Task 15; `resolveSeo`/`SeoInput`/`jsonLd` prop match between Task 11 and `BaseLayout`/`index`/`404`; `Icon` `name` union includes every value used in Tasks 12/15/16.
- **Placeholder scan:** no TBD/TODO/"add error handling" placeholders; every code step shows complete code. Identity placeholders in `consts.ts` (email/social) are intentional and labeled.
