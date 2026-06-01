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
updatedDate: 2026-06-10 # optional
tags: ['basics', 'tutorial']
author: 'Ed25519.com' # optional, defaults to site author
ogImage: '/og/my-post.png' # optional, defaults to /og/default.png
draft: false # true hides it from the build
---
```

The schema is enforced in `src/content.config.ts` — a bad or missing field fails the build
with a clear message.

## SEO checklist per post

- Unique, specific `title` and `description`.
- One `<h1>` is rendered from `title` automatically; use `##` / `###` in the body.
- Link to the tool (`/#tool`) and related posts where relevant.
- Use descriptive link text (not "click here").
- Add `updatedDate` when you materially revise a post.

## Rich content

Rename to `.mdx` to embed components or callouts. Plain `.md` is fine for normal posts.
