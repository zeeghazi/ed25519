---
title: 'Does PuTTY support Ed25519? (and how to generate a key)'
description: 'PuTTY has supported Ed25519 since version 0.68 (2017). How to generate an Ed25519 key with PuTTYgen, use it with Pageant, and which version added support.'
pubDate: 2026-06-02
tags: ['ssh', 'putty', 'windows']
author: 'Ed25519.com'
draft: false
---

Short answer: **yes, PuTTY supports Ed25519.** Support arrived in **PuTTY 0.68**,
released on 21 February 2017, and every release since — up to the current 0.84 —
can generate and use Ed25519 keys. Here is how to make one.

## Which PuTTY version added Ed25519?

PuTTY 0.68 introduced elliptic-curve cryptography, including Ed25519, for host
keys, user-authentication keys, and key exchange. So any reasonably recent PuTTY
will work. (Ed448 came later, in PuTTY 0.75.) If you are on an older build,
download the latest from the official PuTTY site first.

## How to generate an Ed25519 key in PuTTYgen

PuTTYgen is the key generator bundled with PuTTY:

1. Open **PuTTYgen**.
2. Under **Type of key to generate**, select **EdDSA**.
3. In the **Curve** dropdown, choose **Ed25519 (255 bits)**.
4. Click **Generate** and move the mouse over the blank area to add randomness.
5. Set a **Key passphrase** (recommended) and confirm it.
6. Click **Save private key** to store the `.ppk` file (PuTTY's own format).
7. Copy the **public key** text from the box at the top — that is what you paste
   into GitHub or a server's `authorized_keys`.

The public key line is the same `ssh-ed25519 AAAA...` format used everywhere
else, so it works with GitHub, GitLab, and OpenSSH servers.

## Using the key with Pageant

Pageant is PuTTY's SSH agent. Launch it, choose **Add Key**, and select your
`.ppk` file. PuTTY (and WinSCP) will then authenticate automatically using the
loaded key.

## Converting between PuTTY and OpenSSH formats

PuTTY uses `.ppk` files, while OpenSSH uses `id_ed25519` / `id_ed25519.pub`. To
move a key between them, use PuTTYgen's **Conversions** menu:

- **Import key** loads an OpenSSH `id_ed25519` so you can save it as `.ppk`.
- **Export OpenSSH key** turns a `.ppk` into an OpenSSH-format private key.

If you would rather work entirely on the command line, see
[how to generate an Ed25519 SSH key with ssh-keygen](/ed25519-ssh-key/), or read
[what id_ed25519 is](/blog/id_ed25519/) to understand the OpenSSH file names.

## Should you pick Ed25519 over RSA in PuTTY?

Yes, for new keys — Ed25519 is smaller and faster with strong security. Keep an
RSA key only for servers too old to accept Ed25519. The full trade-off is in
[Ed25519 vs RSA](/blog/ed25519-vs-rsa/).
