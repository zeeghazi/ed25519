---
title: 'Ed25519 vs RSA: which should you use?'
description: 'Ed25519 vs RSA compared on security, speed, key size, and compatibility — why Ed25519 is the modern default, and the few cases where RSA still wins.'
pubDate: 2026-05-22
updatedDate: 2026-06-02
tags: ['comparison', 'cryptography']
author: 'Ed25519.com'
draft: false
---

**For new keys, choose Ed25519.** It is faster than RSA, its keys and signatures
are a fraction of the size, and it sidesteps a class of implementation mistakes
that have broken other schemes. Keep RSA only when you must talk to old systems
that do not support Ed25519. Here is the full comparison.

## Ed25519 vs RSA at a glance

|                   | Ed25519                                | RSA (3072-bit)              |
| ----------------- | -------------------------------------- | --------------------------- |
| Type              | EdDSA on Curve25519                    | Integer factorization       |
| Private key       | 256 bits (fixed)                       | 3072 bits and up            |
| Public key        | 32 bytes                               | ~384 bytes                  |
| Signature         | 64 bytes                               | ~384 bytes                  |
| Signing speed     | Very fast                              | Slow                        |
| Verification      | Fast                                   | Fast                        |
| Security level    | ~128-bit                               | ~128-bit at 3072 bits       |
| Misuse resistance | High (deterministic)                   | Reasonable                  |
| Compatibility     | OpenSSH 6.5+ (2014), modern everything | Universal, including legacy |

## Is Ed25519 better than RSA?

For almost all new use — SSH keys, signing, tokens, TLS — **yes**. Ed25519 gives
you the same practical security as a 3072-bit RSA key while being dramatically
smaller and faster. The only reason to prefer RSA today is reaching a system too
old to understand Ed25519.

## Is Ed25519 more secure than RSA?

They target a similar security level, but Ed25519 is **harder to get wrong**,
which matters more in practice than the headline number:

- **No weak randomness per signature.** Ed25519 is deterministic: the signature
  is derived from the key and message, so a bad random-number generator cannot
  leak your private key. RSA signing does not depend on per-signature
  randomness either, but ECDSA does — which is why Ed25519 is often preferred
  over ECDSA too.
- **Small, rigid parameters.** RSA security depends on key size and careful
  padding choices; people still deploy 1024-bit RSA or flawed padding. An
  Ed25519 key has one size and one well-reviewed construction.
- **Modern, audited implementations.** Ed25519 was designed in 2011 for speed
  and safety on real hardware, and widely used libraries are well audited.

## Speed and size

This is where the gap is largest. An RSA-3072 public key is roughly 384 bytes;
an Ed25519 public key is 32. RSA signatures are about 384 bytes; Ed25519
signatures are 64. RSA signing in particular is much slower because it works
with very large numbers. For anything that signs often or ships keys around —
SSH, package signing, JWTs — Ed25519's compactness and speed are a real
advantage. (It also answers a common question: Ed25519 keys are "so short"
because elliptic-curve math reaches RSA-grade security with far smaller numbers.)

## When should you still use RSA?

- **Legacy systems.** An old SSH server, appliance, or library that predates
  Ed25519 support may only accept RSA. Use at least 3072 bits (4096 is common).
- **Required by policy.** Some compliance regimes or hardware (older HSMs, smart
  cards) still mandate RSA.
- **Encryption, not just signing.** RSA can encrypt small payloads directly;
  Ed25519 only signs. For key exchange you would use X25519 — see
  [X25519 vs Ed25519](/blog/x25519-vs-ed25519/).

## Where does ECDSA fit?

ECDSA (for example on NIST P-256) is the other common elliptic-curve choice. It
has small keys like Ed25519, but its security depends on a fresh random value
for every signature — and a repeated or predictable value leaks the private key,
a real cause of past breaches. Ed25519 removes that failure mode by being
deterministic, so for new systems it is the safer elliptic-curve pick.

|                 | Ed25519   | ECDSA (P-256) | RSA (3072)   |
| --------------- | --------- | ------------- | ------------ |
| Public key size | 32 bytes  | 33–65 bytes   | ~384 bytes   |
| Signature size  | 64 bytes  | ~64–72 bytes  | ~384 bytes   |
| Signing speed   | Very fast | Fast          | Slow         |
| Misuse risk     | Low       | Nonce reuse   | Padding/size |

## Recommendation

Default to **Ed25519** for new keys and signatures. Fall back to **RSA (3072+)**
only for compatibility with systems that cannot use it. If you are creating an
SSH key, follow the [Ed25519 SSH key guide](/ed25519-ssh-key/); to see a keypair
and signature in action, [try the in-browser tool](/#tool) — keys never leave
your device. New to the algorithm? Start with
[what is Ed25519](/blog/what-is-ed25519/).
