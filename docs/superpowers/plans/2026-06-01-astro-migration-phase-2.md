# Ed25519.com Astro Migration — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the remaining multi-page site to the Phase 1 foundation — About, Contact (with a working serverless contact form), FAQ, Privacy, Terms, a Markdown blog (index + posts + RSS + 4 starter posts), error pages — plus the deferred Cloudflare adapter that powers the one server route.

**Architecture:** Builds directly on the shipped Phase 1 code (Astro 6, Tailwind v4 CSS-first, vanilla-TS, `@noble/ed25519` v3 async). Every page stays static/prerendered **except** `src/pages/api/contact.ts` (`prerender = false`), which runs as a Cloudflare server route and emails the site owner via **Cloudflare Email Routing**. Blog uses Astro's **Content Layer** collection (`src/content.config.ts` + `glob` loader). New shared layouts (`LegalLayout`, `PostLayout`) wrap `BaseLayout`.

**Tech Stack (added this phase):** `@astrojs/cloudflare@^13` · `@astrojs/mdx@^6` · `@astrojs/rss@^4` · `mimetext` (MIME builder for the email binding) · existing Phase 1 stack.

---

## Context: what Phase 1 already shipped (read before starting)

Phase 1 is complete on branch `astro-migration` (static, no adapter). The implementer MUST follow these **existing conventions** — do not invent new ones:

- **Layout shell:** `src/layouts/BaseLayout.astro` — accepts `SeoInput` props + `jsonLd?: Record<string, unknown> | Record<string, unknown>[]`, renders `<Nav/>`, `<main><slot/></main>`, `<Footer/>`, `<Toast/>`, the no-FOUC theme script, and gated AdSense/analytics. **All pages render through it.**
- **SEO:** `src/lib/seo.ts` exports `resolveSeo`, `SeoInput` (`title?`, `description?`, `path?`, `ogImage?`, `noindex?`), `webApplicationJsonLd()`, `websiteJsonLd()`. `src/components/ui/Seo.astro` consumes them. Phase 2 adds `articleJsonLd`, `breadcrumbJsonLd`, `faqPageJsonLd` here.
- **Config:** `src/consts.ts` exports `SITE` (name, title, description, url, locale, author, email `hello@ed25519.com` PLACEHOLDER, twitter PLACEHOLDER), `NAV_LINKS`, `SOCIAL_LINKS`, `FOOTER_SECTIONS`. Nav/Footer already link to `/about`, `/faq`, `/blog`, `/privacy`, `/terms`, `/contact` — these 404 until this phase creates them.
- **Section pattern:** `<section class="px-4 py-20 sm:px-6"><div class="mx-auto max-w-[1100px]"> … </div></section>`. Chrome (Nav/Footer) uses `max-w-[1200px]`.
- **Eyebrow:** `<p class="text-mute font-mono text-xs tracking-[0.18em] uppercase">// section-name</p>` then `<h2 class="display-lg mt-1">…</h2>`.
- **Headings:** `display-xl` (page hero), `display-lg` (section), `display-md`; sentence-case.
- **Buttons:** `src/components/ui/Button.astro` — `variant: 'primary'|'secondary'|'ghost'|'prompt'|'terminal'`, `size: 'sm'|'md'`, `href?`, `type?`. Sharp `rounded-[4px]`, mono uppercase. NO pill buttons.
- **Cards / hairline grid:** either `Card.astro` (`elevation` 1–4) or the inline hairline-grid trick: a wrapper `class="border-hairline bg-hairline grid gap-px overflow-hidden rounded-[8px] border md:grid-cols-N"` with children `class="bg-canvas …"` (see `FeatureGrid.astro`).
- **Terminal tokens:** fixed `--color-term-*` (bg `#0b0d12`, fg, prompt `#2dd4a8`, accent, danger, border) used via `bg-[var(--color-term-bg)]` etc. — these do NOT invert in dark mode. Use them only for console/code surfaces.
- **Color/text tokens:** `text-ink`, `text-body`, `text-mute`, `bg-canvas`, `bg-canvas-soft`, `bg-canvas-soft-2`, `border-hairline`, `border-hairline-strong`, `text-link`.
- **Prettier:** tabs, single quotes, no semicolons. **Run `pnpm format` before every commit.**
- **Verification commands:** `pnpm check` (astro+type, non-interactive), `pnpm test` (Vitest), `pnpm build`.
- **Astro 6 Content Layer:** collections are defined in `src/content.config.ts` (NOT `src/content/config.ts`); entries use `entry.id` (not `.slug`); render with `import { render } from 'astro:content'`.

---

## File structure (Phase 2 additions)

```
astro.config.mjs              MODIFY: add cloudflare() adapter + mdx() integration
wrangler.jsonc                CREATE: Cloudflare config (compat date, nodejs_compat, send_email binding)
src/env.d.ts                  MODIFY: add App.Locals runtime + Env binding types
package.json                  deps: @astrojs/cloudflare, @astrojs/mdx, @astrojs/rss, mimetext

src/
├── content.config.ts         CREATE: blog collection (glob loader + Zod schema)
├── content/blog/             CREATE: 4 starter posts (.md)
│   ├── what-is-ed25519.md
│   ├── ed25519-vs-rsa-vs-ecdsa.md
│   ├── how-ed25519-key-generation-works.md
│   └── signing-and-verifying-with-ed25519.md
├── lib/
│   ├── seo.ts                MODIFY: add articleJsonLd / breadcrumbJsonLd / faqPageJsonLd
│   └── reading-time.ts       CREATE: word-count → "N min read" (TDD)
├── layouts/
│   ├── LegalLayout.astro     CREATE: prose wrapper for privacy/terms
│   └── PostLayout.astro      CREATE: blog post chrome (title, meta, prose, breadcrumb)
├── components/
│   ├── ui/Prose.astro        CREATE: scoped rich-text styles for Markdown bodies
│   └── sections/PageHeader.astro  CREATE: shared page hero (eyebrow + title + lead)
└── pages/
    ├── about.astro           CREATE
    ├── contact.astro         CREATE (form, progressive enhancement)
    ├── faq.astro             CREATE (FAQPage JSON-LD)
    ├── privacy.astro         CREATE (LegalLayout)
    ├── terms.astro           CREATE (LegalLayout)
    ├── 500.astro             CREATE
    ├── blog/index.astro      CREATE (post list)
    ├── blog/[...slug].astro  CREATE (PostLayout + Article/Breadcrumb JSON-LD)
    ├── rss.xml.ts            CREATE
    └── api/contact.ts        CREATE (prerender=false, Email Routing)

docs/
├── DEPLOY.md                 MODIFY: add Cloudflare Email Routing + adapter + secrets steps
└── AUTHORING.md              CREATE: blog authoring (copy-a-post) + frontmatter + SEO checklist
```

---

## Task 1: Re-add Cloudflare adapter + wrangler config (deferred from Phase 1)

**Why now:** Phase 1 deferred the adapter because, with zero server routes, adapter v13 produced a Workers-style layout that broke `dist/` greps. Phase 2 introduces the first server route (the contact form), so the adapter is required. This task adds it and **empirically confirms** the emitted output layout (which differs by adapter mode), then writes `wrangler.jsonc`/`DEPLOY.md` to match reality rather than assumption.

**Files:**
- Modify: `astro.config.mjs`, `src/env.d.ts`
- Create: `wrangler.jsonc`

- [ ] **Step 1: Install the adapter**

```bash
pnpm add @astrojs/cloudflare@^13.6.0
```

- [ ] **Step 2: Add the adapter to `astro.config.mjs`** (keep existing sitemap + tailwind)

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ed25519.com',
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

> `imageService: 'passthrough'` avoids the adapter pulling in a Workers-incompatible image service (we ship no Astro `<Image>` optimization in this project). Default page mode stays static; only routes that set `prerender = false` become server routes.

- [ ] **Step 3: Add a temporary probe server route so the build emits a worker**

Create `src/pages/api/_probe.ts`:

```ts
export const prerender = false;
export const GET = () => new Response(JSON.stringify({ ok: true }), {
  headers: { 'content-type': 'application/json' },
});
```

- [ ] **Step 4: Build and INSPECT the actual output layout**

Run: `pnpm build && find dist -maxdepth 2 -type f | sort && echo '---' && ls dist`
Expected: build succeeds. **Record** where static HTML lands (`dist/index.html` vs `dist/_worker.js/…`), and whether `dist/_routes.json` / `dist/_worker.js/` exist. Adapter v13 in Workers mode typically emits static assets at `dist/` root plus a `dist/_worker.js/` directory and `dist/_routes.json`.

- [ ] **Step 5: Create `wrangler.jsonc` matching the observed layout**

If static assets are at the `dist/` root with a `_worker.js` (Workers-with-assets layout):

```jsonc
{
  "name": "ed25519",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./dist/_worker.js/index.js",
  "assets": { "directory": "./dist", "binding": "ASSETS" },
  "send_email": [{ "name": "SEB", "destination_address": "hello@ed25519.com" }]
}
```

If instead the adapter emitted a Pages layout (`dist/` of static files, no `_worker.js`), use:

```jsonc
{
  "name": "ed25519",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": "./dist",
  "send_email": [{ "name": "SEB", "destination_address": "hello@ed25519.com" }]
}
```

> Pick the block that matches Step 4. `destination_address` locks sends to the owner's address (all the contact form ever does); replace `hello@ed25519.com` with the real verified address at deploy. `SEB` is the binding name used in Task 12.

- [ ] **Step 6: Add runtime + binding types to `src/env.d.ts`**

```ts
/// <reference types="astro/client" />

interface Env {
  SEB: { send(message: unknown): Promise<void> };
  CONTACT_TO_EMAIL: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
```

- [ ] **Step 7: Confirm static pages still prerender, then remove the probe**

Run: `pnpm build` and confirm the existing pages (`index`, `404`) are still static HTML in the output. Then delete the probe:

```bash
rm src/pages/api/_probe.ts
```

- [ ] **Step 8: Build once more without the probe**

Run: `pnpm build`
Expected: success. (With no server route yet, the worker may be near-empty; the contact route in Task 12 populates it.)

- [ ] **Step 9: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: re-add Cloudflare adapter + wrangler config (deferred from Phase 1)"
```

---

## Task 2: `src/lib/reading-time.ts` (TDD)

**Files:**
- Create: `src/lib/reading-time.ts`, `tests/reading-time.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/reading-time.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readingTime } from '../src/lib/reading-time';

describe('readingTime', () => {
  it('returns at least 1 min for short text', () => {
    expect(readingTime('hello world')).toBe('1 min read');
  });

  it('rounds up to whole minutes at ~200 wpm', () => {
    const words = Array.from({ length: 450 }, () => 'word').join(' ');
    expect(readingTime(words)).toBe('3 min read');
  });

  it('ignores markdown punctuation when counting words', () => {
    expect(readingTime('# Title\n\nOne, two; three.')).toBe('1 min read');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `pnpm test`
Expected: FAIL (`Cannot find module '../src/lib/reading-time'`).

- [ ] **Step 3: Implement `src/lib/reading-time.ts`**

```ts
const WPM = 200;

export function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WPM));
  return `${minutes} min read`;
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `pnpm test`
Expected: PASS (existing Phase 1 tests + 3 new).

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: reading-time helper (TDD)"
```

---

## Task 3: Blog content collection + MDX

**Files:**
- Create: `src/content.config.ts`
- Modify: `astro.config.mjs`, `package.json`

- [ ] **Step 1: Install MDX**

```bash
pnpm add @astrojs/mdx@^6.0.1
```

- [ ] **Step 2: Add MDX to `astro.config.mjs` integrations**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://ed25519.com',
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [sitemap(), mdx()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Create `src/content.config.ts`** (Content Layer glob loader + Zod schema)

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().min(50).max(170),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Ed25519.com'),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

- [ ] **Step 4: Verify the collection type-checks (no posts yet is fine)**

Run: `pnpm check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: blog content collection (Content Layer + Zod) + MDX integration"
```

---

## Task 4: Four starter blog posts

**Files:**
- Create: `src/content/blog/what-is-ed25519.md`, `ed25519-vs-rsa-vs-ecdsa.md`, `how-ed25519-key-generation-works.md`, `signing-and-verifying-with-ed25519.md`

> These double as copy-from templates for the user's own posts. Keep frontmatter complete and bodies real (every post is genuine, indexable content for AdSense review). Dates staggered so ordering is deterministic.

- [ ] **Step 1: `what-is-ed25519.md`**

```markdown
---
title: 'What is Ed25519? A plain-English guide to modern signatures'
description: 'Ed25519 is a fast, secure digital signature scheme. Here is what it is, how it works at a high level, and why developers prefer it over older algorithms.'
pubDate: 2026-05-20
tags: ['basics', 'cryptography']
author: 'Ed25519.com'
draft: false
---

Ed25519 is a public-key digital signature system. It lets you prove that a
message came from you and was not changed along the way — without ever sharing
your secret key.

## The two keys

Every Ed25519 identity is a pair of keys:

- A **private key** (32 bytes) that you keep secret and use to _sign_.
- A **public key** (32 bytes) that you share freely and others use to _verify_.

Because the public key is derived from the private key through one-way math,
publishing it reveals nothing about the secret.

## What a signature proves

When you sign a message, you produce a 64-byte **signature**. Anyone with the
message, the signature, and your public key can check two things at once:

1. **Authenticity** — the signature was produced by the matching private key.
2. **Integrity** — the message has not been altered since it was signed.

If even one byte of the message changes, verification fails.

## Why people choose Ed25519

- **Small and fast.** 32-byte keys and 64-byte signatures, with quick signing
  and verification.
- **Safe defaults.** It avoids whole classes of mistakes that plague older
  schemes (no per-signature random number to get wrong).
- **Standardized.** Defined in [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032).

## Try it yourself

You can [generate a keypair and sign a message](/#tool) right here — everything
runs in your browser, and your keys never leave your device.
```

- [ ] **Step 2: `ed25519-vs-rsa-vs-ecdsa.md`**

```markdown
---
title: 'Ed25519 vs RSA vs ECDSA: which should you use?'
description: 'A practical comparison of Ed25519, RSA, and ECDSA across speed, key size, security, and compatibility — with guidance on when to pick each one.'
pubDate: 2026-05-22
tags: ['comparison', 'cryptography']
author: 'Ed25519.com'
draft: false
---

Three signature algorithms dominate modern systems: **RSA**, **ECDSA**, and
**Ed25519**. They all let you sign and verify, but they differ a lot in practice.

## At a glance

| | Ed25519 | ECDSA (P-256) | RSA (2048) |
|---|---|---|---|
| Public key size | 32 bytes | 33–65 bytes | 256 bytes |
| Signature size | 64 bytes | ~64–72 bytes | 256 bytes |
| Signing speed | Very fast | Fast | Slow |
| Safe defaults | Excellent | Easy to misuse | Reasonable |

## RSA

RSA is the oldest and most widely supported. Its weaknesses are size and speed:
2048-bit keys are large, and signing is comparatively slow. It is still a fine
choice when you need maximum compatibility with legacy systems.

## ECDSA

ECDSA brought elliptic curves to mainstream use with much smaller keys than RSA.
Its main risk is that a poor random number during signing can leak the private
key — a real-world cause of past breaches.

## Ed25519

Ed25519 is deterministic: it does not need fresh randomness per signature, which
removes that entire failure mode. It is fast, compact, and hard to misuse — which
is why it is the modern default for SSH keys, signing tools, and protocols.

## Recommendation

For new systems, prefer **Ed25519** unless you have a hard compatibility
requirement that forces RSA or ECDSA. [Try Ed25519 in your browser.](/#tool)
```

- [ ] **Step 3: `how-ed25519-key-generation-works.md`**

```markdown
---
title: 'How Ed25519 key generation works (and why it is safe)'
description: 'A step-by-step look at how an Ed25519 keypair is generated, from random seed to public key, and the properties that make the process secure.'
pubDate: 2026-05-25
tags: ['basics', 'key-generation']
author: 'Ed25519.com'
draft: false
---

Generating an Ed25519 keypair looks instant, but a few precise steps happen
under the hood. Here is the high-level flow.

## 1. A random 32-byte seed

It starts with 32 bytes from a cryptographically secure random source. In the
browser, that is the WebCrypto API. This seed _is_ your private key.

## 2. Hash and clamp

The seed is hashed with SHA-512. Part of the result becomes a scalar, which is
"clamped" (a few bits are fixed) to guarantee good mathematical properties.

## 3. Scalar multiplication

The scalar is multiplied by the curve's base point on Curve25519. The result,
encoded to 32 bytes, is your **public key**.

Because reversing that multiplication is computationally infeasible, the public
key can be shared without exposing the seed.

## Why it is safe to do in the browser

- The random seed comes from the operating system's secure generator.
- The keypair is computed locally and never transmitted.
- Nothing is stored unless you copy it yourself.

[Generate a keypair now](/#tool) and watch it happen instantly.
```

- [ ] **Step 4: `signing-and-verifying-with-ed25519.md`**

```markdown
---
title: 'Signing and verifying messages with Ed25519: a walkthrough'
description: 'A hands-on walkthrough of signing a message with an Ed25519 private key and verifying it with the public key, including what each value means.'
pubDate: 2026-05-28
tags: ['tutorial', 'signing']
author: 'Ed25519.com'
draft: false
---

Once you have a keypair, signing and verifying take seconds. Here is the full
round trip.

## Signing

1. Take your **message** (any text) and your **private key** (64 hex characters).
2. The signer hashes and transforms the message with your private key.
3. Out comes a **signature**: 128 hex characters (64 bytes).

The signature is unique to _that_ message and _that_ key. Sign a different
message and you get a completely different signature.

## Verifying

To verify, anyone needs three things:

- the original **message**,
- the **public key** (64 hex characters),
- the **signature** (128 hex characters).

Verification returns a simple yes/no. "Yes" means the signature was made by the
matching private key and the message is byte-for-byte unchanged.

## Try the round trip

1. [Generate a keypair.](/#keygen)
2. [Sign a message](/#sign) with the private key.
3. [Verify it](/#verify) with the public key — then change one character of the
   message and watch verification fail.

Everything runs locally; your keys never leave the page.
```

- [ ] **Step 5: Verify the collection builds with content**

Run: `pnpm check && pnpm build`
Expected: both succeed; collection now has 4 entries.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "content: four starter blog posts"
```

---

## Task 5: SEO JSON-LD builders for articles, breadcrumbs, FAQ

**Files:**
- Modify: `src/lib/seo.ts`

- [ ] **Step 1: Append builders to `src/lib/seo.ts`** (after the existing exports; keep tabs/quotes)

```ts
export function articleJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  pubDate: Date;
  updatedDate?: Date;
  author?: string;
  ogImage?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    url: new URL(opts.path, SITE.url).href,
    mainEntityOfPage: new URL(opts.path, SITE.url).href,
    datePublished: opts.pubDate.toISOString(),
    dateModified: (opts.updatedDate ?? opts.pubDate).toISOString(),
    author: { '@type': 'Organization', name: opts.author ?? SITE.author },
    publisher: { '@type': 'Organization', name: SITE.name },
    image: new URL(opts.ogImage ?? '/og/default.png', SITE.url).href,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.path, SITE.url).href,
    })),
  };
}

export function faqPageJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: article/breadcrumb/FAQ JSON-LD builders"
```

---

## Task 6: `PageHeader` + `Prose` shared components

**Files:**
- Create: `src/components/sections/PageHeader.astro`, `src/components/ui/Prose.astro`

- [ ] **Step 1: `PageHeader.astro`** (shared hero for secondary pages — eyebrow + title + lead)

```astro
---
interface Props {
  eyebrow: string;
  title: string;
  lead?: string;
}
const { eyebrow, title, lead } = Astro.props;
---
<header class="px-4 pt-20 pb-10 sm:px-6">
  <div class="mx-auto max-w-[1100px]">
    <p class="text-mute font-mono text-xs tracking-[0.18em] uppercase">// {eyebrow}</p>
    <h1 class="display-xl mt-2 max-w-3xl">{title}</h1>
    {lead && <p class="text-body mt-4 max-w-2xl text-lg leading-relaxed">{lead}</p>}
  </div>
</header>
```

- [ ] **Step 2: `Prose.astro`** (scoped rich-text styles for Markdown bodies — uses `@reference` so theme tokens resolve inside `<style>`)

```astro
---
// Scoped rich-text wrapper for rendered Markdown (blog posts, legal pages).
// Styling is scoped to .prose so we don't globally style every h2/p/ul.
---
<div class="prose"><slot /></div>

<style>
  @reference '../../styles/global.css';

  .prose {
    @apply text-body max-w-none text-base leading-relaxed;
  }
  .prose :global(h2) {
    @apply text-ink mt-12 mb-3 text-2xl font-semibold tracking-tight;
  }
  .prose :global(h3) {
    @apply text-ink mt-8 mb-2 text-xl font-semibold tracking-tight;
  }
  .prose :global(p) {
    @apply mt-4;
  }
  .prose :global(ul),
  .prose :global(ol) {
    @apply mt-4 flex flex-col gap-2 pl-5;
  }
  .prose :global(ul) {
    @apply list-disc;
  }
  .prose :global(ol) {
    @apply list-decimal;
  }
  .prose :global(a) {
    @apply text-link underline underline-offset-2 hover:opacity-80;
  }
  .prose :global(strong) {
    @apply text-ink font-semibold;
  }
  .prose :global(code) {
    @apply bg-canvas-soft-2 text-ink rounded-[4px] px-1.5 py-0.5 font-mono text-sm;
  }
  .prose :global(table) {
    @apply mt-6 w-full border-collapse text-sm;
  }
  .prose :global(th),
  .prose :global(td) {
    @apply border-hairline border px-3 py-2 text-left;
  }
  .prose :global(th) {
    @apply bg-canvas-soft text-ink font-mono text-xs tracking-wide uppercase;
  }
  .prose :global(blockquote) {
    @apply border-hairline-strong text-body mt-4 border-l-2 pl-4 italic;
  }
</style>
```

> Tailwind v4 gotcha (from `tailwind-4-docs`): component `<style>` blocks need `@reference` to access theme utilities via `@apply`. Children come from Markdown (uncontrolled), so target them with `:global(...)` scoped under `.prose`.

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: PageHeader + scoped Prose components"
```

---

## Task 7: Blog index — `src/pages/blog/index.astro`

**Files:**
- Create: `src/pages/blog/index.astro`

- [ ] **Step 1: Implement the blog index** (lists non-draft posts, newest first)

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHeader from '../../components/sections/PageHeader.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
  (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
);

const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
---
<BaseLayout
  title="Blog"
  description="Guides and explainers on Ed25519, digital signatures, and applied cryptography."
  path="/blog"
>
  <PageHeader
    eyebrow="blog"
    title="Notes on Ed25519 & signatures."
    lead="Plain-English guides to keys, signing, verification, and modern cryptography."
  />

  <section class="px-4 pb-24 sm:px-6">
    <div class="mx-auto max-w-[1100px]">
      <ul class="border-hairline bg-hairline grid gap-px overflow-hidden rounded-[8px] border sm:grid-cols-2">
        {posts.map((post) => (
          <li class="bg-canvas hover:bg-canvas-soft group transition-colors">
            <a href={`/blog/${post.id}/`} class="flex h-full flex-col p-7">
              <div class="flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] text-mute uppercase">
                <time datetime={post.data.pubDate.toISOString()}>{fmt(post.data.pubDate)}</time>
                {post.data.tags[0] && <span class="text-term-prompt">#{post.data.tags[0]}</span>}
              </div>
              <h2 class="text-ink mt-3 text-lg font-semibold tracking-tight group-hover:underline">
                {post.data.title}
              </h2>
              <p class="text-body mt-2 text-sm leading-relaxed">{post.data.description}</p>
              <span class="text-mute group-hover:text-ink mt-4 inline-flex items-center gap-1 font-mono text-xs uppercase">
                Read →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </section>
</BaseLayout>
```

> Note: `post.id` is the Content Layer entry id (the filename slug). Trailing slash on the href matches Astro's default page output.

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: success; `dist/blog/index.html` exists and lists 4 posts (`grep -c "Read →" dist/blog/index.html` → 4).

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: blog index page"
```

---

## Task 8: `PostLayout` + blog post route — `src/pages/blog/[...slug].astro`

**Files:**
- Create: `src/layouts/PostLayout.astro`, `src/pages/blog/[...slug].astro`

- [ ] **Step 1: `PostLayout.astro`** (post chrome: breadcrumb, title, meta, prose slot, back link)

```astro
---
import BaseLayout from './BaseLayout.astro';
import Prose from '../components/ui/Prose.astro';
import { readingTime } from '../lib/reading-time';
import { articleJsonLd, breadcrumbJsonLd } from '../lib/seo';

interface Props {
  title: string;
  description: string;
  path: string;
  pubDate: Date;
  updatedDate?: Date;
  author: string;
  tags: string[];
  ogImage?: string;
  body: string;
}
const { title, description, path, pubDate, updatedDate, author, tags, ogImage, body } =
  Astro.props;

const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const jsonLd = [
  articleJsonLd({ title, description, path, pubDate, updatedDate, author, ogImage }),
  breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: title, path },
  ]),
];
---
<BaseLayout title={title} description={description} path={path} ogImage={ogImage} jsonLd={jsonLd}>
  <article class="px-4 pt-20 pb-24 sm:px-6">
    <div class="mx-auto max-w-[760px]">
      <a href="/blog" class="text-mute hover:text-ink font-mono text-xs tracking-wide uppercase">← Blog</a>

      <div class="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px] tracking-[0.14em] text-mute uppercase">
        <time datetime={pubDate.toISOString()}>{fmt(pubDate)}</time>
        <span aria-hidden="true">·</span>
        <span>{readingTime(body)}</span>
        {tags.map((t) => <span class="text-term-prompt">#{t}</span>)}
      </div>

      <h1 class="display-lg mt-3">{title}</h1>
      <p class="text-body mt-3 text-lg leading-relaxed">{description}</p>

      <hr class="border-hairline my-8" />

      <Prose>
        <slot />
      </Prose>
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 2: `src/pages/blog/[...slug].astro`** (static paths from the collection)

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content, body } = await render(post);
const path = `/blog/${post.id}/`;
---
<PostLayout
  title={post.data.title}
  description={post.data.description}
  path={path}
  pubDate={post.data.pubDate}
  updatedDate={post.data.updatedDate}
  author={post.data.author}
  tags={post.data.tags}
  ogImage={post.data.ogImage}
  body={body ?? ''}
>
  <Content />
</PostLayout>
```

> `render(post)` returns `{ Content, body, ... }`; `body` is the raw Markdown string used for reading-time. If `body` is undefined for `.md` in this Astro version, the fallback `''` yields "1 min read" — acceptable; verify in Step 3.

- [ ] **Step 3: Build and verify a post renders**

Run: `pnpm build`
Expected: success; `dist/blog/what-is-ed25519/index.html` exists, contains the post title and `application/ld+json` with `BlogPosting`.
Spot check: `grep -c "BlogPosting" dist/blog/what-is-ed25519/index.html` → ≥ 1.

- [ ] **Step 4: Manual check (dev)**

Run: `pnpm dev`, open `/blog`, click a post. Confirm prose styles, dates, tags, reading time, and the back link work in light + dark.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: blog post layout + dynamic post route (Article/Breadcrumb JSON-LD)"
```

---

## Task 9: RSS feed — `src/pages/rss.xml.ts`

**Files:**
- Create: `src/pages/rss.xml.ts`
- Modify: `package.json`

- [ ] **Step 1: Install RSS helper**

```bash
pnpm add @astrojs/rss@^4.0.18
```

- [ ] **Step 2: Implement `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

- [ ] **Step 3: Build and verify**

Run: `pnpm build`
Expected: `dist/rss.xml` exists; `grep -c "<item>" dist/rss.xml` → 4.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: RSS feed for blog"
```

---

## Task 10: FAQ page — `src/pages/faq.astro`

**Files:**
- Create: `src/pages/faq.astro`

- [ ] **Step 1: Implement the FAQ page** (shared FAQ data, native `<details>`, FAQPage JSON-LD)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHeader from '../components/sections/PageHeader.astro';
import { faqPageJsonLd } from '../lib/seo';

const faqs = [
  { q: 'Are my keys sent anywhere?', a: 'No. Key generation, signing, and verification run entirely in your browser using the WebCrypto API. No keys, messages, or signatures are ever transmitted to a server.' },
  { q: 'What is Ed25519?', a: 'Ed25519 is an EdDSA digital signature scheme using the Curve25519 elliptic curve. It offers strong security with small 32-byte keys and fast verification, and is standardized in RFC 8032.' },
  { q: 'What are the key and signature sizes?', a: 'Private and public keys are 32 bytes each (64 hex characters). Signatures are 64 bytes (128 hex characters).' },
  { q: 'Is Ed25519 better than RSA or ECDSA?', a: 'For most new systems, yes. Ed25519 is faster, has much smaller keys than RSA, and avoids the random-number pitfalls that can compromise ECDSA. RSA or ECDSA may still be required for compatibility with older systems.' },
  { q: 'Can I trust this tool with real keys?', a: 'The cryptography uses the audited @noble/ed25519 library and runs locally. That said, for high-value production keys, generate and store them in a dedicated, offline-capable tool or hardware device.' },
  { q: 'Why do the keys look like hexadecimal?', a: 'Keys and signatures are raw bytes. We display them as hexadecimal (0-9, a-f) because it is a compact, copy-paste-friendly text encoding of those bytes.' },
  { q: 'Does this work offline?', a: 'Once the page has loaded, all operations are local and work without a network connection.' },
];
---
<BaseLayout
  title="FAQ"
  description="Frequently asked questions about Ed25519, digital signatures, and how this in-browser tool keeps your keys private."
  path="/faq"
  jsonLd={faqPageJsonLd(faqs)}
>
  <PageHeader eyebrow="faq" title="Frequently asked questions." />

  <section class="px-4 pb-24 sm:px-6">
    <div class="mx-auto max-w-[760px]">
      <div class="divide-hairline border-hairline bg-canvas divide-y rounded-[8px] border">
        {faqs.map((f) => (
          <details class="group p-5">
            <summary class="text-ink flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {f.q}
              <span class="text-mute border-hairline group-open:border-hairline-strong group-open:text-ink inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border font-mono text-sm transition-transform group-open:rotate-45">+</span>
            </summary>
            <p class="text-body mt-3 text-sm leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: `dist/faq/index.html` exists; `grep -c "FAQPage" dist/faq/index.html` → 1.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: FAQ page with FAQPage structured data"
```

---

## Task 11: About page — `src/pages/about.astro`

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Implement the About page** (mission + how-it-works + privacy stance; reuses hairline grid)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHeader from '../components/sections/PageHeader.astro';
import Button from '../components/ui/Button.astro';

const principles = [
  { tag: 'local-first', title: 'Your keys stay yours.', body: 'Every operation runs in your browser via WebCrypto. We have no server that could see your keys — by design.' },
  { tag: 'open', title: 'Built on audited code.', body: 'Signing and verification use the well-reviewed @noble/ed25519 library, following RFC 8032 exactly.' },
  { tag: 'fast', title: 'No accounts, no friction.', body: 'No signup, no tracking of your inputs, no waiting. Open the tool and go.' },
];
---
<BaseLayout
  title="About"
  description="Ed25519.com is a free, private, in-browser toolkit for Ed25519 digital signatures. Learn what it is and the principles behind it."
  path="/about"
>
  <PageHeader
    eyebrow="about"
    title="A private toolkit for modern signatures."
    lead="Ed25519.com is a free, in-browser suite for generating keypairs, signing messages, and verifying signatures — with cryptography that never leaves your device."
  />

  <section class="px-4 pb-12 sm:px-6">
    <div class="mx-auto max-w-[1100px]">
      <div class="border-hairline bg-hairline grid gap-px overflow-hidden rounded-[8px] border md:grid-cols-3">
        {principles.map((p) => (
          <article class="bg-canvas p-7">
            <p class="text-mute font-mono text-[11px] tracking-[0.14em] uppercase">{p.tag}</p>
            <h2 class="text-ink mt-2 text-lg font-semibold tracking-tight">{p.title}</h2>
            <p class="text-body mt-2 text-sm leading-relaxed">{p.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>

  <section class="px-4 pb-24 sm:px-6">
    <div class="mx-auto max-w-[760px]">
      <h2 class="display-md">Why we built it.</h2>
      <p class="text-body mt-4 leading-relaxed">
        Most "online crypto tools" ask you to trust a server with your secrets. Ed25519 is
        fast enough to run entirely in the browser, so there is no reason to send anything
        anywhere. We wanted a clean, modern tool that proves it: open the network tab and
        you will see your keys never leave the page.
      </p>
      <p class="text-body mt-4 leading-relaxed">
        It is meant for learning, prototyping, and quick verification tasks. For
        high-value production keys, use a dedicated offline or hardware-backed tool.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <Button href="/#tool" variant="primary">Open the tool</Button>
        <Button href="/blog" variant="secondary">Read the blog</Button>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: `dist/about/index.html` exists.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: about page"
```

---

## Task 12: Legal pages — `LegalLayout` + Privacy + Terms

**Files:**
- Create: `src/layouts/LegalLayout.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`

> Legal copy is real, AdSense-appropriate placeholder text (covers cookies/ads/analytics and the client-side nature). The user should review with counsel before launch — a banner note says so, and the date uses the build date.

- [ ] **Step 1: `LegalLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import PageHeader from '../components/sections/PageHeader.astro';
import Prose from '../components/ui/Prose.astro';

interface Props {
  title: string;
  description: string;
  path: string;
  updated: string;
}
const { title, description, path, updated } = Astro.props;
---
<BaseLayout title={title} description={description} path={path} noindex={false}>
  <PageHeader eyebrow="legal" title={title} />
  <section class="px-4 pb-24 sm:px-6">
    <div class="mx-auto max-w-[760px]">
      <p class="text-mute font-mono text-xs tracking-wide uppercase">Last updated: {updated}</p>
      <div class="mt-8"><Prose><slot /></Prose></div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: `src/pages/privacy.astro`**

```astro
---
import LegalLayout from '../layouts/LegalLayout.astro';
import { SITE } from '../consts';
const updated = 'June 1, 2026';
---
<LegalLayout
  title="Privacy Policy"
  description="How Ed25519.com handles data: cryptographic operations run locally in your browser and your keys are never transmitted."
  path="/privacy"
  updated={updated}
>
  <p>
    This Privacy Policy explains how {SITE.name} ("we", "us") handles information when you
    use this website. By using the site, you agree to this policy.
  </p>

  <h2>Cryptographic data stays on your device</h2>
  <p>
    All key generation, signing, and signature verification happen entirely in your browser
    using the WebCrypto API. Your private keys, messages, and signatures are never sent to
    or stored on our servers.
  </p>

  <h2>Information we collect</h2>
  <p>
    We do not require an account and do not ask for personal information to use the tools.
    We may collect anonymous, aggregate usage statistics (such as page views) through
    privacy-respecting analytics to understand traffic.
  </p>

  <h2>Cookies and advertising</h2>
  <p>
    We may use cookies for basic site functionality and analytics. If advertising is
    enabled, third-party vendors (including Google) may use cookies to serve ads based on
    your prior visits to this or other websites. You can opt out of personalized
    advertising via Google Ads Settings.
  </p>

  <h2>Third-party services</h2>
  <p>
    The contact form sends your message to us by email. Analytics and advertising, where
    enabled, are provided by third parties subject to their own privacy policies.
  </p>

  <h2>Your choices</h2>
  <p>
    You can disable cookies in your browser and use browser or extension controls to limit
    tracking. Disabling cookies does not affect the core in-browser tools.
  </p>

  <h2>Contact</h2>
  <p>Questions about this policy? Email us at {SITE.email}.</p>
</LegalLayout>
```

- [ ] **Step 3: `src/pages/terms.astro`**

```astro
---
import LegalLayout from '../layouts/LegalLayout.astro';
import { SITE } from '../consts';
const updated = 'June 1, 2026';
---
<LegalLayout
  title="Terms of Service"
  description="The terms governing your use of Ed25519.com, a free in-browser cryptographic toolkit provided as-is."
  path="/terms"
  updated={updated}
>
  <p>
    These Terms of Service govern your use of {SITE.name}. By using the site, you agree to
    these terms.
  </p>

  <h2>Use of the service</h2>
  <p>
    {SITE.name} provides free, in-browser tools for Ed25519 key generation, signing, and
    verification. You may use them for lawful purposes only.
  </p>

  <h2>No warranty</h2>
  <p>
    The service is provided "as is", without warranties of any kind, express or implied. We
    do not warrant that the service will be uninterrupted, error-free, or suitable for
    securing high-value assets. You are responsible for safeguarding any keys you generate.
  </p>

  <h2>Limitation of liability</h2>
  <p>
    To the fullest extent permitted by law, we are not liable for any loss or damage arising
    from your use of the service, including loss of keys, data, or funds.
  </p>

  <h2>Intellectual property</h2>
  <p>
    The site's content and design are owned by {SITE.name}. Third-party libraries are used
    under their respective licenses.
  </p>

  <h2>Changes</h2>
  <p>
    We may update these terms from time to time. Continued use after changes constitutes
    acceptance of the updated terms.
  </p>

  <h2>Contact</h2>
  <p>Questions about these terms? Email us at {SITE.email}.</p>
</LegalLayout>
```

- [ ] **Step 4: Build and verify**

Run: `pnpm build`
Expected: `dist/privacy/index.html` and `dist/terms/index.html` exist.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: legal layout + privacy & terms pages"
```

---

## Task 13: Contact page — `src/pages/contact.astro`

**Files:**
- Create: `src/pages/contact.astro`

> The form posts to `/api/contact` (built in Task 14). It works without JS (native form POST) and is enhanced with `fetch` for inline status. Includes a honeypot field.

- [ ] **Step 1: Implement the contact page**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHeader from '../components/sections/PageHeader.astro';
import Button from '../components/ui/Button.astro';
import { SITE } from '../consts';
---
<BaseLayout
  title="Contact"
  description="Get in touch with the Ed25519.com team — questions, feedback, or bug reports."
  path="/contact"
>
  <PageHeader
    eyebrow="contact"
    title="Get in touch."
    lead="Questions, feedback, or a bug to report? Send a message and we'll get back to you."
  />

  <section class="px-4 pb-24 sm:px-6">
    <div class="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-[1.4fr_1fr]">
      <form id="contact-form" method="POST" action="/api/contact" class="flex flex-col gap-5" novalidate>
        <div>
          <label for="name" class="text-mute font-mono text-xs tracking-wide uppercase">Name</label>
          <input id="name" name="name" type="text" required class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-[6px] border px-3 py-2.5 text-sm focus:outline-none" />
        </div>
        <div>
          <label for="email" class="text-mute font-mono text-xs tracking-wide uppercase">Email</label>
          <input id="email" name="email" type="email" required class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-[6px] border px-3 py-2.5 text-sm focus:outline-none" />
        </div>
        <div>
          <label for="message" class="text-mute font-mono text-xs tracking-wide uppercase">Message</label>
          <textarea id="message" name="message" rows="6" required class="border-hairline bg-canvas text-ink focus:border-hairline-strong mt-1 w-full rounded-[6px] border px-3 py-2.5 text-sm focus:outline-none"></textarea>
        </div>
        {/* Honeypot — hidden from humans, bots fill it. */}
        <input type="text" name="company" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />

        <div class="flex items-center gap-4">
          <Button id="contact-submit" type="submit" variant="primary">Send message</Button>
          <p id="contact-status" role="status" aria-live="polite" class="text-sm"></p>
        </div>
      </form>

      <aside class="border-hairline bg-canvas-soft rounded-[8px] border p-6">
        <p class="text-mute font-mono text-xs tracking-[0.14em] uppercase">// direct</p>
        <p class="text-body mt-3 text-sm leading-relaxed">
          Prefer email? Reach us at
          <a href={`mailto:${SITE.email}`} class="text-link underline underline-offset-2">{SITE.email}</a>.
        </p>
        <p class="text-body mt-4 text-sm leading-relaxed">
          We read every message but can't offer security audits or recover lost keys.
        </p>
      </aside>
    </div>
  </section>
</BaseLayout>

<script>
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const status = document.getElementById('contact-status');
  const submit = document.getElementById('contact-submit') as HTMLButtonElement | null;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!status || !submit) return;
    status.textContent = 'Sending…';
    status.className = 'text-body text-sm';
    submit.disabled = true;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (res.ok) {
        form.reset();
        status.textContent = 'Thanks — your message was sent.';
        status.className = 'text-sm text-[var(--color-success)]';
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        status.textContent = data.error ?? 'Something went wrong. Please try again.';
        status.className = 'text-sm text-[var(--color-error)]';
      }
    } catch {
      status.textContent = 'Network error. Please try again.';
      status.className = 'text-sm text-[var(--color-error)]';
    } finally {
      submit.disabled = false;
    }
  });
</script>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: `dist/contact/index.html` exists with the form.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: contact page with progressively-enhanced form"
```

---

## Task 14: Contact API route — `src/pages/api/contact.ts` (Cloudflare Email Routing)

**Files:**
- Create: `src/pages/api/contact.ts`
- Modify: `package.json`

> This is the only server route. It validates input (JSON or form-encoded), checks the honeypot, builds a MIME message with `mimetext`, and sends it through the Cloudflare Email Routing `send_email` binding (`SEB`, declared in `wrangler.jsonc` Task 1) to `CONTACT_TO_EMAIL`. The submitter's address is set as reply-to.

- [ ] **Step 1: Install the MIME builder**

```bash
pnpm add mimetext
```

- [ ] **Step 2: Implement `src/pages/api/contact.ts`**

```ts
import type { APIContext } from 'astro';

export const prerender = false;

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  company?: string; // honeypot
}

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function readPayload(request: Request): Promise<ContactPayload> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    return (await request.json()) as ContactPayload;
  }
  const form = await request.formData();
  return Object.fromEntries(form) as ContactPayload;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST({ request, locals }: APIContext) {
  let data: ContactPayload;
  try {
    data = await readPayload(request);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: silently succeed so bots don't learn anything.
  if (data.company) return json({ ok: true }, 200);

  const name = (data.name ?? '').trim();
  const email = (data.email ?? '').trim();
  const message = (data.message ?? '').trim();

  if (!name || !email || !message) return json({ error: 'All fields are required.' }, 400);
  if (!isEmail(email)) return json({ error: 'Please enter a valid email address.' }, 400);
  if (message.length > 5000) return json({ error: 'Message is too long.' }, 400);

  const env = locals.runtime?.env;
  if (!env?.SEB || !env.CONTACT_TO_EMAIL) {
    return json({ error: 'Contact is not configured. Email us directly.' }, 503);
  }

  // Built lazily so non-Cloudflare environments (e.g. unit runners) don't import the binding module.
  const { EmailMessage } = await import('cloudflare:email');
  const { createMimeMessage } = await import('mimetext');

  const sender = `noreply@ed25519.com`;
  const msg = createMimeMessage();
  msg.setSender({ name: 'Ed25519.com contact', addr: sender });
  msg.setRecipient(env.CONTACT_TO_EMAIL);
  msg.setHeader('Reply-To', `${name} <${email}>`);
  msg.setSubject(`Contact form: ${name}`);
  msg.addMessage({
    contentType: 'text/plain',
    data: `From: ${name} <${email}>\n\n${message}`,
  });

  try {
    const emailMessage = new EmailMessage(sender, env.CONTACT_TO_EMAIL, msg.asRaw());
    await env.SEB.send(emailMessage);
    return json({ ok: true }, 200);
  } catch (e) {
    return json({ error: 'Could not send your message. Please email us directly.' }, 502);
  }
}
```

> Notes for the implementer:
> - `cloudflare:email` only resolves in the Workers runtime; the dynamic `import()` keeps `pnpm build`/`pnpm check` from trying to statically resolve it in a Node context. If `pnpm check` still complains about the module, add `// @ts-expect-error cloudflare runtime module` directly above that import line.
> - The `sender` address must belong to a domain verified in Cloudflare Email Routing. `noreply@ed25519.com` works once the domain is set up (documented in Task 16). Locally, sending will fail with a clear error — that's expected; the route still builds.

- [ ] **Step 3: Build and verify the server route compiles into the worker**

Run: `pnpm check && pnpm build`
Expected: `check` passes (with the optional ts-expect-error if needed); build succeeds and now emits a populated `_worker.js` (or Pages function) for `/api/contact`.

- [ ] **Step 4: Local smoke test (validation path, no real email)**

Run: `pnpm build && npx wrangler pages dev dist` **or** `pnpm preview` (whichever matches the Task 1 layout), then:

```bash
curl -s -X POST http://localhost:8788/api/contact -H 'content-type: application/json' -d '{}' ; echo
curl -s -X POST http://localhost:8788/api/contact -H 'content-type: application/json' -d '{"name":"A","email":"bad","message":"hi"}' ; echo
```

Expected: first returns `{"error":"All fields are required."}` (400); second returns the invalid-email error (400). (A fully valid submission will return the 503 "not configured" or a send error locally unless Email Routing is wired — that's fine; real send is verified on deploy.)

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: contact API route via Cloudflare Email Routing"
```

---

## Task 15: Error page — `src/pages/500.astro`

**Files:**
- Create: `src/pages/500.astro`

> Phase 1 already ships `404.astro`. This adds the 500 fallback for server-route errors.

- [ ] **Step 1: Implement `500.astro`** (mirror the 404 structure)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Button from '../components/ui/Button.astro';
---
<BaseLayout title="Something went wrong" path="/500" noindex={true}>
  <section class="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center sm:px-6">
    <p class="text-mute font-mono text-sm">500</p>
    <h1 class="display-xl mt-4">Something went wrong.</h1>
    <p class="text-body mt-4 max-w-md">An unexpected error occurred. Please try again — the tools themselves run entirely in your browser and are unaffected.</p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <Button href="/" variant="primary">Back home</Button>
      <Button href="/#tool" variant="secondary">Open the tool</Button>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: `dist/500.html` exists.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: 500 error page"
```

---

## Task 16: Docs — DEPLOY (Email Routing + adapter) + AUTHORING + CLAUDE

**Files:**
- Modify: `docs/DEPLOY.md`, `CLAUDE.md`
- Create: `docs/AUTHORING.md`

- [ ] **Step 1: Update `docs/DEPLOY.md`** — replace the deferred-adapter note with the real adapter + Email Routing steps. Append:

````markdown
## Cloudflare adapter (Phase 2)

The site now uses `@astrojs/cloudflare`. All pages are static except
`/api/contact`, which runs as a server route. Config lives in `wrangler.jsonc`.

## Contact form — Cloudflare Email Routing (free)

1. Cloudflare dashboard → your `ed25519.com` zone → **Email** → **Email Routing** → enable.
   Cloudflare auto-adds the required MX/TXT records.
2. Add and **verify** a destination address (your inbox) — click the link Cloudflare emails you.
3. The `send_email` binding `SEB` is declared in `wrangler.jsonc` with
   `destination_address` set to that verified address.
4. Set the env var **`CONTACT_TO_EMAIL`** (Pages → Settings → Variables) to the same
   verified address.
5. Ensure the sender domain (`noreply@ed25519.com`) belongs to the verified zone.

Local note: sending only works on Cloudflare; locally the route validates input and
returns a clear "not configured" response, which is expected.

## Environment variables (full list)

| Name | Value | Notes |
|---|---|---|
| `PUBLIC_SITE_URL` | https://ed25519.com | canonical/OG base |
| `PUBLIC_ADSENSE_ID` | (pub-id) | optional; enables AdSense |
| `PUBLIC_ANALYTICS_ID` | (GA4/Plausible id) | optional |
| `CONTACT_TO_EMAIL` | your verified address | required for the contact form |
````

- [ ] **Step 2: Create `docs/AUTHORING.md`**

````markdown
# Writing blog posts

Posts live in `src/content/blog/` as Markdown (`.md`) or MDX (`.mdx`).

## Add a post (copy an existing one)

1. Duplicate any file in `src/content/blog/`, e.g. `what-is-ed25519.md`.
2. Rename it — **the filename becomes the URL slug** (`my-post.md` → `/blog/my-post/`).
3. Edit the frontmatter and body. Set `draft: false` when ready.
4. Commit. The post appears on `/blog`, in `rss.xml`, and in the sitemap automatically.

## Frontmatter schema

```yaml
---
title: 'Under ~70 characters for search results'
description: 'Meta description, roughly 50–170 characters.'
pubDate: 2026-06-01
updatedDate: 2026-06-10   # optional
tags: ['basics', 'tutorial']
author: 'Ed25519.com'     # optional, defaults to site author
ogImage: '/og/my-post.png' # optional, defaults to /og/default.png
draft: false              # true hides it from the build
---
```

The schema is enforced in `src/content.config.ts` — a bad/missing field fails the build
with a clear message.

## SEO checklist per post

- Unique, specific `title` and `description`.
- One `<h1>` is rendered from `title` automatically; use `##`/`###` in the body.
- Link to the tool (`/#tool`) and related posts where relevant.
- Use descriptive link text (not "click here").
- Add `updatedDate` when you materially revise a post.

## Rich content

Rename to `.mdx` to embed components or callouts. Plain `.md` is fine for normal posts.
````

- [ ] **Step 3: Update `CLAUDE.md`** — change Hosting + Blog sections to reflect Phase 2 reality:

Update the **Hosting** section to:

```markdown
## Hosting

Cloudflare via `@astrojs/cloudflare` (`wrangler.jsonc`). All pages are static except
`src/pages/api/contact.ts` (`prerender = false`), the one server route — it emails the
owner via the Cloudflare Email Routing `send_email` binding (`SEB`). See `docs/DEPLOY.md`.
```

Update the **Blog** section heading from "Blog (Phase 2)" to "Blog" and confirm the body
matches: posts in `src/content/blog/`, collection defined in `src/content.config.ts`,
copy-an-existing-post workflow (see `docs/AUTHORING.md`).

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "docs: deploy (Email Routing + adapter), authoring guide, CLAUDE updates"
```

---

## Task 17: Full verification + design audit

**Files:** none (verification only)

- [ ] **Step 1: Full gate**

Run: `pnpm install && pnpm check && pnpm test && pnpm build`
Expected: install clean; `check` no errors; all unit tests pass (Phase 1 + hex + ed25519 + reading-time); build produces all routes: `dist` (or per Task 1 layout) containing `index.html`, `404.html`, `500.html`, `about/`, `contact/`, `faq/`, `privacy/`, `terms/`, `blog/index.html`, the 4 `blog/<slug>/index.html`, `rss.xml`, `sitemap-index.xml`, and the `/api/contact` worker.

- [ ] **Step 2: Sitemap correctness**

Confirm `dist/sitemap-0.xml` includes the new pages and the 4 posts, and does NOT include `/api/contact` or draft posts.
Spot check: `grep -c "<loc>" dist/sitemap-0.xml` and eyeball the URLs.

- [ ] **Step 3: Manual review (dev), light + dark + mobile**

Run: `pnpm dev`. Walk every new page: About, Contact (submit empty → validation; submit valid → "sent" or clear "not configured" locally), FAQ (accordion), Privacy, Terms, Blog index, a post, RSS (`/rss.xml`). Confirm nav/footer links all resolve (no 404s now), theme toggle works with no FOUC, and layouts hold at mobile width.

- [ ] **Step 4: Design-guidelines audit**

Invoke the `web-design-guidelines` skill against `src/pages/{about,contact,faq,privacy,terms}.astro`, `src/pages/blog/**`, and the new layouts. Fix any flagged accessibility/UX issues (label associations, focus states, heading order, color contrast) and re-run `pnpm check && pnpm build`.

- [ ] **Step 5: Final commit**

```bash
pnpm format
git add -A
git commit -m "chore: Phase 2 verification + design-audit fixes"
```

---

## Phase 2 done — review gate

The full multi-page site is complete and deployable to Cloudflare Pages: landing + tool (Phase 1), plus About, Contact (working email form), FAQ, Privacy, Terms, a Markdown blog with 4 posts, RSS, sitemap, 404/500. Remaining before public launch (out of plan scope — user actions): replace identity placeholders in `src/consts.ts` (email, GitHub, twitter), set `PUBLIC_ADSENSE_ID`/`PUBLIC_ANALYTICS_ID`/`CONTACT_TO_EMAIL` in Cloudflare, enable Email Routing, and add real per-post OG images. Then merge `astro-migration` → `master`.

---

## Self-review notes (author)

- **Spec coverage:** spec §7 Phase-2 list → About (T11), Contact (T13) + Function (T14), FAQ (T10), Privacy/Terms (T12), Blog index (T7), Blog post (T8), RSS (T9), 4 posts (T4), `content.config.ts` (T3), 500 (T15); §8 authoring workflow → T16 (`AUTHORING.md`) + the copy-from-able starter posts; §9 SEO → article/breadcrumb/FAQ JSON-LD (T5), sitemap/RSS verification (T17); §10 contact endpoint → T14 (Email Routing, honeypot, validation, reply-to); §13 deploy doc → T16.
- **Grounded in real Phase 1 code:** uses the actual `BaseLayout` prop shape (`SeoInput` + `jsonLd`), `Seo.astro`, `resolveSeo`, `Button` variants/sizes, the `max-w-[1100px]` section pattern, the `// eyebrow` + `display-*` headings, the hairline-grid card trick, fixed `--color-term-*` tokens, and the existing FAQ accordion markup. New shared bits (`PageHeader`, `Prose`, `LegalLayout`, `PostLayout`) are introduced once and reused.
- **Adapter reality:** Task 1 re-adds the deferred adapter and **empirically inspects** the output layout (Step 4) before writing `wrangler.jsonc`, because adapter v13's emitted layout was the exact thing that broke Phase 1's assumptions. Two `wrangler.jsonc` variants are provided; the implementer picks the one matching the build.
- **noble v3 / Astro 6 consistency:** no `@noble/hashes`; Content Layer uses `src/content.config.ts`, `entry.id`, and `render()` (not `.slug`/`Astro.glob`). `@astrojs/mdx`/`@astrojs/rss` majors match Astro 6.
- **Type consistency:** `readingTime(content: string)` (T2) is called with `body` in `PostLayout` (T8); `articleJsonLd`/`breadcrumbJsonLd`/`faqPageJsonLd` signatures (T5) match their callers (T8/T10); `App.Locals` runtime + `Env` (`SEB`, `CONTACT_TO_EMAIL`) defined in T1 are consumed in T14; the `SEB` binding name matches `wrangler.jsonc`.
- **Placeholder scan:** no TBD/TODO/"add validation" hand-waves; every code step is complete. Identity values (`hello@ed25519.com`, twitter, GitHub) are intentional, labeled placeholders carried over from Phase 1; legal copy is intentionally generic and flagged for counsel review.
- **Cloudflare module caveat:** `cloudflare:email` is imported dynamically inside the route to avoid breaking `pnpm check`/`build` in Node; a fallback `@ts-expect-error` is documented if needed.
```
