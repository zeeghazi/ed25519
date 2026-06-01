# Ed25519.com Phase 3 — Dedicated Tool Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three SEO-focused, keyword-rich landing pages — `/ed25519-key-generator`, `/ed25519-sign-message`, `/ed25519-verify-signature` — that each embed the live client-side tool for one action plus unique educational content (how-to, a real RFC-8032 worked example, notes, FAQ, cross-links).

**Architecture:** Reuse the existing vanilla-TS tool panels (`KeygenPanel` / `SignPanel` / `VerifyPanel`) by extracting the terminal "chrome" into a reusable `ConsoleFrame` and giving each panel a `standalone` prop so it can render outside the home page's tabbed `ToolSection`. The home page is unchanged. Each page renders through `BaseLayout` with per-page structured data (`WebApplication` + `HowTo` + `FAQPage` + `BreadcrumbList`). The footer "Tools" links repoint from home `#anchors` to these three pages.

**Tech Stack:** Astro 6, Tailwind v4 CSS-first, `@noble/ed25519` v3 async, existing Phase 1/2 conventions. No new dependencies.

---

## Context: existing conventions to follow (read before starting)

- **Repo:** `/home/zee/oWork/ed25519.com`, branch `astro-migration`. pnpm. Prettier: **tabs, single quotes, no semicolons** — run `pnpm format` before every commit.
- **Verification:** `pnpm check` (expect `0 errors`; **3 pre-existing hints** about `is:inline` scripts are normal — leave them), `pnpm test` (Vitest), `pnpm build`.
- **Build output:** static HTML lands under `dist/client/` (e.g. `dist/client/ed25519-key-generator/index.html`); the server worker is `dist/server/`. NOT `dist/` root.
- **Layout shell:** `src/layouts/BaseLayout.astro` — props `title`, `description`, `path`, `ogImage?`, `noindex?`, `jsonLd?` (object or array). All pages render through it.
- **PageHeader:** `src/components/sections/PageHeader.astro` — props `title`, `lead?`, `width?: 'wide' | 'narrow'` (wide = `max-w-[1100px]`, narrow = `max-w-[760px]`), `illustration?: 'private' | 'fast' | 'standards' | 'mail' | 'chat'`. There is NO eyebrow.
- **SEO builders:** `src/lib/seo.ts` exports `webApplicationJsonLd()`, `websiteJsonLd()`, `articleJsonLd`, `breadcrumbJsonLd(items)`, `faqPageJsonLd(faqs)`. Phase 3 adds `howToJsonLd`.
- **Crypto lib:** `src/lib/ed25519.ts` exports `generateKeypair()`, `signMessage(message, privateKeyHex)`, `verifySignature(signatureHex, message, publicKeyHex)`. Messages are encoded with `new TextEncoder().encode(message)` (UTF-8). `src/lib/hex.ts` exports `bytesToHex`, `hexToBytes`, `isHex`. `@noble/ed25519` is imported as `import * as ed from '@noble/ed25519'` (async API: `getPublicKeyAsync`, `signAsync`, `verifyAsync`). Do NOT import `@noble/hashes`.
- **Tokens:** `text-ink/body/mute`, `bg-canvas/canvas-soft/canvas-soft-2`, `border-hairline/hairline-strong`, `text-link`; fixed terminal tokens `--color-term-bg/bg-2/border/fg/dim/prompt/danger/accent` used via `bg-[var(--color-term-bg)]` etc. (these do NOT invert in dark mode). `display-xl/lg/md` headings. Buttons via `src/components/ui/Button.astro` (`variant`, `size`, `href`, `type`, `id`).
- **Section pattern:** `<section class="px-4 py-… sm:px-6"><div class="mx-auto max-w-[…]">…</div></section>`.

---

## File structure (Phase 3 additions)

```
src/lib/seo.ts                              MODIFY: add howToJsonLd
src/lib/example-vector.ts                   CREATE: shared RFC-8032 §7.1 Test-2 worked-example constants
tests/example-vector.test.ts                CREATE: proves the vector derives/signs/verifies (TDD)
src/components/tool/ConsoleFrame.astro       CREATE: terminal chrome (extracted from ToolSection)
src/components/tool/ToolSection.astro        MODIFY: render through ConsoleFrame (behavior-preserving)
src/components/tool/KeygenPanel.astro        MODIFY: add `standalone` prop
src/components/tool/SignPanel.astro          MODIFY: add `standalone` prop
src/components/tool/VerifyPanel.astro        MODIFY: add `standalone` prop
src/components/ui/FaqAccordion.astro         CREATE: reusable accordion (extracted from faq.astro)
src/pages/faq.astro                          MODIFY: use FaqAccordion
src/components/ui/Illustration.astro         MODIFY: add `check` illustration (verify page)
src/components/sections/RelatedTools.astro   CREATE: cross-links between the tool pages
src/pages/ed25519-key-generator.astro        CREATE
src/pages/ed25519-sign-message.astro         CREATE
src/pages/ed25519-verify-signature.astro     CREATE
src/consts.ts                                MODIFY: repoint footer "Tools" links
```

---

## Task 1: `howToJsonLd` builder

**Files:**
- Modify: `src/lib/seo.ts`

- [ ] **Step 1: Append `howToJsonLd` after the existing `faqPageJsonLd` export** (keep tabs/single quotes/no semicolons):

```ts
export function howToJsonLd(opts: {
	name: string
	description: string
	steps: { name: string; text: string }[]
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: opts.name,
		description: opts.description,
		step: opts.steps.map((s, i) => ({
			'@type': 'HowToStep',
			position: i + 1,
			name: s.name,
			text: s.text,
		})),
	}
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: `0 errors` (3 pre-existing hints OK).

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: howToJsonLd structured-data builder"
```

---

## Task 2: Worked-example vector module + verifying test (TDD)

**Why:** The pages display a worked example. The values MUST actually verify (and never silently drift). We use the public **RFC 8032 §7.1 Test 2** vector. Its message is the single byte `0x72`, which is ASCII `'r'`; since the tool UTF-8-encodes the message, signing the text `"r"` in the live tool reproduces this exact signature. A unit test proves derive/sign/verify.

**Files:**
- Create: `src/lib/example-vector.ts`, `tests/example-vector.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/example-vector.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { EXAMPLE } from '../src/lib/example-vector'
import { signMessage, verifySignature } from '../src/lib/ed25519'
import { getPublicKeyAsync } from '@noble/ed25519'
import { bytesToHex, hexToBytes } from '../src/lib/hex'

describe('EXAMPLE worked-example vector', () => {
	it('public key derives from the private seed', async () => {
		const pub = await getPublicKeyAsync(hexToBytes(EXAMPLE.privateKeyHex))
		expect(bytesToHex(pub)).toBe(EXAMPLE.publicKeyHex)
	})

	it('signing the message reproduces the signature (Ed25519 is deterministic)', async () => {
		const sig = await signMessage(EXAMPLE.message, EXAMPLE.privateKeyHex)
		expect(sig).toBe(EXAMPLE.signatureHex)
	})

	it('the signature verifies against the public key + message', async () => {
		const ok = await verifySignature(
			EXAMPLE.signatureHex,
			EXAMPLE.message,
			EXAMPLE.publicKeyHex
		)
		expect(ok).toBe(true)
	})

	it('a tampered message fails verification', async () => {
		const ok = await verifySignature(
			EXAMPLE.signatureHex,
			EXAMPLE.message + 'x',
			EXAMPLE.publicKeyHex
		)
		expect(ok).toBe(false)
	})
})
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '../src/lib/example-vector'`.

- [ ] **Step 3: Implement `src/lib/example-vector.ts`** (RFC 8032 §7.1 Test 2):

```ts
// RFC 8032 §7.1 Ed25519 Test 2 — a public, reproducible test vector.
// The message byte is 0x72 (ASCII 'r'); because the tool UTF-8-encodes the
// message, signing the text 'r' in the live tool reproduces this signature.
// tests/example-vector.test.ts proves these values derive/sign/verify.
export const EXAMPLE = {
	privateKeyHex:
		'4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
	publicKeyHex:
		'3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c',
	message: 'r',
	signatureHex:
		'92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00',
} as const
```

- [ ] **Step 4: Run the test — verify it passes**

Run: `pnpm test`
Expected: PASS (Phase 2's 17 tests + these 4).

> If any assertion fails, the displayed constant is wrong. The library output is authoritative: read the value the failing assertion received (`pnpm test` prints "expected … received …") and paste that into `example-vector.ts`, then re-run until green. Do NOT change the test to match a bad constant.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: RFC 8032 worked-example vector + verifying test (TDD)"
```

---

## Task 3: Extract `ConsoleFrame` + refactor `ToolSection` (behavior-preserving)

**Files:**
- Create: `src/components/tool/ConsoleFrame.astro`
- Modify: `src/components/tool/ToolSection.astro`

- [ ] **Step 1: Create `src/components/tool/ConsoleFrame.astro`** (the terminal window chrome; content goes in the slot):

```astro
---
interface Props {
	label?: string
	class?: string
}
const { label = 'ed25519 — secure key toolkit', class: cls = '' } =
	Astro.props
---

<div
	class:list={[
		'console-shadow overflow-hidden rounded-[10px] border border-[var(--color-term-border)] bg-[var(--color-term-bg)]',
		cls,
	]}
>
	<div
		class="flex h-11 items-center gap-3 border-b border-[var(--color-term-border)] bg-[var(--color-term-bg-2)] px-4"
	>
		<div class="flex items-center gap-2" aria-hidden="true">
			<span class="h-3 w-3 rounded-full bg-[#ff6b81]/70"></span>
			<span class="h-3 w-3 rounded-full bg-[#f5a623]/70"></span>
			<span class="h-3 w-3 rounded-full bg-[#2dd4a8]/80"></span>
		</div>
		<span class="font-mono text-xs text-[var(--color-term-dim)]">{label}</span
		>
		<span
			class="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-[var(--color-term-dim)] uppercase"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-[var(--color-term-prompt)]"
			></span>
			client-side
		</span>
	</div>
	<slot />
</div>
```

- [ ] **Step 2: Refactor `ToolSection.astro` to use it.** Replace the markup block that currently starts at the console `<div class="console-shadow …">` and ends at its matching closing `</div>` (the title-bar div + the tablist div + the panels `<div class="p-5 sm:p-7">…</div>`) so the **title bar comes from `ConsoleFrame`** and the tablist + panels become its slotted children. Add the import. The result of `ToolSection.astro`'s template should be:

```astro
---
import KeygenPanel from './KeygenPanel.astro'
import SignPanel from './SignPanel.astro'
import VerifyPanel from './VerifyPanel.astro'
import ConsoleFrame from './ConsoleFrame.astro'

const tabs = [
	{ id: 'generate', label: 'generate' },
	{ id: 'sign', label: 'sign' },
	{ id: 'verify', label: 'verify' },
] as const
---

<section id="tool" class="relative scroll-mt-20 px-4 pb-8 sm:px-6">
	<div class="mx-auto max-w-[1100px]">
		<ConsoleFrame>
			<!-- Tabs -->
			<div
				role="tablist"
				aria-label="Ed25519 tools"
				class="flex border-b border-[var(--color-term-border)] bg-[var(--color-term-bg-2)]/40"
			>
				{
					tabs.map((t, i) => (
						<button
							role="tab"
							id={`tab-${t.id}`}
							data-tab={t.id}
							aria-selected={i === 0 ? 'true' : 'false'}
							aria-controls={t.id}
							class="inline-flex h-10 items-center border-r border-[var(--color-term-border)] px-4 font-mono text-xs tracking-wide text-[var(--color-term-dim)] transition-colors hover:text-[var(--color-term-fg)] aria-selected:bg-[var(--color-term-bg)] aria-selected:text-[var(--color-term-fg)] aria-selected:shadow-[inset_0_-2px_0_0_var(--color-term-prompt)]"
						>
							{t.label}
						</button>
					))
				}
			</div>

			<!-- Panels -->
			<div class="p-5 sm:p-7">
				<KeygenPanel />
				<SignPanel />
				<VerifyPanel />
			</div>
		</ConsoleFrame>

		<p
			class="text-mute mt-3 text-center font-mono text-[11px] tracking-wide"
		>
			RFC 8032 · EdDSA · built on @noble/ed25519 — keys never leave your
			browser
		</p>
	</div>
</section>
```

Leave the entire `<script>` block at the bottom of `ToolSection.astro` **unchanged** (it still queries `[role="tablist"]`, `[role="tab"]`, `[data-panel]` from the document, which still exist).

- [ ] **Step 3: Build and verify the home tool is unchanged**

Run: `pnpm build`
Expected: success. Verify the home console still has all three tabs and the title bar:
`grep -c 'role="tab"' dist/client/index.html` → 3
`grep -c 'client-side' dist/client/index.html` → 1 (the title bar still renders)

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "refactor: extract ConsoleFrame from ToolSection (behavior-preserving)"
```

---

## Task 4: Add a `standalone` prop to the three tool panels

**Why:** Outside the tabbed `ToolSection`, a panel must render visible (not `hidden`) and must not claim `role="tabpanel"`/`aria-labelledby` pointing at tab buttons that don't exist on the page.

**Files:**
- Modify: `src/components/tool/KeygenPanel.astro`, `src/components/tool/SignPanel.astro`, `src/components/tool/VerifyPanel.astro`

- [ ] **Step 1: `KeygenPanel.astro`** — add the prop and apply it to the wrapper. Change the frontmatter and the opening `<div>`:

Frontmatter (replace the existing `---` block):
```astro
---
import Button from '../ui/Button.astro'

interface Props {
	standalone?: boolean
}
const { standalone = false } = Astro.props
---
```

Opening wrapper (replace `<div data-panel="generate" role="tabpanel" aria-labelledby="tab-generate">`):
```astro
<div
	data-panel="generate"
	role={standalone ? undefined : 'tabpanel'}
	aria-labelledby={standalone ? undefined : 'tab-generate'}
>
```

- [ ] **Step 2: `SignPanel.astro`** — same pattern, but this panel also carries `hidden` in tabbed mode.

Frontmatter:
```astro
---
import Button from '../ui/Button.astro'

interface Props {
	standalone?: boolean
}
const { standalone = false } = Astro.props
---
```

Opening wrapper (replace `<div data-panel="sign" role="tabpanel" aria-labelledby="tab-sign" hidden>`):
```astro
<div
	data-panel="sign"
	role={standalone ? undefined : 'tabpanel'}
	aria-labelledby={standalone ? undefined : 'tab-sign'}
	hidden={standalone ? undefined : true}
>
```

- [ ] **Step 3: `VerifyPanel.astro`** — same.

Frontmatter:
```astro
---
import Button from '../ui/Button.astro'

interface Props {
	standalone?: boolean
}
const { standalone = false } = Astro.props
---
```

Opening wrapper (replace `<div data-panel="verify" role="tabpanel" aria-labelledby="tab-verify" hidden>`):
```astro
<div
	data-panel="verify"
	role={standalone ? undefined : 'tabpanel'}
	aria-labelledby={standalone ? undefined : 'tab-verify'}
	hidden={standalone ? undefined : true}
>
```

- [ ] **Step 4: Build and verify the home tool still behaves**

Run: `pnpm build`
Expected: success. Home unchanged: `grep -c 'data-panel="sign"' dist/client/index.html` → 1, and the sign/verify panels still render `hidden` on the home page: `grep -c 'hidden' dist/client/index.html` ≥ 2 (the sign + verify panels). `pnpm check` → 0 errors.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: standalone prop on Keygen/Sign/Verify panels"
```

---

## Task 5: `FaqAccordion` component + refactor `faq.astro`

**Why:** Each tool page has a mini-FAQ; `faq.astro` already has the accordion markup. Extract it so all four pages share one component (DRY).

**Files:**
- Create: `src/components/ui/FaqAccordion.astro`
- Modify: `src/pages/faq.astro`

- [ ] **Step 1: Create `src/components/ui/FaqAccordion.astro`:**

```astro
---
interface Props {
	faqs: { q: string; a: string }[]
}
const { faqs } = Astro.props
---

<div
	class="divide-hairline border-hairline bg-canvas divide-y rounded-[8px] border"
>
	{
		faqs.map((f) => (
			<details class="group p-5">
				<summary class="text-ink flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
					{f.q}
					<span class="text-mute border-hairline group-open:border-hairline-strong group-open:text-ink inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border font-mono text-sm transition-transform group-open:rotate-45">
						+
					</span>
				</summary>
				<p class="text-body mt-3 text-sm leading-relaxed">{f.a}</p>
			</details>
		))
	}
</div>
```

- [ ] **Step 2: Refactor `faq.astro`** — import the component and replace the inline `<div class="divide-hairline …">…</div>` block (the accordion) with `<FaqAccordion faqs={faqs} />`. Add `import FaqAccordion from '../components/ui/FaqAccordion.astro'` to the frontmatter. The FAQ section body becomes:

```astro
	<section class="px-4 pb-24 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<FaqAccordion faqs={faqs} />
		</div>
	</section>
```

(The `faqs` array and `faqPageJsonLd(faqs)` in `faq.astro` stay as-is.)

- [ ] **Step 3: Build and verify FAQ unchanged**

Run: `pnpm build`
Expected: success. `grep -c 'FAQPage' dist/client/faq/index.html` → 1; `grep -c '<details' dist/client/faq/index.html` → 7.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "refactor: extract FaqAccordion, reuse in faq page"
```

---

## Task 6: `check` illustration + `RelatedTools` cross-links component

**Files:**
- Modify: `src/components/ui/Illustration.astro`
- Create: `src/components/sections/RelatedTools.astro`

- [ ] **Step 1: Add a `check` illustration.** In `Illustration.astro`, extend the `name` union and add the branch.

Change the Props union to include `check`:
```ts
	name: 'private' | 'fast' | 'standards' | 'mail' | 'chat' | 'check'
```

Add this block immediately before the closing `</svg>`:
```astro
	{
		name === 'check' && (
			<>
				<circle cx="60" cy="54" r="30" />
				<path class="text-hairline-strong" d="M46 84 40 104 60 96 80 104 74 84" />
				<path d="M47 55 56 64 74 44" stroke={accent} />
			</>
		)
	}
```

- [ ] **Step 2: Create `src/components/sections/RelatedTools.astro`** (links to the other two tool pages + the most relevant blog post; `current` hides the page you're on):

```astro
---
interface Props {
	current: 'generate' | 'sign' | 'verify'
}
const { current } = Astro.props

const tools = [
	{
		key: 'generate',
		label: 'Key generator',
		href: '/ed25519-key-generator',
		blurb: 'Create a fresh Ed25519 keypair in your browser.',
	},
	{
		key: 'sign',
		label: 'Sign a message',
		href: '/ed25519-sign-message',
		blurb: 'Produce a signature with your private key.',
	},
	{
		key: 'verify',
		label: 'Verify a signature',
		href: '/ed25519-verify-signature',
		blurb: 'Check a signature against a public key.',
	},
].filter((t) => t.key !== current)
---

<section class="px-4 pb-24 sm:px-6">
	<div class="mx-auto max-w-[760px]">
		<h2 class="text-ink text-lg font-semibold tracking-tight">
			Explore the rest of the toolkit
		</h2>
		<div
			class="border-hairline bg-hairline mt-4 grid gap-px overflow-hidden rounded-[8px] border sm:grid-cols-2"
		>
			{
				tools.map((t) => (
					<a
						href={t.href}
						class="bg-canvas hover:bg-canvas-soft group flex flex-col p-6 transition-colors"
					>
						<span class="text-ink font-semibold tracking-tight group-hover:underline">
							{t.label}
						</span>
						<span class="text-body mt-1.5 text-sm leading-relaxed">
							{t.blurb}
						</span>
					</a>
				))
			}
		</div>
		<p class="text-mute mt-4 text-sm">
			New to Ed25519? Start with
			<a
				href="/blog/what-is-ed25519/"
				class="text-link underline underline-offset-2">the plain-English guide</a
			>.
		</p>
	</div>
</section>
```

- [ ] **Step 3: Type-check + build**

Run: `pnpm check && pnpm build`
Expected: `0 errors`; build succeeds.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: check illustration + RelatedTools cross-links component"
```

---

## Task 7: Key generator page — `/ed25519-key-generator`

**Files:**
- Create: `src/pages/ed25519-key-generator.astro`

- [ ] **Step 1: Implement the page:**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import PageHeader from '../components/sections/PageHeader.astro'
import ConsoleFrame from '../components/tool/ConsoleFrame.astro'
import KeygenPanel from '../components/tool/KeygenPanel.astro'
import FaqAccordion from '../components/ui/FaqAccordion.astro'
import RelatedTools from '../components/sections/RelatedTools.astro'
import { EXAMPLE } from '../lib/example-vector'
import {
	webApplicationJsonLd,
	howToJsonLd,
	faqPageJsonLd,
	breadcrumbJsonLd,
} from '../lib/seo'

const path = '/ed25519-key-generator'
const title = 'Ed25519 key generator'
const description =
	'Generate a secure Ed25519 keypair (32-byte private + public key) in your browser. Keys are created locally with WebCrypto and never leave your device.'

const steps = [
	{
		name: 'Generate',
		text: 'Click “Generate keypair”. A cryptographically secure 32-byte private key is created locally with the WebCrypto random source.',
	},
	{
		name: 'Copy the public key',
		text: 'The public key (64 hex characters) is derived from the private key. Share it freely — it reveals nothing about your secret.',
	},
	{
		name: 'Store the private key safely',
		text: 'Copy the private key (64 hex characters) and keep it secret. Anyone with it can sign as you.',
	},
]

const faqs = [
	{
		q: 'Where is the key generated?',
		a: 'Entirely in your browser using the WebCrypto secure random source. No key is sent to or stored on a server.',
	},
	{
		q: 'How big is an Ed25519 key?',
		a: 'The private and public keys are 32 bytes each, shown as 64 hexadecimal characters.',
	},
	{
		q: 'Is it safe to reuse a keypair?',
		a: 'A keypair is a long-term identity and can be reused to sign many messages. Keep the private key secret; rotate it if it may have been exposed.',
	},
]

const jsonLd = [
	webApplicationJsonLd(),
	howToJsonLd({
		name: 'How to generate an Ed25519 keypair',
		description,
		steps,
	}),
	faqPageJsonLd(faqs),
	breadcrumbJsonLd([
		{ name: 'Home', path: '/' },
		{ name: 'Key generator', path },
	]),
]
---

<BaseLayout
	title={title}
	description={description}
	path={path}
	jsonLd={jsonLd}
>
	<PageHeader
		title="Ed25519 key generator"
		lead="Create a fresh Ed25519 keypair in your browser. The private key is generated locally and never leaves this page."
		width="narrow"
		illustration="private"
	/>

	<section class="px-4 pb-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<ConsoleFrame label="ed25519 — key generator">
				<div class="p-5 sm:p-7">
					<KeygenPanel standalone />
				</div>
			</ConsoleFrame>
		</div>
	</section>

	<section class="px-4 pb-4 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">How to generate a keypair</h2>
			<ol
				class="text-body mt-5 flex list-decimal flex-col gap-3 pl-5 leading-relaxed"
			>
				{steps.map((s) => <li>{s.text}</li>)}
			</ol>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">Worked example</h2>
			<p class="text-body mt-4 leading-relaxed">
				A real keypair from the RFC 8032 test vectors. The public key is
				derived from the private key — try pasting this private key into
				the sign tool.
			</p>
			<dl class="mt-5 flex flex-col gap-3">
				<div
					class="rounded-[6px] border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-4"
				>
					<dt
						class="font-mono text-[11px] tracking-[0.12em] text-[var(--color-term-dim)] uppercase"
					>
						Private key · 64 hex
					</dt>
					<dd
						class="mt-1.5 font-mono text-xs break-all text-[var(--color-term-fg)]"
					>
						{EXAMPLE.privateKeyHex}
					</dd>
				</div>
				<div
					class="rounded-[6px] border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-4"
				>
					<dt
						class="font-mono text-[11px] tracking-[0.12em] text-[var(--color-term-dim)] uppercase"
					>
						Public key · 64 hex
					</dt>
					<dd
						class="mt-1.5 font-mono text-xs break-all text-[var(--color-term-prompt)]"
					>
						{EXAMPLE.publicKeyHex}
					</dd>
				</div>
			</dl>
		</div>
	</section>

	<section class="px-4 pb-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">Good to know</h2>
			<ul
				class="text-body mt-5 flex list-disc flex-col gap-2 pl-5 leading-relaxed"
			>
				<li>Keys are 32 bytes each, shown as 64 hexadecimal characters.</li>
				<li>
					Generation uses the operating system’s secure random source via
					WebCrypto.
				</li>
				<li>
					Nothing is stored or transmitted — reload the page and the keys
					are gone unless you copied them.
				</li>
			</ul>
		</div>
	</section>

	<section class="px-4 pb-16 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">FAQ</h2>
			<div class="mt-5"><FaqAccordion faqs={faqs} /></div>
		</div>
	</section>

	<RelatedTools current="generate" />
</BaseLayout>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: `dist/client/ed25519-key-generator/index.html` exists. Checks:
`grep -c 'HowTo' dist/client/ed25519-key-generator/index.html` → ≥ 1
`grep -c 'data-panel="generate"' dist/client/ed25519-key-generator/index.html` → 1
`grep -c 'keygen-btn' dist/client/ed25519-key-generator/index.html` → 1 (the live tool is embedded)

- [ ] **Step 3: Manual check (dev).** `pnpm dev`, open `/ed25519-key-generator`, click “Generate keypair” — confirm a keypair appears and copy works, in light + dark.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: /ed25519-key-generator page (embedded tool + HowTo/FAQ data)"
```

---

## Task 8: Sign message page — `/ed25519-sign-message`

**Files:**
- Create: `src/pages/ed25519-sign-message.astro`

- [ ] **Step 1: Implement the page:**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import PageHeader from '../components/sections/PageHeader.astro'
import ConsoleFrame from '../components/tool/ConsoleFrame.astro'
import SignPanel from '../components/tool/SignPanel.astro'
import FaqAccordion from '../components/ui/FaqAccordion.astro'
import RelatedTools from '../components/sections/RelatedTools.astro'
import { EXAMPLE } from '../lib/example-vector'
import {
	webApplicationJsonLd,
	howToJsonLd,
	faqPageJsonLd,
	breadcrumbJsonLd,
} from '../lib/seo'

const path = '/ed25519-sign-message'
const title = 'Sign a message with Ed25519'
const description =
	'Sign any message with your Ed25519 private key, in your browser. Produces a 64-byte EdDSA signature. Your private key never leaves your device.'

const steps = [
	{
		name: 'Enter your message',
		text: 'Type or paste the exact text you want to sign.',
	},
	{
		name: 'Paste your private key',
		text: 'Provide your 64-hex (32-byte) Ed25519 private key. It stays in the page and is never transmitted.',
	},
	{
		name: 'Sign',
		text: 'Click “Sign message” to produce a 128-hex (64-byte) signature unique to that message and key.',
	},
]

const faqs = [
	{
		q: 'Does my private key get sent anywhere?',
		a: 'No. Signing runs entirely in your browser; the private key never leaves the page.',
	},
	{
		q: 'How long is an Ed25519 signature?',
		a: '64 bytes, shown as 128 hexadecimal characters.',
	},
	{
		q: 'Will the same message always give the same signature?',
		a: 'Yes. Ed25519 is deterministic, so signing the same message with the same key always yields the same signature.',
	},
]

const jsonLd = [
	webApplicationJsonLd(),
	howToJsonLd({ name: 'How to sign a message with Ed25519', description, steps }),
	faqPageJsonLd(faqs),
	breadcrumbJsonLd([
		{ name: 'Home', path: '/' },
		{ name: 'Sign a message', path },
	]),
]
---

<BaseLayout
	title={title}
	description={description}
	path={path}
	jsonLd={jsonLd}
>
	<PageHeader
		title="Sign a message with Ed25519"
		lead="Produce an EdDSA signature with your private key — entirely in your browser."
		width="narrow"
		illustration="standards"
	/>

	<section class="px-4 pb-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<ConsoleFrame label="ed25519 — sign">
				<div class="p-5 sm:p-7">
					<SignPanel standalone />
				</div>
			</ConsoleFrame>
		</div>
	</section>

	<section class="px-4 pb-4 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">How to sign a message</h2>
			<ol
				class="text-body mt-5 flex list-decimal flex-col gap-3 pl-5 leading-relaxed"
			>
				{steps.map((s) => <li>{s.text}</li>)}
			</ol>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">Worked example</h2>
			<p class="text-body mt-4 leading-relaxed">
				Sign the message <code
					class="bg-canvas-soft-2 text-ink rounded-[4px] px-1.5 py-0.5 font-mono text-sm"
					>{EXAMPLE.message}</code
				> with the private key below and you get exactly this signature
				(an RFC 8032 test vector — try it in the tool above).
			</p>
			<dl class="mt-5 flex flex-col gap-3">
				<div
					class="rounded-[6px] border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-4"
				>
					<dt
						class="font-mono text-[11px] tracking-[0.12em] text-[var(--color-term-dim)] uppercase"
					>
						Private key · 64 hex
					</dt>
					<dd
						class="mt-1.5 font-mono text-xs break-all text-[var(--color-term-fg)]"
					>
						{EXAMPLE.privateKeyHex}
					</dd>
				</div>
				<div
					class="rounded-[6px] border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-4"
				>
					<dt
						class="font-mono text-[11px] tracking-[0.12em] text-[var(--color-term-dim)] uppercase"
					>
						Signature · 128 hex
					</dt>
					<dd
						class="mt-1.5 font-mono text-xs break-all text-[var(--color-term-prompt)]"
					>
						{EXAMPLE.signatureHex}
					</dd>
				</div>
			</dl>
		</div>
	</section>

	<section class="px-4 pb-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">Good to know</h2>
			<ul
				class="text-body mt-5 flex list-disc flex-col gap-2 pl-5 leading-relaxed"
			>
				<li>The signature is 64 bytes (128 hex characters).</li>
				<li>
					Change one character of the message and the signature changes
					completely.
				</li>
				<li>The private key never leaves your browser.</li>
			</ul>
		</div>
	</section>

	<section class="px-4 pb-16 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">FAQ</h2>
			<div class="mt-5"><FaqAccordion faqs={faqs} /></div>
		</div>
	</section>

	<RelatedTools current="sign" />
</BaseLayout>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: `dist/client/ed25519-sign-message/index.html` exists.
`grep -c 'HowTo' dist/client/ed25519-sign-message/index.html` → ≥ 1
`grep -c 'sign-btn' dist/client/ed25519-sign-message/index.html` → 1

- [ ] **Step 3: Manual check (dev).** Paste the example private key, type `r`, click Sign → confirm the output equals `EXAMPLE.signatureHex`.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: /ed25519-sign-message page (embedded tool + HowTo/FAQ data)"
```

---

## Task 9: Verify signature page — `/ed25519-verify-signature`

**Files:**
- Create: `src/pages/ed25519-verify-signature.astro`

- [ ] **Step 1: Implement the page:**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import PageHeader from '../components/sections/PageHeader.astro'
import ConsoleFrame from '../components/tool/ConsoleFrame.astro'
import VerifyPanel from '../components/tool/VerifyPanel.astro'
import FaqAccordion from '../components/ui/FaqAccordion.astro'
import RelatedTools from '../components/sections/RelatedTools.astro'
import { EXAMPLE } from '../lib/example-vector'
import {
	webApplicationJsonLd,
	howToJsonLd,
	faqPageJsonLd,
	breadcrumbJsonLd,
} from '../lib/seo'

const path = '/ed25519-verify-signature'
const title = 'Verify an Ed25519 signature'
const description =
	'Verify an Ed25519 signature against a message and public key, in your browser. Confirms authenticity and integrity. Nothing is sent to a server.'

const steps = [
	{
		name: 'Enter the original message',
		text: 'Paste the exact message that was signed — even a one-character difference fails.',
	},
	{
		name: 'Paste the public key',
		text: 'Provide the signer’s 64-hex public key.',
	},
	{
		name: 'Paste the signature and verify',
		text: 'Provide the 128-hex signature and click “Verify signature”. You get a clear valid/invalid result.',
	},
]

const faqs = [
	{
		q: 'What does a valid result prove?',
		a: 'That the signature was produced by the private key matching the given public key, and the message is byte-for-byte unchanged.',
	},
	{
		q: 'Do I need the private key to verify?',
		a: 'No — verification only needs the message, the public key, and the signature. The private key is never required.',
	},
	{
		q: 'Why did verification fail?',
		a: 'Usually the message, public key, or signature differs from the originals — even a single changed character or byte makes a signature invalid.',
	},
]

const jsonLd = [
	webApplicationJsonLd(),
	howToJsonLd({
		name: 'How to verify an Ed25519 signature',
		description,
		steps,
	}),
	faqPageJsonLd(faqs),
	breadcrumbJsonLd([
		{ name: 'Home', path: '/' },
		{ name: 'Verify a signature', path },
	]),
]
---

<BaseLayout
	title={title}
	description={description}
	path={path}
	jsonLd={jsonLd}
>
	<PageHeader
		title="Verify an Ed25519 signature"
		lead="Check a signature against the original message and a public key — all in your browser."
		width="narrow"
		illustration="check"
	/>

	<section class="px-4 pb-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<ConsoleFrame label="ed25519 — verify">
				<div class="p-5 sm:p-7">
					<VerifyPanel standalone />
				</div>
			</ConsoleFrame>
		</div>
	</section>

	<section class="px-4 pb-4 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">How to verify a signature</h2>
			<ol
				class="text-body mt-5 flex list-decimal flex-col gap-3 pl-5 leading-relaxed"
			>
				{steps.map((s) => <li>{s.text}</li>)}
			</ol>
		</div>
	</section>

	<section class="px-4 py-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">Worked example</h2>
			<p class="text-body mt-4 leading-relaxed">
				These RFC 8032 values verify as <span
					class="text-[var(--color-term-prompt)]">valid</span
				>. Paste them into the tool above with the message <code
					class="bg-canvas-soft-2 text-ink rounded-[4px] px-1.5 py-0.5 font-mono text-sm"
					>{EXAMPLE.message}</code
				> — then change one character of the message and watch it fail.
			</p>
			<dl class="mt-5 flex flex-col gap-3">
				<div
					class="rounded-[6px] border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-4"
				>
					<dt
						class="font-mono text-[11px] tracking-[0.12em] text-[var(--color-term-dim)] uppercase"
					>
						Public key · 64 hex
					</dt>
					<dd
						class="mt-1.5 font-mono text-xs break-all text-[var(--color-term-fg)]"
					>
						{EXAMPLE.publicKeyHex}
					</dd>
				</div>
				<div
					class="rounded-[6px] border border-[var(--color-term-border)] bg-[var(--color-term-bg)] p-4"
				>
					<dt
						class="font-mono text-[11px] tracking-[0.12em] text-[var(--color-term-dim)] uppercase"
					>
						Signature · 128 hex
					</dt>
					<dd
						class="mt-1.5 font-mono text-xs break-all text-[var(--color-term-prompt)]"
					>
						{EXAMPLE.signatureHex}
					</dd>
				</div>
			</dl>
		</div>
	</section>

	<section class="px-4 pb-12 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">Good to know</h2>
			<ul
				class="text-body mt-5 flex list-disc flex-col gap-2 pl-5 leading-relaxed"
			>
				<li>Verification proves both authenticity and integrity at once.</li>
				<li>You only need the public key — never the private key.</li>
				<li>Any change to the message or signature makes it invalid.</li>
			</ul>
		</div>
	</section>

	<section class="px-4 pb-16 sm:px-6">
		<div class="mx-auto max-w-[760px]">
			<h2 class="display-md">FAQ</h2>
			<div class="mt-5"><FaqAccordion faqs={faqs} /></div>
		</div>
	</section>

	<RelatedTools current="verify" />
</BaseLayout>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm build`
Expected: `dist/client/ed25519-verify-signature/index.html` exists.
`grep -c 'HowTo' dist/client/ed25519-verify-signature/index.html` → ≥ 1
`grep -c 'verify-btn' dist/client/ed25519-verify-signature/index.html` → 1

- [ ] **Step 3: Manual check (dev).** Paste the example public key + signature, message `r` → expect VALID; change the message → INVALID.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: /ed25519-verify-signature page (embedded tool + HowTo/FAQ data)"
```

---

## Task 10: Repoint the footer "Tools" links

**Files:**
- Modify: `src/consts.ts`

- [ ] **Step 1: Update the `FOOTER_SECTIONS` "Tools" section** so its links point to the new pages instead of home anchors. Replace the three links in the `title: 'Tools'` block with:

```ts
		links: [
			{ label: 'Key generator', href: '/ed25519-key-generator' },
			{ label: 'Sign a message', href: '/ed25519-sign-message' },
			{ label: 'Verify a signature', href: '/ed25519-verify-signature' },
		],
```

(Leave the `Learn` and `Legal` footer sections unchanged.)

- [ ] **Step 2: Build and verify the footer points to the new pages**

Run: `pnpm build`
Expected: success.
`grep -c '/ed25519-key-generator' dist/client/index.html` → ≥ 1
`grep -c 'href="/#keygen"' dist/client/index.html` → 0 (old anchors gone from the footer)

- [ ] **Step 3: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: repoint footer Tools links to the dedicated tool pages"
```

---

## Task 11: Full verification + design audit

**Files:** none (verification only)

- [ ] **Step 1: Full gate**

Run: `pnpm install && pnpm check && pnpm test && pnpm build`
Expected: install clean; `check` `0 errors` (3 hints OK); all unit tests pass (Phase 2's 17 + the 4 example-vector tests = 21); build succeeds.

- [ ] **Step 2: Routes + sitemap**

Confirm the three pages built and are in the sitemap:
```bash
ls dist/client/ed25519-key-generator/index.html dist/client/ed25519-sign-message/index.html dist/client/ed25519-verify-signature/index.html
grep -oE '<loc>[^<]+</loc>' dist/client/sitemap-0.xml | grep ed25519-
```
Expected: all three HTML files exist; the sitemap lists all three URLs. Confirm `/api/contact` is still absent from the sitemap.

- [ ] **Step 3: Structured data sanity**

```bash
for p in ed25519-key-generator ed25519-sign-message ed25519-verify-signature; do
	echo "$p: HowTo=$(grep -c HowTo dist/client/$p/index.html) FAQPage=$(grep -c FAQPage dist/client/$p/index.html) Breadcrumb=$(grep -c BreadcrumbList dist/client/$p/index.html)"
done
```
Expected: each page → HowTo ≥ 1, FAQPage ≥ 1, BreadcrumbList ≥ 1.

- [ ] **Step 4: Home tool regression**

Confirm the home page console is intact: `grep -c 'role="tab"' dist/client/index.html` → 3; `grep -c 'client-side' dist/client/index.html` → 1.

- [ ] **Step 5: Manual review (dev), light + dark + mobile.** `pnpm dev`. On each of the three pages: the embedded tool works (generate / sign with the example / verify the example → VALID, then tamper → INVALID), the header illustration shows, sections align in the 760 column, the FAQ accordion opens, and RelatedTools links resolve. Confirm the footer "Tools" links now go to the three pages.

- [ ] **Step 6: Design-guidelines audit.** Review the three pages + `ConsoleFrame`, `RelatedTools`, `FaqAccordion` for accessibility/UX (heading order h1→h2, focus states, color contrast, link text). Fix any issues and re-run `pnpm check && pnpm build`.

- [ ] **Step 7: Final commit**

```bash
pnpm format
git add -A
git commit -m "chore: Phase 3 verification + design-audit fixes"
```

---

## Phase 3 done

The three keyword-rich tool pages are live: each embeds the working client-side tool plus how-to, a verified RFC 8032 worked example, notes, FAQ (with `HowTo` + `FAQPage` + `BreadcrumbList` structured data), and cross-links; the footer "Tools" links point to them; the home page and its tabbed console are unchanged. Out of plan scope (user actions, same as Phase 2): identity placeholders, Cloudflare env vars, Email Routing, per-post OG images, and the eventual `astro-migration → master` merge.

## Self-review notes (author)

- **Spec coverage:** spec "three dedicated tool pages" → T7/T8/T9 (embed live panel + how-to + worked example + notes + FAQ + cross-links); keyword-rich URLs → page filenames; keep home console + repoint footer → T3 (ConsoleFrame, home unchanged) + T10; live worked example, no screenshots, RFC 8032 → T2 (vector + verifying test) reused on all three pages; reuse/light refactor → T3 (ConsoleFrame) + T4 (standalone prop); SoftwareApplication/HowTo/FAQPage/BreadcrumbList → `webApplicationJsonLd`/`howToJsonLd`(T1)/`faqPageJsonLd`/`breadcrumbJsonLd` on each page; `howToJsonLd` builder → T1; sitemap auto-includes → T11 Step 2.
- **Grounded in real code:** uses the actual panel ids/markup, the real `signMessage`/`verifySignature`/`generateKeypair` signatures, UTF-8 message encoding (so the `'r'` worked example is reproducible live), the real `PageHeader` (`width`/`illustration`, no eyebrow), `BaseLayout` (`jsonLd`), the hairline-grid card trick, fixed `--color-term-*` tokens, and the existing FAQ accordion markup (extracted to a shared component in T5).
- **Type consistency:** `EXAMPLE` (T2) fields (`privateKeyHex`/`publicKeyHex`/`message`/`signatureHex`) are consumed verbatim in T7/T8/T9; `howToJsonLd({name,description,steps:[{name,text}]})` (T1) matches its callers; `RelatedTools` `current: 'generate'|'sign'|'verify'` (T6) matches the three page calls; the panels' `standalone?: boolean` (T4) matches `<…Panel standalone />` usage.
- **Behavior-preserving refactors:** T3 keeps the `ToolSection` `<script>` untouched and re-verifies the home tabs/title bar; T4 keeps tabbed `hidden`/`role` via the `standalone` ternary and re-verifies; T5 keeps `faq.astro`'s `faqs` + `faqPageJsonLd` and re-verifies the 7 `<details>` + FAQPage.
- **No placeholders:** every page is full content; the worked-example hex is a real RFC 8032 vector locked by the T2 test (with an explicit "library output is authoritative" correction path if a constant is off).
```
