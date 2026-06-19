---
title: 'How to Add an SSH Key to GitHub: A Step-by-Step Guide'
description: 'Learn how to generate an Ed25519 SSH key, add it to your GitHub profile, and test your connection for secure repository access.'
pubDate: 2026-06-18
tags: ['github', 'ssh', 'tutorial']
author: 'Zeeshan Tariq'
draft: false
---

*Last updated: June 18, 2026*

When you work with GitHub repositories, you need to authenticate your computer to perform operations like pushing updates or cloning private codebases. While you can authenticate using personal access tokens over HTTPS, using an SSH key pair is far more convenient and secure.

> **Featured Snippet: How do I add an SSH key to GitHub?**
> To add an SSH key to GitHub, copy your public key (e.g., from `~/.ssh/id_ed25519.pub`), navigate to your GitHub settings under 'SSH and GPG keys', click 'New SSH Key', paste the key content, and select either 'Authentication Key' or 'Signing Key'.


Once configured, SSH key authentication allows you to perform Git actions without typing your username or password every time. Using a modern elliptic curve algorithm like **Ed25519** ensures that your connections are secure, fast, and lightweight.

In this step-by-step tutorial, we will walk through generating a new Ed25519 SSH key, registering it in your GitHub profile, setting up your SSH config file, and testing the connection.

---

## Table of Contents
1. [Why Use SSH Authentication?](#why-use-ssh-authentication)
2. [Symmetric/HTTPS vs. SSH Authentication](#symmetrichttps-vs-ssh-authentication)
3. [Step 1: Generate a New Ed25519 SSH Key](#step-1-generate-a-new-ed25519-ssh-key)
4. [Step 2: Add the Private Key to the SSH Agent](#step-2-add-the-private-key-to-the-ssh-agent)
5. [Step 3: Copy Your Public Key](#step-3-copy-your-public-key)
6. [Step 4: Register the Key in Your GitHub Profile](#step-4-register-the-key-in-your-github-profile)
7. [Step 5: Test the Connection](#step-5-test-the-connection)
8. [Advanced: Configuring Multiple GitHub Keys](#advanced-configuring-multiple-github-keys)
9. [Frequently Asked Questions (FAQs)](#frequently-asked-questions-faqs)
10. [About the Author](#about-the-author)
11. [References](#references)

---

## Why Use SSH Authentication?

GitHub deprecated password authentication for Git operations in 2021. Today, if you connect over HTTPS, you must generate a Personal Access Token (PAT) and paste it as a password. 

Managing token strings is tedious. Tokens can expire, and storing them securely on multiple machines is difficult.

SSH keys solve this. The system uses a public-private key pair:
* Your **private key** remains encrypted on your local computer.
* Your **public key** is uploaded to GitHub.

When you run `git push`, your computer signs a challenge using your private key. GitHub verifies it with your public key, granting access instantly.

---

## Symmetric/HTTPS vs. SSH Authentication

Below is a comparison of the two main connection methods for GitHub:

| Feature | HTTPS + Personal Access Token | SSH Key Pair (Ed25519) |
| :--- | :--- | :--- |
| **Setup Complexity** | Low (generates a token string) | Medium (requires key generation) |
| **Authentication Flow** | Token pasted as password | Cryptographic handshake |
| **Token Expiry** | Expired tokens must be regenerated | Keys do not expire (unless rotated) |
| **Usability** | Requires credential helper caching | Handled automatically by the SSH agent |
| **Security Level** | Moderate (tokens can leak via logs) | High (private key never leaves device) |

---

## Checking for Existing SSH Keys

Before generating a new Ed25519 key pair, you should check if your computer already has existing keys. This prevents you from accidentally overwriting your current active credentials.

Open your terminal or PowerShell and list the contents of your `.ssh` directory:

```bash
ls -al ~/.ssh
```

Look for files with the following names:
* `id_ed25519` and `id_ed25519.pub` (Ed25519 keys)
* `id_rsa` and `id_rsa.pub` (RSA keys)

If you see these files and want to reuse them, you can skip key generation and proceed directly to adding the key to the SSH agent. If you do not have these files or want to configure a fresh key, continue to the next step.

---

## Step 1: Generate a New Ed25519 SSH Key

First, open your terminal (on Linux or macOS) or PowerShell (on Windows). Run the following command to generate a new key pair using the Ed25519 algorithm:

```bash
ssh-keygen -t ed25519 -a 100 -C "your_email@example.com"
```

* `-t ed25519`: Specifies the modern Ed25519 elliptic curve algorithm.
* `-a 100`: Instructs `ssh-keygen` to run 100 rounds of key derivation (bcrypt) when saving your private key file, protecting it against offline brute-force attacks.
* `-C "your_email@example.com"`: Appends an identifying comment to the end of the public key file.

During execution, the program will prompt you:
1. **Enter file in which to save the key:** Press Enter to accept the default location (`~/.ssh/id_ed25519`).
2. **Enter passphrase:** Type a secure password to encrypt your private key file. While you can press Enter to configure a key without a password, setting a passphrase is a recommended safety practice.

For details on the files generated, check out our [id_ed25519 guide](/blog/id_ed25519/).

---

## Step 2: Add the Private Key to the SSH Agent

To avoid typing your passphrase every time you communicate with GitHub, you should register your key with the local **SSH Agent** (`ssh-agent`).

### 1. Start the Agent in the Background
* **On Linux or macOS:**
  ```bash
  eval "$(ssh-agent -s)"
  ```
* **On Windows (PowerShell as Admin):**
  ```powershell
  Set-Service -Name ssh-agent -StartupType Automatic
  Start-Service ssh-agent
  ```

### 2. Register Your Private Key
Run the `ssh-add` command:

```bash
ssh-add ~/.ssh/id_ed25519
```

Type your passphrase. The agent will hold the decrypted key in your computer's RAM, handling future authentication requests automatically.

---

## Step 3: Copy Your Public Key

Next, you need to copy the contents of your **public key file** (`id_ed25519.pub`). Do not open or copy the private key file.

Run the appropriate command to display and copy the public key:

* **On macOS:**
  ```bash
  pbcopy < ~/.ssh/id_ed25519.pub
  ```
* **On Windows (PowerShell):**
  ```powershell
  Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
  ```
* **On Linux:**
  ```bash
  cat ~/.ssh/id_ed25519.pub
  ```
  *(Manually copy the output line from the terminal).*

The copied text must be a single line beginning with `ssh-ed25519` and ending with your email comment.

---

## Step 4: Register the Key in Your GitHub Profile

Now, add the key to your GitHub account:

1. Log into your account on [GitHub.com](https://github.com).
2. Click your profile photo in the top right corner, then select **Settings**.
3. In the left-hand navigation pane, click **SSH and GPG keys**.
4. Click the **New SSH key** button in the top right.
5. In the **Title** field, type a description for the key (e.g., "Personal MacBook Pro" or "Work PC").
6. Set the **Key type** to **Authentication Key**.
7. Paste your copied public key into the **Key** field.
8. Click **Add SSH key**. Confirm your GitHub password if prompted.

---

## Step 5: Test the Connection

To verify that your key is correctly registered and your client can connect, test the connection over SSH:

```bash
ssh -T git@github.com
```

The first time you connect, your client will prompt you to trust GitHub's host key. Look for the Ed25519 fingerprint:

```text
The authenticity of host 'github.com (140.82.121.4)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Verify that the fingerprint matches the value shown above. If it matches, type `yes` and press Enter.

For more details on verifying this prompt, see our [GitHub host key fingerprint guide](/blog/github-ssh-host-key-fingerprint-ed25519/).

Once accepted, the terminal will output:
```text
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

If you see this message, your SSH authentication is fully functional! You can now configure your Git repositories to use SSH URLs (e.g., `git@github.com:username/repository.git`).

---

## Advanced: Configuring Multiple GitHub Keys

If you manage multiple GitHub accounts (such as a personal account and a work account) on the same computer, you must configure your SSH client to associate each account with a unique key. 

To do this, create or edit your SSH config file (`~/.ssh/config`):

```text
# Personal GitHub Account
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes

# Work GitHub Account
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

When cloning repositories, modify the domain hostname to match your configuration targets:
* Personal: `git clone git@github.com-personal:personal_user/repo.git`
* Work: `git clone git@github.com-work:work_user/repo.git`

---

## Frequently Asked Questions (FAQs)

### Q1: Why does GitHub reject my key with a "key already in use" error?
GitHub requires each SSH public key to be associated with a single account. If you attempt to upload a public key that is already registered on another account, GitHub will reject it. You must generate a new key pair for the second account.

### Q2: Can I use PuTTYgen keys on GitHub?
Yes. PuTTYgen generates public keys in the same format. You can copy the public key text directly from the text box at the top of the PuTTYgen window and paste it into GitHub. For a full PuTTY guide, see [putty-ed25519](/blog/putty-ed25519/).

### Q3: What is the difference between an Authentication Key and a Signing Key on GitHub?
An **Authentication Key** allows you to log into GitHub and push/pull code over SSH. A **Signing Key** is used to verify your Git commits using GPG or SSH signature verification.

### Q4: How do I fix "Permission denied (publickey)" when connecting to GitHub?
This error means GitHub did not recognize the offered key. Verify that the agent is running (`ssh-add -l` should list your key), check that you copied the correct public key contents, and ensure you are connecting as the `git` user (i.e., `git@github.com`, not `username@github.com`).

### Q5: Do SSH keys on GitHub expire?
GitHub does not assign an expiration date to SSH keys. However, it is a recommended security practice to audit your keys annually and rotate them if you replace your devices.

---

## About the Author

**Written by Zeeshan Tariq**

Software engineer focused on cryptography, authentication systems, and full-stack development. Zeeshan has designed secure authentication integrations for enterprise cloud systems and regularly audits cryptographic configurations.


---

## References
1. GitHub Inc. (2023). *Connecting to GitHub with SSH*. GitHub Docs. [https://docs.github.com/en/authentication/connecting-to-github-with-ssh](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
2. OpenSSH Project. (2020). *ssh-agent manual page*. [https://man.openbsd.org/ssh-agent](https://man.openbsd.org/ssh-agent)
3. IETF. (2006). *The Secure Shell (SSH) Transport Layer Protocol*. RFC 4253. [https://tools.ietf.org/html/rfc4253](https://tools.ietf.org/html/rfc4253)
4. GitHub Inc. (2023). *GitHub SSH key fingerprints*. [https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Add an SSH Key to GitHub: A Step-by-Step Guide",
  "description": "A step-by-step developer tutorial for generating, copying, and adding secure Ed25519 SSH keys to your GitHub account settings.",
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
      "name": "Why does GitHub reject my key with a 'key already in use' error?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GitHub requires each public key to be unique across all accounts. If you see this error, you have already uploaded the key to another account or repository deploy key settings."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use PuTTYgen keys on GitHub?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, but you must copy the OpenSSH-formatted public key displayed at the top of the PuTTYgen window, not the raw saved public key file."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between an Authentication Key and a Signing Key on GitHub?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Authentication keys authorize repository read/write access, while signing keys verify digital signatures inside your commits to prove code authorship."
      }
    },
    {
      "@type": "Question",
      "name": "How do I fix 'Permission denied (publickey)' when connecting to GitHub?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Verify that your private key is loaded into your SSH agent, check that your config uses host github.com, and verify the public key matches the one in GitHub settings."
      }
    },
    {
      "@type": "Question",
      "name": "Do SSH keys on GitHub expire?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, SSH keys do not expire on GitHub by default, but you can set optional expiration dates or rotate keys regularly for security."
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
      "name": "How to Add an SSH Key to GitHub",
      "item": "https://ed25519.com/blog/how-to-add-ssh-key-to-github/"
    }
  ]
}
</script>
