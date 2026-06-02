# ed25519.com — SEO / GEO Ranking Strategy

**Date:** 2026-06-02 · **Branch:** `astro-migration` · Status: strategy / working plan

## The single most important insight

Our **tool** generates raw in-browser Ed25519 keypairs + signatures (hex). But the
**search demand** (from the Ahrefs keyword + question research) is overwhelmingly about
**SSH keys** — `ssh-keygen ed25519`, `id_ed25519`, GitHub host-key fingerprints, PuTTY,
"can Ed25519 be used for SSH". The site currently has **zero** content for any of it.

We cannot _be_ an SSH client (keygen is a local command, and generating SSH **private**
keys in a browser would violate our "keys never leave the device" promise). But we can
**own the informational SEO** for the entire Ed25519 + SSH question space through content,
and honestly bridge to the tool for the raw-signature use cases it actually serves
(API keys, JWT/EdDSA, Solana/Cardano/Stellar, libsodium, learning).

**Thesis:** become the _topical authority_ on Ed25519 by densely covering the full
question space with interlinked, answer-first, schema-rich pages. Topical depth + our
already-excellent technical SEO (speed, static, structured data) is the path to ranking.

## Intent split

- **Transactional / tool intent** → the 3 existing tool pages (`/ed25519-key-generator`,
  `/ed25519-sign-message`, `/ed25519-verify-signature`). Keep + optimize.
- **Informational intent (the bulk of the volume)** → a content cluster (pillar + spokes),
  mostly blog. This is the growth engine.

## Keyword → page map (canonical owner per keyword, to avoid cannibalization)

| Cluster            | Primary keywords                                                                                                                                                                                                                                                                         | Owner page                                             | Action                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Head               | `ed25519`                                                                                                                                                                                                                                                                                | `/` (home)                                             | optimize H1/title/intro; make it the hub that links every cluster              |
| What-is            | `what is ed25519`, `ed25519 algorithm`, `ed25519 meaning`, `is ed25519 safe`, `what is ed25519 used for`, `ed25519 key size`, `ed25519 key`, `ed25519 public key`                                                                                                                        | blog `what-is-ed25519`                                 | **EXPAND to definitive pillar**                                                |
| vs RSA             | `ed25519 vs rsa`, `rsa vs ed25519`, `which is better rsa or ed25519`, `is ed25519 better than rsa`, `ed25519 vs rsa 2048/4096`                                                                                                                                                           | blog `ed25519-vs-rsa`                                  | **REFOCUS** existing vs-rsa-vs-ecdsa to lead with RSA; keep ECDSA as a section |
| **SSH pillar**     | `ssh-keygen ed25519`, `ssh-keygen -t ed25519`, `generate ssh key ed25519`, `how to generate ed25519 ssh key`, `ssh ed25519`, `ssh-ed25519`, `what is ed25519 ssh key`, `can ed25519 be used for ssh`, `which ssh key is better rsa or ed25519`, `when did ssh-keygen default to ed25519` | **NEW** `/ed25519-ssh-key` (top-level pillar)          | **WRITE — highest priority**                                                   |
| id_ed25519         | `id_ed25519`, `what is id_ed25519`, `id_ed25519 vs .pub`, `how to create id_ed25519`                                                                                                                                                                                                     | **NEW** blog `id_ed25519`                              | write                                                                          |
| GitHub fingerprint | `github ssh host key fingerprints ed25519` (+ `sha256`), `what is the github.com ssh host key fingerprint ed25519`, `ed25519 fingerprint for github.com`, `what is ssh host key fingerprint`                                                                                             | **NEW** blog `github-ssh-host-key-fingerprint-ed25519` | write (snippet/AI magnet; keep current)                                        |
| PuTTY              | `putty ed25519 support`, `puttygen how to generate ed25519`, `when did putty add ed25519 support`                                                                                                                                                                                        | **NEW** blog `putty-ed25519`                           | write                                                                          |
| X25519             | `difference between x25519 and ed25519`                                                                                                                                                                                                                                                  | **NEW** blog `x25519-vs-ed25519`                       | write (short, disambiguation)                                                  |
| Java (niche)       | `java ed25519 support`                                                                                                                                                                                                                                                                   | **NEW** blog `java-ed25519`                            | optional / low priority                                                        |
| Tool               | `generate ed25519 key`, `ed25519 key generator`, `how to generate ed25519 key`, `how do I generate an ed25519 key pair`                                                                                                                                                                  | `/ed25519-key-generator`                               | optimize + link to SSH pillar                                                  |

Discarded as off-topic / too generic for us: "How to generate 4096 SSH key", "Is Java 26 LTS",
"What Java version was in 2019", "Binance API key" specifics (mention once at most), "Why is RSA
no longer used" (fold into vs-rsa). Keep only Ed25519-relevant angles.

## Content plan

**Existing posts are far too thin (~1.3–1.7 KB).** Expand every kept post to a comprehensive,
answer-first article (target ~1,200–2,000+ words) with TL;DR box, question-shaped H2s,
comparison tables, copyable code blocks, primary-source citations, and a mini-FAQ (FAQ schema).

Keep + expand:

1. `what-is-ed25519` → **What-is pillar** (+ "used for": SSH, TLS, JWT/EdDSA, Signal, Solana/
   Cardano/Stellar, DNSSEC, Tor; + safe?, key size, meaning).
2. `ed25519-vs-rsa-vs-ecdsa` → **refocus to `ed25519-vs-rsa`** (rename slug; 301 not needed pre-launch).
   Lead with the RSA comparison table (speed, key size, security, compatibility); ECDSA + a note
   vs RSA-2048/4096 as sections.
3. `how-ed25519-key-generation-works` → keep; supports the generator tool page.
4. `signing-and-verifying-with-ed25519` → keep; supports sign/verify tool pages.

New (priority order):

1. ★★★ **`/ed25519-ssh-key`** pillar — "Ed25519 SSH keys: how to generate with ssh-keygen".
   The exact command (`ssh-keygen -t ed25519 -C "you@example.com"`), what an Ed25519 SSH key is,
   can it be used for SSH (yes), RSA vs Ed25519 for SSH, ssh-agent, copying the public key, adding
   to GitHub/GitLab/a server, the "is it the default yet?" answer. HowTo + FAQ schema.
2. ★★ **`github-ssh-host-key-fingerprint-ed25519`** — GitHub's current Ed25519 fingerprint
   (`SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU`), how to verify it, what a host-key
   fingerprint is. Verify the value against GitHub docs at write time; mark "last updated".
3. ★★ **`id_ed25519`** — what the file is, `id_ed25519` (private) vs `id_ed25519.pub` (public),
   where it lives (`~/.ssh/`), how it's created, permissions.
4. ★★★ **`ed25519-vs-rsa`** (the refocus above).
5. ★ **`putty-ed25519`** — PuTTY supports Ed25519 since 0.71 (2019); PuTTYgen how-to; versions.
6. ★ **`x25519-vs-ed25519`** — Ed25519 = signatures (EdDSA); X25519 = key exchange (ECDH); same
   curve family, different jobs.
7. ☆ **`java-ed25519`** (optional) — Java 15+ EdDSA (JEP 339).

**FAQ page:** add the high-volume People-Also-Ask items (Is Ed25519 better than RSA? Is Ed25519
safe? What is Ed25519 used for? Can Ed25519 be used for SSH? X25519 vs Ed25519? What is the key
size?) — all already covered by the page's FAQPage schema.

## On-page rules (apply to every page)

- **URL:** keyword slug, lowercase, hyphenated. Pillars top-level; spokes under `/blog/`.
- **Title (`<title>`):** primary keyword first, ≤ ~60 chars, brand suffix via existing `resolveSeo`.
- **Meta description:** ≤ ~155 chars, primary + one secondary keyword + value prop. (Schema allows
  desc 50–170; keep SERP-visible part tight.)
- **One H1**, containing the primary keyword. H2s phrased as the real questions (PAA).
- **Answer-first:** a 2–3 sentence direct answer to the page's primary query in the first 100 words,
  plus a TL;DR / key-takeaways box.
- **Internal links:** hub-and-spoke. Home → clusters; pillar ↔ spokes; every post links the relevant
  tool page and 1–2 sibling posts. Descriptive anchor text with the target keyword.
- **Images:** filename = keyword/slug; descriptive `alt` with the keyword (no stuffing).
- **Schema per page:** BlogPosting/TechArticle + BreadcrumbList always; HowTo on procedural pages;
  FAQPage where a Q&A block exists. (All builders already in `src/lib/seo.ts`.)
- **Freshness:** set `updatedDate` when revised; surface "Last updated" on fingerprint/version posts.

## GEO (AI Overviews / ChatGPT / Perplexity citation) tactics

- Answer-first, inverted-pyramid blocks LLMs can lift verbatim (40–60 word direct answers).
- Comparison + spec **tables** (models extract these cleanly).
- **Cite primary sources** with links: RFC 8032, ed25519.cr.yp.to (DJB), OpenSSH release notes,
  GitHub SSH docs, NIST. Authority = citation-worthiness.
- Factual, unhedged, scannable claims; clear definitions; current values + dated.
- FAQPage / HowTo schema everywhere it fits — feeds rich results and answer engines.

## OG images (per post, name = keyword/slug)

Spec: **1200×630 px**, < ~300 KB, PNG/JPG; consistent brand (dark `--color-term-*` canvas, green
accent, mono type, the grid motif), large post title, small `ed25519.com` wordmark. The `ogImage`
frontmatter field + `Seo.astro` `og:image`/`twitter:image` already exist; `og/default.png` is the
fallback.

**Recommended — automated at build (`astro-og-canvas`):** generate one image per post from a
template, so the filename derives from the entry id (= the keyword-rich slug) automatically and
never drifts. Steps: `pnpm add astro-og-canvas`; add an `OGImageRoute` endpoint mapping the `blog`
collection; point each post's `ogImage` at `/og/<id>.png`. Zero runtime cost (static build).

Fallback — **manual template:** one 1200×630 Figma/Canva master; export `<slug>.png` per post into
`public/og/`; set `ogImage: /og/<slug>.png`. Full design control, more manual labor.

## Optional product enhancement (bridges tool ↔ SSH intent, honestly)

Add an **"OpenSSH public key" output** to the generator: convert the raw 32-byte public key to
`ssh-ed25519 AAAA…` wire format (base64). Public key only — never generate SSH **private** keys in
the browser. Lets us honestly serve "ssh-ed25519 / ssh public key" lookups from the live tool.

## Execution phases

1. **Quick wins:** refocus `ed25519-vs-rsa`; expand `what-is-ed25519` pillar; expand FAQ. Tune
   titles/meta/internal links on the 3 tool pages.
2. **SSH cluster:** `/ed25519-ssh-key` pillar, then `github-ssh-host-key-fingerprint-ed25519`,
   `id_ed25519`, `putty-ed25519`, `x25519-vs-ed25519`.
3. **OG images:** wire `astro-og-canvas`; backfill all posts + the new pages.
4. **(Optional)** OpenSSH-public-key output in the generator.
5. Verify: `pnpm check` / `test` / `build` clean; sitemap includes new URLs; each page eyeballed.

## Acceptance / definition of "beast site"

- Every target keyword has exactly one strong, schema-rich, answer-first owner page, densely
  interlinked, with a keyword-named OG image.
- No thin posts (< ~1,000 words) remain; all cite primary sources.
- Tool intent and SSH intent are both served and honestly bridged.
- Technical SEO stays green (static speed, canonical, sitemap, structured data).
