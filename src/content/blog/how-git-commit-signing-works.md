---
title: 'How Git Commit Signing Works: A Guide to Secure Code Repositories'
description: 'Learn how to configure Git commit signing using your Ed25519 SSH key to prevent identity spoofing and secure your software supply chain.'
pubDate: 2026-06-18
tags: ['git', 'ssh', 'tutorial', 'security']
author: 'Zeeshan Tariq'
draft: false
---

*Last updated: June 18, 2026*

In software development, Git is the universal standard for version control. However, Git possesses a major security limitation by default: it trusts whatever author name and email address you write in your local configuration.

> **Featured Snippet: How does Git commit signing work?**
> Git commit signing works by generating a digital signature over a commit's metadata (author, date, message, tree) using a developer's private SSH or GPG key. Other developers and platforms like GitHub verify the signature using the matching public key to prove authorship and prevent code tampering.


If you run `git config user.name "Linus Torvalds"` and `git config user.email "torvalds@linux-foundation.org"`, Git will record your commits under Linus Torvalds' identity. When you push these commits to GitHub, the platform will display Torvalds' profile picture next to the commits. This is known as **commit spoofing**, and it represents a major threat to the software supply chain.

To prevent this, developers use **commit signing**. By signing your commits with a private key, you create a verifiable proof of identity.

In this guide, we will explain how commit signing works, compare GPG and SSH signing methods, walk step-by-step through configuring Git to sign commits with your **Ed25519** SSH key, and inspect the internal structure of a signed Git commit object.

---

## Table of Contents
1. [The Security Threat: Commit Spoofing](#the-security-threat-commit-spoofing)
2. [What is Commit Signing?](#what-is-commit-signing)
3. [GPG vs. SSH Commit Signing](#gpg-vs-ssh-commit-signing)
4. [Step-by-Step: Signing commits with Ed25519 SSH keys](#step-by-step-signing-commits-with-ed25519-ssh-keys)
5. [Registering Your Signing Key on GitHub](#registering-your-signing-key-on-github)
6. [How GitHub Verifies Your Commit](#how-github-verifies-your-commit)
7. [Under the Hood: Inside a Signed Commit Object](#under-the-hood-inside-a-signed-commit-object)
8. [Frequently Asked Questions (FAQs)](#frequently-asked-questions-faqs)
9. [About the Author](#about-the-author)
10. [References](#references)

---

## The Security Threat: Commit Spoofing

Git relies on self-reported metadata:
* **The Author:** The person who wrote the code.
* **The Committer:** The person who committed the code to the repository.

Because Git does not perform identity verification locally, a malicious actor inside a company or on an open-source project can write code containing a back door, sign it under a trusted senior developer's email address, and push it to the repository. If other team members do not audit the changes, they might pull the compromised code, trusting the spoofed author metadata.

---

## What is Commit Signing?

Commit signing addresses this vulnerability by incorporating asymmetric cryptography into the commit process. 

When you commit code:
1. Git hashes your commit data (tree, author, committer, date, message).
2. Git encrypts this hash using your **private key** to generate a digital signature.
3. Git appends the signature directly inside the metadata headers of the commit object.

Anyone who pulls the repository can use your public key to verify the signature. If a single byte of the code or metadata has changed, verification fails.

For details on the signature algorithm, see our guide on [signing and verifying with Ed25519](/blog/signing-and-verifying-with-ed25519/).

---

## GPG vs. SSH Commit Signing

Historically, Git relied on **GPG (GNU Privacy Guard)** keys for commit verification. However, GPG is notoriously difficult to configure. Managing GPG trust databases, expiry dates, and subkeys is complex for many developers.

In 2021, Git introduced support for signing commits using standard **SSH keys**. This was a major usability improvement. Since developers already generate SSH keys for repository access, they can use the exact same key types (like Ed25519) to sign their commits, eliminating the need to install or manage GPG.

### Comparison Table

| Feature | GPG Commit Signing | SSH Commit Signing (Ed25519) |
| :--- | :--- | :--- |
| **Configuration Complexity** | High (requires separate GPG utility) | Low (uses standard SSH files) |
| **Key Formats** | Complex PG/GPG key rings | Compact `id_ed25519.pub` files |
| **Tooling Dependencies** | Requires `gpg` installed in system path | Natively supported by Git and OpenSSH |
| **GitHub Support** | Long term support | Supported since 2022 |
| **Security Strength** | High | High (constant-time Curve25519 math) |

---

## Step-by-Step: Signing commits with Ed25519 SSH keys

Follow these steps to configure Git to sign commits locally using your Ed25519 SSH key.

### Step 1: Locate Your Public Key
Ensure you have generated an Ed25519 key pair. Verify the location of your public key file, typically located at:
`~/.ssh/id_ed25519.pub`

If you need to generate one, follow our [how-to-add-ssh-key-to-github tutorial](/blog/how-to-add-ssh-key-to-github/).

### Step 2: Configure Git to Use SSH for Signing
Open your terminal and run the following command to change Git's signing format from GPG to SSH:

```bash
git config --global gpg.format ssh
```

### Step 3: Register Your Signing Key
Tell Git which public key file to use for signing. Paste the path to your public key:

```bash
git config --global user.signingkey ~/.ssh/id_ed25519.pub
```

### Step 4: Enable Global Commit Signing
If you want Git to sign every commit automatically, enable global signing:

```bash
git config --global commit.gpgsign true
```

*If you prefer to sign commits manually, you can leave this option disabled and append the `-S` flag to your commit commands: `git commit -S -m "your message"`.*

---

## Registering Your Signing Key on GitHub

To display a "Verified" badge next to your commits, GitHub must know your public key:

1. Copy your public key text (`cat ~/.ssh/id_ed25519.pub`).
2. Log into GitHub and go to **Settings** -> **SSH and GPG keys**.
3. Click **New SSH key**.
4. In the **Key type** dropdown, select **Signing Key** (rather than Authentication Key).
5. Paste your public key text and save.

---

## How GitHub Verifies Your Commit

When you push signed commits to GitHub:
1. GitHub extracts the signature from the commit object metadata.
2. GitHub locates the public signing key registered on your profile.
3. GitHub verifies the signature against the commit contents.
4. If it matches, GitHub displays the green **Verified** badge.

```text
Commit Metadata:
Author: Zeeshan Tariq <zeeshan@example.com>
Date:   Thu Jun 18 13:56:00 2026
gpgsig: -----BEGIN SSH SIGNATURE-----
        U1NIIFNJR05B...
        -----END SSH SIGNATURE-----
```

---

## Under the Hood: Inside a Signed Commit Object

If you run `git cat-file -p HEAD` on a signed commit, you can inspect the raw data structure of the commit object:

```text
tree 923d248b11122ab30438cf329ab812ff6b0098a8
parent b72ff9aa123b32e6a12aa982cf128abef2338bc8
author Zeeshan Tariq <zeeshan@example.com> 1781877360 +0500
committer Zeeshan Tariq <zeeshan@example.com> 1781877360 +0500
gpgsig -----BEGIN SSH SIGNATURE-----
 U1NIIFNJR05BVEVSRSAAAAA4c3NoLWVkMjU1MTkAAAAgXnyEXunpHWXWalflTr2jXL3Ifw
 nfRvfnnLrtTsfxvwIAAAADc2lnbmF0dXJlAAAAQDC9Z3e2182ab912e8b...
 -----END SSH SIGNATURE-----

This is the commit message body explaining the changes.
```

In this structure, the `gpgsig` header holds the Base64-encoded signature. When Git verifies the commit, it strips out the `gpgsig` header, calculates the SHA-1 (or SHA-256) hash over the remaining metadata and message, and checks if the signature is valid.

---

## Troubleshooting Git Commit Signing Errors

If you run into issues when signing commits, use this checklist to resolve them:

* **Error: gpg failed to sign the data:**
  Even though you configured SSH signing, Git uses the internal binary helper to write the signature. If you see this error, it usually means Git cannot locate your private key file or the SSH agent is not running. Double-check that your private key exists at the path specified in your `gpg.format` config and that the key is loaded in your active `ssh-agent`.
* **Error: Unverified commits on GitHub:**
  If GitHub displays an "Unverified" badge next to your commits, check that the email address inside your Git config matches one of the verified email addresses registered on your GitHub account. Git determines identity by email, and if it differs from the one bound to your public signing key, verification fails.
* **Error: key type not supported:**
  Ensure you are using a modern version of Git (2.34.0 or newer). Older Git installations do not possess the internal helpers to handle SSH signatures.

---

## Frequently Asked Questions (FAQs)

### Q1: What is the difference between an Authentication Key and a Signing Key on GitHub?
An Authentication Key authorizes your local computer to access your account and push code over SSH. A Signing Key is used to verify the digital signatures inside your commits. While you can register the same physical public key for both roles on GitHub, you must upload it twice (selecting the appropriate key type each time).

### Q2: What happens if I edit a signed commit using git commit --amend?
If you amend or rebase a signed commit, Git will rewrite the commit object (changing the date, tree hash, or parent). Since the data has changed, the old signature becomes invalid. Git will automatically generate a new signature using your private key during the amend process.

### Q3: Why does GitHub display "Unverified" on my signed commits?
This happens if the email address inside the Git commit metadata does not match an email registered on the GitHub account holding the public key, or if the public key was not registered as a **Signing Key** in your profile settings.

### Q4: Can I sign commits using a key stored in the SSH agent?
Yes. When you run `git commit`, Git calls the SSH agent in the background to sign the commit data, meaning you do not have to type your passphrase for every commit.

### Q5: How do I sign Git tags?
You can sign Git tags using the `-s` flag during tag creation:
`git tag -s v1.0.0 -m "release version 1.0.0"`
This signs the tag object, allowing other developers to verify the release build.

---

## About the Author

**Written by Zeeshan Tariq**

Software engineer focused on cryptography, authentication systems, and full-stack development. Zeeshan has designed secure authentication integrations for enterprise cloud systems and regularly audits cryptographic configurations.


---

## References
1. Chacon, S., & Straub, B. (2014). *Pro Git*. Apress. [https://git-scm.com/book/en/v2](https://git-scm.com/book/en/v2)
2. Git Project. (2021). *Git 2.34.0 Release Notes (Introducing SSH signing)*. [https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.34.0.txt](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.34.0.txt)
3. GitHub Inc. (2023). *Signing commits with SSH*. GitHub Docs. [https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)
4. IETF. (2017). *Edwards-Curve Digital Signature Algorithm (EdDSA)*. RFC 8032. [https://tools.ietf.org/html/rfc8032](https://tools.ietf.org/html/rfc8032)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How Git Commit Signing Works: A Guide to Secure Code Repositories",
  "description": "Learn how Git commit signing works using GPG or SSH keys. Protect your software supply chain, configure local repositories, and verify authorship on GitHub.",
  "author": {
    "@type": "Person",
    "name": "Zeeshan Tariq"
  },
  "datePublished": "2026-06-18",
  "dateModified": "2026-06-18"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the difference between an Authentication Key and a Signing Key on GitHub?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An Authentication Key authorizes access to push/pull repositories over SSH, while a Signing Key verifies the signatures of commits to prove authorship and integrity."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if I edit a signed commit using git commit --amend?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Git rewrites the commit object (changing its metadata, tree hash, or parent), which invalidates the old signature. Git will automatically generate a new signature using your private key."
      }
    },
    {
      "@type": "Question",
      "name": "Why does GitHub display 'Unverified' on my signed commits?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "This occurs if the email in the commit metadata doesn't match an email verified on your GitHub account, or if the public key isn't registered as a Signing Key."
      }
    },
    {
      "@type": "Question",
      "name": "Can I sign commits using a key stored in the SSH agent?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Git calls the SSH agent in the background to sign the commit, avoiding the need to type your passphrase for every commit."
      }
    },
    {
      "@type": "Question",
      "name": "How do I sign Git tags?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can sign Git tags using the -s flag during tag creation: git tag -s v1.0.0 -m 'release version 1.0.0'."
      }
    }
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Blog",
      "item": "https://ed25519.com/blog/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "How Git Commit Signing Works",
      "item": "https://ed25519.com/blog/how-git-commit-signing-works/"
    }
  ]
}
</script>
