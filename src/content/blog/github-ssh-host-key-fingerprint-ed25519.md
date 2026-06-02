---
title: "GitHub's SSH host key fingerprint (Ed25519)"
description: "GitHub's current Ed25519 SSH host key fingerprint, what an SSH host key fingerprint is, and how to verify github.com when you connect over SSH."
pubDate: 2026-06-02
updatedDate: 2026-06-02
tags: ['ssh', 'github', 'security']
author: 'Ed25519.com'
draft: false
---

The first time you connect to GitHub over SSH, your client shows the server's
host key fingerprint and asks you to confirm it. Here is the value to expect for
the Ed25519 key, and how to check it.

## GitHub's SSH host key fingerprints

These are GitHub's published SSH host key fingerprints. The Ed25519 one is the
key fact most people are looking for:

| Key type    | SHA256 fingerprint                                   |
| ----------- | ---------------------------------------------------- |
| **Ed25519** | `SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU` |
| RSA         | `SHA256:uNiVztksCsDhcc0u9e8BujQXVUpKZIDTMczCvj3tD2s` |
| ECDSA       | `SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM` |

When you run `ssh -T git@github.com` for the first time, the prompt should read:

```
The authenticity of host 'github.com (140.82.x.x)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

If the fingerprint matches the table above, type `yes`. If it does **not**
match, stop — you may be connecting through a man-in-the-middle.

> GitHub can rotate these keys (it rotated its RSA host key in 2023). Always
> cross-check against GitHub's official "SSH key fingerprints" documentation
> page before trusting a value you found elsewhere, including this post.

## What is an SSH host key fingerprint?

A **host key** is the server's own public key, used to prove the server's
identity to your SSH client — it is the reverse direction of your personal
[Ed25519 SSH key](/ed25519-ssh-key/), which proves _your_ identity to the
server. A **fingerprint** is a short SHA-256 hash of that host key, shown in
Base64. Comparing the fingerprint is far easier than comparing the full key, so
SSH uses it for the trust-on-first-use prompt.

Once you confirm it, the key is saved to `~/.ssh/known_hosts` and you are not
asked again — unless the host key changes, which triggers a loud warning.

## How to verify GitHub's fingerprint yourself

You do not have to take any single source's word for it. Fetch GitHub's host
keys directly and print their fingerprints:

```
ssh-keyscan github.com | ssh-keygen -lf -
```

The Ed25519 line in the output should show
`SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU`. To see the fingerprint of
a key you already trusted, look it up in `known_hosts`:

```
ssh-keygen -lf ~/.ssh/known_hosts
```

## Why GitHub uses an Ed25519 host key

Ed25519 host keys are small, fast, and resistant to the weak-randomness
problems that have bitten ECDSA. That is the same reason Ed25519 is recommended
for your personal SSH keys. If you have not made one yet, see
[how to generate an Ed25519 SSH key](/ed25519-ssh-key/), or read
[what is Ed25519](/blog/what-is-ed25519/) for the background.
