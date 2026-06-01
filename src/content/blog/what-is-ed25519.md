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
