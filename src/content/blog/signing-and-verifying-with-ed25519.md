---
title: 'Signing and verifying messages with Ed25519: a walkthrough'
description: 'A hands-on walkthrough of signing a message with an Ed25519 private key and verifying it with the public key, including what each value means.'
pubDate: 2026-05-28
tags: ['tutorial', 'signing']
author: 'Ed25519.com'
draft: false
---

Once you have a keypair, signing and verifying take seconds. Here is the full
round trip.

## Signing

1. Take your **message** (any text) and your **private key** (64 hex characters).
2. The signer hashes and transforms the message with your private key.
3. Out comes a **signature**: 128 hex characters (64 bytes).

The signature is unique to _that_ message and _that_ key. Sign a different
message and you get a completely different signature.

## Verifying

To verify, anyone needs three things:

- the original **message**,
- the **public key** (64 hex characters),
- the **signature** (128 hex characters).

Verification returns a simple yes/no. "Yes" means the signature was made by the
matching private key and the message is byte-for-byte unchanged.

## Try the round trip

1. [Generate a keypair.](/#keygen)
2. [Sign a message](/#sign) with the private key.
3. [Verify it](/#verify) with the public key — then change one character of the
   message and watch verification fail.

Everything runs locally; your keys never leave the page.
