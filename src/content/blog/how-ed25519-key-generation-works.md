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
