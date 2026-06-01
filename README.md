# Ed25519.com

A fast, private, multi-page toolkit for Ed25519 digital signatures — generate
keypairs, sign messages, and verify signatures entirely in the browser.

- **Stack:** Astro 6, TypeScript, Tailwind CSS v4, `@noble/ed25519` v3 (async WebCrypto).
- **Hosting:** Cloudflare Pages (static).
- **Privacy:** all cryptography runs client-side; keys never leave your device.

## Develop

    pnpm install
    pnpm dev      # dev server
    pnpm test     # unit tests (src/lib)
    pnpm check    # astro + type check
    pnpm build    # production build → dist/

See `docs/DEPLOY.md` for deployment.
