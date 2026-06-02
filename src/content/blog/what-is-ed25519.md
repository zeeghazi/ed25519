---
title: 'What is Ed25519? A plain-English guide'
description: 'Ed25519 is a fast, secure public-key signature scheme. What it means, how it works, what it is used for, whether it is safe, and its key sizes — explained simply.'
pubDate: 2026-05-20
updatedDate: 2026-06-02
tags: ['basics', 'cryptography']
author: 'Ed25519.com'
draft: false
---

**Ed25519 is a public-key digital signature scheme.** It lets you prove that a
message came from you and was not changed in transit — without ever sharing your
secret key. It is fast, uses tiny 32-byte keys, and is the modern default for
SSH keys, software signing, and many internet protocols.

## What does Ed25519 mean?

The name packs in the design:

- **Ed** stands for **Edwards-curve Digital Signature Algorithm (EdDSA)** — the
  signature method.
- **25519** refers to **Curve25519**, the elliptic curve it runs on, named after
  the prime 2²⁵⁵ − 19 that defines its field.

So "Ed25519" means _EdDSA using Curve25519_. It was introduced in 2011 by Daniel
J. Bernstein and colleagues, and is standardized in
[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032).

## The two keys

Every Ed25519 identity is a pair of keys:

- A **private key** (32 bytes) that you keep secret and use to _sign_.
- A **public key** (32 bytes) that you share freely and others use to _verify_.

The public key is derived from the private key through one-way math, so
publishing it reveals nothing about the secret.

## What a signature proves

When you sign a message, you produce a 64-byte **signature**. Anyone holding the
message, the signature, and your public key can check two things at once:

1. **Authenticity** — the signature was produced by the matching private key.
2. **Integrity** — the message has not been altered since it was signed.

If even one byte of the message changes, verification fails. A signature does
**not** hide or encrypt the message — it only proves who signed it and that it is
unchanged.

## How Ed25519 works (at a high level)

1. A private key starts as 32 random bytes (a "seed").
2. That seed is hashed with SHA-512 and used to derive a secret scalar.
3. The scalar is multiplied by a fixed point on Curve25519 to produce the public
   key — easy to compute one way, infeasible to reverse.
4. Signing combines the message, a hash, and the secret scalar deterministically;
   verifying checks the result against the public key.

The important property: signing is **deterministic**. The same key and message
always yield the same signature, so there is no per-signature random number that
could leak the key if generated poorly.

## What is Ed25519 used for?

Ed25519 shows up almost everywhere signatures are needed:

- **SSH keys** — the recommended key type for logging into servers, GitHub, and
  GitLab. See [how to generate an Ed25519 SSH key](/ed25519-ssh-key/).
- **TLS and certificates** — supported in modern TLS and X.509.
- **Tokens** — the EdDSA algorithm for signing JWTs.
- **Secure messaging** — protocols in the Signal family.
- **Cryptocurrencies** — Solana, Cardano, and Stellar use Ed25519 for account
  keys and transaction signatures.
- **Software and package signing**, **DNSSEC**, and **Tor** identities.

## Is Ed25519 safe?

Yes. Ed25519 provides roughly a **128-bit security level** — on par with
3072-bit RSA — and has no known practical breaks. Beyond raw strength, it was
designed to be hard to misuse:

- **Deterministic signing** removes the weak-randomness failure that has leaked
  private keys from ECDSA implementations.
- **One fixed parameter set** means there are no weak key sizes or padding modes
  to choose incorrectly.
- **Audited, widely deployed implementations** back the major libraries.

The usual caveat applies to any signature scheme: your security depends on
keeping the private key secret and generating it with a good random source.

## How big is an Ed25519 key?

Small — which is much of the appeal:

| Value       | Size                          |
| ----------- | ----------------------------- |
| Private key | 32 bytes (64 hex characters)  |
| Public key  | 32 bytes (64 hex characters)  |
| Signature   | 64 bytes (128 hex characters) |

Elliptic-curve math reaches RSA-grade security with far smaller numbers, which
is why Ed25519 keys and signatures are a fraction of RSA's size.

## Ed25519 vs RSA

For new keys, Ed25519 is the better default: faster, far smaller, and harder to
misuse, while RSA remains useful for legacy compatibility. The full breakdown is
in [Ed25519 vs RSA](/blog/ed25519-vs-rsa/).

## Try it yourself

You can [generate a keypair and sign a message](/#tool) right here — everything
runs in your browser, and your keys never leave your device. To go deeper, read
[how Ed25519 key generation works](/blog/how-ed25519-key-generation-works/) or
[signing and verifying with Ed25519](/blog/signing-and-verifying-with-ed25519/).
