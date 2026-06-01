# Ed25519.com Phase 3 — Design

> **Status:** FINAL / approved. The "additional Phase 3 changes" the user mentioned were
> delivered incrementally as interim polish after Phase 2 and are already committed (header nav
> → About Us / Contact Us / FAQ / Blog; footer tool deep-links scroll the console into view then
> switch the tab; secondary-page header↔content alignment + illustrated headers + About card
> icons; removal of the `//` and the small eyebrow labels). What remains for Phase 3 — and what
> this spec covers — is the **three dedicated tool pages** below.

## Goal

Improve SEO and task-focused UX by giving each core Ed25519 action its own indexable landing
page, instead of relying on same-page `#anchor` links into the home console.

## Approved: three dedicated tool pages

Each page is a real landing page that **embeds the live, client-side tool** for one action
**and** carries unique educational content. Decisions locked in during brainstorming:

### Pages & URLs (keyword-rich slugs)

| URL                         | H1 / search intent            | Embedded panel           |
| --------------------------- | ----------------------------- | ------------------------ |
| `/ed25519-key-generator`    | "Ed25519 key generator"       | Generate (`KeygenPanel`) |
| `/ed25519-sign-message`     | "Sign a message with Ed25519" | Sign (`SignPanel`)       |
| `/ed25519-verify-signature` | "Verify an Ed25519 signature" | Verify (`VerifyPanel`)   |

- The **home page keeps its full tabbed console** (the tool-first hub). These three are
  additional, focused pages.
- The footer **"Tools"** section repoints from `/#keygen` / `/#sign` / `/#verify` to the three
  new URLs. (Home/nav `/#tool` link is unaffected.)
- Titles/H1s differ from the home page to avoid keyword cannibalization (home = the suite;
  each page = one action).

### Per-page structure (same skeleton, action-specific content)

1. `PageHeader` — eyebrow + H1 + one-line lead.
2. **Live working tool** — the real panel for that action, fully client-side.
3. **How it works** — 3–4 numbered steps → `HowTo` structured data.
4. **Worked example** — a _real, verified_ sample in copyable code blocks, using
   **RFC 8032 §7.1 test vectors** (authoritative; anyone can re-verify). e.g. the verify page
   shows a known public key + message + valid signature, and notes that flipping one byte
   fails verification. No screenshots (live tool + indexable text example instead).
5. **Format & privacy notes** — key/signature sizes, hex encoding, "runs in your browser,
   keys never leave your device."
6. **Mini-FAQ** — 2–4 action-specific Q&As → `FAQPage` structured data.
7. **Cross-links** — to the other two tool pages + the most relevant blog post.

### Reuse / light refactor (behavior-preserving)

- Extract the terminal **console chrome** (title bar + frame) from `ToolSection.astro` into a
  reusable `ConsoleFrame.astro`. `ToolSection` keeps its tabbed behavior using it (home page
  unchanged); each tool page uses the frame around a single visible panel.
- Panels (`KeygenPanel` / `SignPanel` / `VerifyPanel`) gain one optional prop to render
  standalone/visible (no tablist, not `hidden`). Their existing crypto `<script>` blocks are
  untouched — the Phase 1 build and the 17 unit tests still verify tool behavior.

### SEO / structured data per page

- Unique `<title>`, meta description, H1.
- JSON-LD: `SoftwareApplication` + `HowTo` + `FAQPage` + `BreadcrumbList`.
- Add a `howToJsonLd` builder to `src/lib/seo.ts` (alongside the existing article/breadcrumb/
  FAQ builders).
- Pages are picked up by the existing sitemap integration automatically.

### Decisions captured (from brainstorming)

- Embed the live tool on each page (not info-only / link-back). ✅
- Keyword-rich URLs. ✅
- Keep home console; repoint footer Tools links to the new pages. ✅
- Live worked example, **no screenshots**. ✅
- Full section set (how-to + RFC example + notes + FAQ + cross-links). ✅
- Sequencing: **Phase 3, after Phase 2** finishes. ✅

## Worked-example values (correctness)

The worked examples must use **real, verifying** Ed25519 values, not fabricated hex. Use the
official **RFC 8032 §7.1** test vectors (TEST 1–3), which are public and reproducible:

- TEST 1 — empty message; secret/public key + 64-byte signature.
- TEST 2 — a 1-byte message (`0x72`).
- TEST 3 — a 2-byte message (`0xaf82`).

To guarantee the displayed values actually validate (and never drift), add a unit test that
runs each displayed vector through `verifyAsync` and asserts it returns `true` (and that a
one-byte tamper returns `false`). The verify page's example uses one of these vectors; the
sign page shows the message → signature mapping; the generator page shows a seed → public key.

## Build sequencing (implementation plan will detail)

1. `howToJsonLd` builder in `src/lib/seo.ts` (+ reuse `webApplicationJsonLd` / `breadcrumbJsonLd`
   / `faqPageJsonLd`).
2. Extract `ConsoleFrame.astro` from `ToolSection.astro` (behavior-preserving); add the
   standalone/visible prop to the three panels.
3. RFC-8032 worked-example data module + the verifying unit test (TDD).
4. The three pages (`/ed25519-key-generator`, `/ed25519-sign-message`,
   `/ed25519-verify-signature`), each: header + live panel + how-to + example + notes + FAQ +
   cross-links + structured data.
5. Repoint the footer "Tools" links to the three pages.
6. Full verification (check/test/build, sitemap includes the three URLs) + design audit.
