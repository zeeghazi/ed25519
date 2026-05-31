# Ed25519.com — Astro Multi-Page Migration (Design Spec)

**Date:** 2026-06-01
**Status:** Approved for planning
**Author:** Zeeshan Tariq (with Claude)

## 1. Summary

Migrate `ed25519.com` from a single-page React + Vite app to a multi-page
**Astro 5** site, for SEO and Google AdSense eligibility. We keep the core
Ed25519 business logic (key generation, signing, verification) but port it from
React to **vanilla TypeScript** (zero client framework runtime). The visual
language follows the Vercel-inspired design system in `DESIGN.md` (ink + near-white
canvas, mesh-gradient hero, Geist + Geist Mono, stacked-shadow elevation), with a
**system-default theme plus a persisted light/dark toggle**.

Hosting moves from **GitHub Pages → Cloudflare Pages**. Every page is prerendered
to static HTML except a single contact API route, which runs as a Cloudflare
Function via `@astrojs/cloudflare`.

The build is sequenced in two phases. **Phase 1** delivers the foundation + a
fully working, deployable landing page. **Phase 2** delivers the remaining pages
and the blog.

### Non-goals (YAGNI)
No auth, no user accounts, no CMS (Markdown files only), no i18n, no e-commerce,
no database. The contact endpoint is the only server-side surface.

## 2. Success criteria

- Multi-page static site, each page independently crawlable/indexable.
- Lighthouse: Performance, SEO, Best Practices, Accessibility all ≥ 95 on the
  landing page; landing page ships **no framework JS** (only the noble crypto libs).
- Crypto tool is functionally equivalent to today's: generate keypair, sign a
  message, verify a signature — entirely client-side, keys never leave the browser.
- System-aware dark/light theme with no flash of incorrect theme (FOUC) and a
  persisted manual toggle.
- Mobile responsive across the DESIGN.md breakpoints.
- SEO + AdSense infrastructure present (sitemap, robots, ads.txt, JSON-LD, OG,
  RSS, reserved ad slots) and activated by dropping in env IDs — nothing live
  until IDs are provided.
- Blog authored as Markdown/MDX with a documented, low-friction workflow.
- Deploys cleanly to Cloudflare Pages; all GitHub Pages tooling removed.

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Astro 5 (latest) |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| Styling | Tailwind CSS v4 (CSS-first, via `@tailwindcss/vite`) |
| Crypto | `@noble/ed25519` ^2.x + `@noble/hashes` ^1.x |
| Content | Astro Content Collections + `@astrojs/mdx` |
| Fonts | Geist + Geist Mono, self-hosted via Fontsource |
| Sitemap | `@astrojs/sitemap` |
| Adapter | `@astrojs/cloudflare` (hybrid: static pages + 1 function) |
| Email (contact) | Cloudflare Email Routing (`send_email` binding from the Function) |
| Host | Cloudflare Pages |

Exact current versions confirmed against the Astro docs/MCP at implementation time.

## 4. Architecture & directory layout

```
src/
├── components/
│   ├── ui/        Button, Card, Badge, Pill, MeshGradient, ThemeToggle,
│   │              CodeSurface, Toast, AdSlot, SEO, Icon
│   ├── tool/      KeygenPanel, SignPanel, VerifyPanel, ToolSection
│   └── sections/  Hero, FeatureGrid, FaqAccordion, CtaBand, Nav, Footer
├── layouts/       BaseLayout, LegalLayout, PostLayout
├── lib/           ed25519.ts, hex.ts, clipboard.ts, theme.ts, seo.ts, reading-time.ts
├── content/       blog/*.md(x)
├── content.config.ts   Astro 5 Content Layer collection + Zod schema
├── pages/         index.astro, about.astro, contact.astro, faq.astro,
│                  privacy.astro, terms.astro,
│                  blog/index.astro, blog/[...slug].astro,
│                  404.astro, 500.astro, rss.xml.ts, api/contact.ts
├── styles/        global.css   (@theme tokens, dark variant, base, components)
└── consts.ts      SITE config: name, url, description, nav, socials (placeholders)
public/            favicon set, manifest.json, robots.txt, ads.txt, og/*.png
```

**Rendering model:** Astro static output by default; only `pages/api/contact.ts`
sets `export const prerender = false`. The Cloudflare adapter packages that single
route as a Function; everything else is static HTML/CSS/JS on the CDN.

### Files removed from the old project
`src/components/*.tsx`, `src/pages/HomePage.tsx`, `src/main.tsx`, `index.html`
(root SPA), `vite.config.ts`, the React-oriented `eslint.config.js`, the
`tsconfig.app.json`/`tsconfig.node.json` split, and React/Vite/`gh-pages`
dependencies. The crypto logic is preserved by porting into `src/lib/ed25519.ts`.
Git history retains the old implementation.

## 5. Design system (DESIGN.md → Tailwind v4)

Tokens defined as `@theme` variables in `src/styles/global.css`:

- **Color ladder:** `canvas` / `canvas-soft` / `canvas-soft-2` / `ink` surfaces;
  `ink` / `body` / `mute` text; `hairline` / `hairline-strong` dividers; `link`
  blue; semantic `error` / `warning` (+ soft/deep); the three gradient pairs
  (develop, preview, ship). Each semantic token has a **dark-mode value** so
  surfaces flip correctly under `.dark`.
- **Typography:** Geist (weights 400/500/600 — never 700) and Geist Mono; the full
  display→caption→code scale with the brand's aggressive negative letter-spacing
  (-2.4px at 48px hero down to -0.28px body-sm). Headlines sentence-case.
- **Spacing/radii/shadows:** 4px base scale up to the 192px `section`; radius scale
  incl. `pill` (100px) for marketing CTAs and `sm` (6px) for compact controls;
  the five stacked-shadow elevation levels with inset hairline rings (no single
  heavy drop shadows).
- **Mesh gradient:** a reusable `<MeshGradient>` component (CSS multi-stop
  radial/conic blend across the four gradient stops) used **at hero scale only**;
  never miniaturized, never reduced to one color (per DESIGN.md don'ts).

**Dark mode strategy:**
- `@custom-variant dark (&:where(.dark, .dark *));` in `global.css`.
- An inline, render-blocking `<head>` script reads `localStorage.theme`, else
  `prefers-color-scheme`, and sets `.dark` on `<html>` **before first paint**
  (no FOUC).
- `ThemeToggle` toggles the class and persists to `localStorage`; respects a
  `prefers-color-scheme` change when the user hasn't chosen explicitly.

A `web-design-guidelines` (Vercel) audit is run before sign-off; gotchas from the
`tailwind-4-docs` skill (e.g. `@theme` must be top-level, important modifier at the
end, `@utility` for custom utilities, class-detection limits) are observed.

## 6. The crypto tool (vanilla TS, theme-adaptive)

**`src/lib/ed25519.ts`** ports today's logic into pure, testable functions:
- `sha512` wired into `@noble/ed25519` **once** at module load (fixes the current
  triplicated `ed.etc.sha512Sync` setup).
- `generateKeypair(): { privateKeyHex, publicKeyHex }`
- `signMessage(message: string, privateKeyHex: string): string` (sig hex)
- `verifySignature(signatureHex, message, publicKeyHex): boolean`
- Validation: private/public key = 64 hex chars, signature = 128 hex chars;
  throws typed errors with human messages.
- `src/lib/hex.ts`: `bytesToHex` / `hexToBytes` helpers.

**UI:** `KeygenPanel`, `SignPanel`, `VerifyPanel` are `.astro` components, each with
a typed `<script>` that imports from `lib/`. No React/Preact. State is local DOM
state. Behavior parity with today: generate, copy buttons (with copied state),
inline validation, char counts, clear, and toast feedback (`lib/clipboard.ts`,
`Toast`). Surfaces are **theme-adaptive** — light cards in light mode, dark ink
"code-editor" surfaces for key/signature output in dark mode; all key/sig/command
values set in Geist Mono.

**Security:** all operations run in-browser; private keys never leave the page.
This invariant is stated visibly in the tool UI and must not be broken by any
future feature (no analytics/telemetry on key material).

## 7. Pages & content

### Phase 1 (foundation + landing) — deployable
- Project scaffold, Cloudflare adapter, Tailwind v4 tokens, Geist fonts, dark mode.
- `BaseLayout`, `Nav` (responsive, hamburger + full-overlay on mobile), `Footer`
  (multi-column, mono eyebrows), `ThemeToggle`, `SEO` component.
- **Landing page** (`index.astro`): mesh-gradient `Hero`; the full
  generate/sign/verify tool; supporting `FeatureGrid` ("what is Ed25519 / why it's
  safe / RFC 8032"); a short FAQ teaser; `CtaBand`; reserved `AdSlot`s.
- `404.astro` (on-brand).
- SEO/ads scaffolding: `robots.txt`, `ads.txt` (placeholder), `@astrojs/sitemap`,
  `WebApplication`/`WebSite`/`Organization` JSON-LD, OG defaults.

### Phase 2 (secondary pages + blog)
- `about.astro` — project mission/what Ed25519.com is (placeholder-but-real copy).
- `contact.astro` — accessible form posting to `api/contact.ts` (Cloudflare
  Function) + email/social links; progressive enhancement (works without JS).
- `faq.astro` — `FaqAccordion`, with `FAQPage` JSON-LD.
- `privacy.astro`, `terms.astro` — `LegalLayout`, real placeholder legal copy
  tuned for AdSense review (cookies/ads disclosure).
- `blog/index.astro` — post list (cards, tags, dates, reading time).
- `blog/[...slug].astro` — `PostLayout` with `Article` + `BreadcrumbList` JSON-LD.
- `rss.xml.ts` — RSS feed.
- 4 starter posts (Markdown, marked editable/replaceable):
  1. *What is Ed25519? A plain-English guide to modern digital signatures*
  2. *Ed25519 vs RSA vs ECDSA — which signature algorithm should you use?*
  3. *How Ed25519 key generation actually works (and why it's safe)*
  4. *Signing and verifying messages with Ed25519: a practical walkthrough*

## 8. Blog authoring workflow

**Content Collection** `blog`, defined via the Astro 5 Content Layer API in
`src/content.config.ts` (posts in `src/content/blog/`), with a Zod schema:

```ts
{
  title: string,            // <= ~60 chars for SERP
  description: string,      // meta description, ~150–160 chars
  pubDate: Date,
  updatedDate: Date | null,
  tags: string[],
  author: string,           // defaults to SITE author placeholder
  ogImage: string | null,   // falls back to a generated/default OG image
  draft: boolean,           // true => excluded from production build
}
```

**Authoring paths (all low-friction) — copy-an-existing-post workflow:**
- **By hand:** duplicate any existing post in `src/content/blog/`, rename the file
  (the filename becomes the slug), update the frontmatter (title, description,
  `pubDate`, tags) and body, set `draft: false`, commit. No CLI/scaffold step.
- **AI-written:** paste the model's Markdown into the body of a copied file and
  fill the frontmatter — no reformatting (Markdown is the native LLM output format).
- **Rich posts:** rename to `.mdx` to embed components/callouts or the live tool.
- `draft: true` hides a post from the list, sitemap, and RSS until it's ready.
- The 4 starter posts double as clean, commented templates to copy from. A short
  `docs/AUTHORING.md` documents the frontmatter schema, the SEO checklist, and
  image conventions.

**Per-post SEO:** canonical URL, meta description, `Article` + `BreadcrumbList`
JSON-LD, `datePublished`/`dateModified`, author, reading time, tags, OG/Twitter
image, semantic heading order, descriptive image `alt`, and internal links. Posts
are auto-included in sitemap + RSS unless `draft`.

> A browser-based Git CMS (Pages CMS / Decap) can be added later without changing
> the content format. Deferred (YAGNI).

## 9. SEO & AdSense infrastructure (structure now, keys later)

- **`<SEO>` component** per page: `<title>`, meta description, canonical, robots,
  OpenGraph, Twitter card, and a `JsonLd` slot.
- **Global JSON-LD:** `WebSite` + `Organization` (sitewide), `WebApplication`
  (home), `Article` + `BreadcrumbList` (posts), `FAQPage` (faq).
- **Crawl/feeds:** `@astrojs/sitemap`, `public/robots.txt` (references sitemap),
  `rss.xml`.
- **AdSense:** `public/ads.txt` (placeholder publisher line), an `<AdSlot>`
  component that **reserves height to avoid CLS** and renders nothing until
  `PUBLIC_ADSENSE_ID` is set; the AdSense loader script is injected in `BaseLayout`
  **only when** `PUBLIC_ADSENSE_ID` exists.
- **Analytics:** loaded only when `PUBLIC_ANALYTICS_ID` is set (GA4 or Plausible —
  decided when activated). Never touches key material.

**Environment variables**
| Var | Purpose | Phase |
|---|---|---|
| `PUBLIC_SITE_URL` | canonical/OG/sitemap base | 1 |
| `PUBLIC_ADSENSE_ID` | AdSense publisher id (optional) | 1 (scaffold) |
| `PUBLIC_ANALYTICS_ID` | analytics id (optional) | 1 (scaffold) |
| `CONTACT_TO_EMAIL` | contact recipient (your verified Email Routing address) | 2 |

## 10. Contact endpoint (Phase 2)

`src/pages/api/contact.ts` (`prerender = false`) → Cloudflare Function:
validates name/email/message, honeypot field + minimal rate-limit, sends mail via
the Cloudflare **Email Routing `send_email` binding** to `CONTACT_TO_EMAIL` (a
verified Email Routing destination — the form only ever emails the site owner, so
the "send to verified addresses only" limitation does not apply), returns JSON.
The contact form posts normally (works without JS) and is enhanced with `fetch`
for inline success/error states.

Setup is free and single-vendor: enable Email Routing on the Cloudflare zone, add
+ verify the destination address, and declare the `send_email` binding in
`wrangler.toml`. Cloudflare auto-adds the required MX/TXT records. The submitter's
address is set as the email `reply-to` so replies go straight to them.

## 11. Error pages

- `404.astro` — on-brand not-found with search/nav back to key pages (Phase 1).
- Cloudflare serves the static `404.html`. A `500.astro` is included in Phase 2
  for build/runtime error fallback where supported.

## 12. Tooling & scripts

`package.json` scripts (GitHub Pages tooling removed):
```
dev      astro dev
build    astro build
preview  astro preview        # or: wrangler pages dev for function parity
check    astro check          # type + content checks
format   prettier --write .
```
Removed: `gh-pages` dependency, `predeploy`/`deploy` scripts, the `docs/`-build
convention. Prettier keeps the existing config + `prettier-plugin-astro`.

## 13. Deployment (Cloudflare Pages)

Deliver `docs/DEPLOY.md` covering:
- Connect repo to Cloudflare Pages; build command `pnpm build`, output dir
  `dist`, framework preset Astro.
- `@astrojs/cloudflare` adapter config + `wrangler.toml`/compat flags, incl. the
  Email Routing `send_email` binding.
- Enabling Cloudflare Email Routing: add + verify the destination address.
- Env vars & secrets (table in §9) set in the Pages dashboard.
- Custom domain `ed25519.com` DNS steps (documented, **not** executed by us).
- Local function parity via `wrangler pages dev`.

## 14. Phasing & review gates

1. **Phase 1** built → review/approve a working deployable landing site.
2. **Phase 2** built → review.
3. `web-design-guidelines` audit + Lighthouse/perf pass before final sign-off.

Each phase becomes its own implementation plan via the writing-plans skill.

## 15. Risks & mitigations

- **Tailwind v4 + Astro wiring** — use `@tailwindcss/vite`; verify against
  `tailwind-4-docs` gotchas. Mitigated by doing it first in Phase 1.
- **FOUC on theme** — render-blocking inline head script sets the class pre-paint.
- **noble sha512 setup** — wired once in `lib/ed25519.ts`; covered by a smoke test.
- **AdSense review** — real legal/privacy/contact/about pages + sufficient blog
  content; ads inactive until approved.
- **Cloudflare function vs static** — only the contact route is server-rendered;
  keeps the SEO surface fully static.
```
