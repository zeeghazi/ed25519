---
title: 'Does PuTTY support Ed25519? (and how to generate a key)'
description: 'PuTTY has supported Ed25519 since version 0.68 (2017). How to generate an Ed25519 key with PuTTYgen, use it with Pageant, and which version added support.'
pubDate: 2026-06-02
tags: ['ssh', 'putty', 'windows']
author: 'Zeeshan Tariq'
draft: false
---

*Last updated: June 17, 2026*

For Windows developers and system administrators, PuTTY has long been the primary tool for connecting to remote Linux servers over SSH. However, as the cryptographic community transitioned away from older, slower RSA keys in favor of modern Elliptic Curve Cryptography (ECC), a common question emerged: **Does PuTTY support Ed25519?**

> **Featured Snippet: Does PuTTY support Ed25519?**
> Yes. PuTTY has fully supported Ed25519 keys since version 0.68, released in February 2017. You can generate modern Ed25519 keys using the bundled PuTTYgen utility and manage them using Pageant for authentication.


The short answer is **yes**. PuTTY has fully supported Ed25519 since version 0.68, released in February 2017. 

In this comprehensive guide, we will explore the history of ECC in PuTTY, walk step-by-step through generating an Ed25519 key pair using the PuTTYgen utility, analyze the security of PuTTY's custom `.ppk` file format, and look at how to automate key management using the Pageant SSH agent. We will also cover how to convert keys between OpenSSH and PuTTY formats.

---

## Table of Contents
1. [Which PuTTY Version Added Ed25519?](#which-putty-version-added-ed25519)
2. [Step-by-Step: Generating an Ed25519 Key in PuTTYgen](#step-by-step-generating-an-ed25519-key-in-puttygen)
3. [Inside the `.ppk` Format: Why It Exists and How It Works](#inside-the-ppk-format-why-it-exists-and-how-it-works)
4. [Configuring a PuTTY Session with Your Key](#configuring-a-putty-session-with-your-key)
5. [Format Conversions: Moving Keys Between PuTTY and OpenSSH](#format-conversions-moving-keys-between-putty-and-openssh)
6. [Managing Keys with Pageant](#managing-keys-with-pageant)
7. [Frequently Asked Questions (FAQs)](#frequently-asked-questions-faqs)
8. [References](#references)

---

## Which PuTTY Version Added Ed25519?

Support for elliptic curve cryptography, including Curve25519 and the Ed25519 signature scheme, was introduced in **PuTTY 0.68** on February 21, 2017. This release brought ECDSA and Ed25519 support for host keys, user authentication, and key exchanges.

Subsequent versions have expanded on these capabilities:
* **PuTTY 0.75** (May 2021) added support for the larger Ed448 elliptic curve.
* **PuTTY 0.81** (March 2024) introduced critical security updates to mitigate the "Terrapin" vulnerability (which affected SSH packet sequences) and patched a rare signature-leak issue in ECDSA.
* **PuTTY 0.84** (current version) maintains full, optimized support for Ed25519.

If you are using a PuTTY version older than 0.68, you must download the latest release from the official PuTTY website before attempting to use Ed25519 keys.

---

## Step-by-Step: Generating an Ed25519 Key in PuTTYgen

PuTTY does not use the command-line `ssh-keygen` tool by default. Instead, it relies on a graphical companion application called **PuTTYgen** (PuTTY Key Generator).

Follow these steps to generate a secure Ed25519 key pair:

### 1. Launch PuTTYgen
Open your Windows Start menu, search for **PuTTYgen**, and run the application.

### 2. Configure Key Parameters
Look at the bottom section of the window labeled **Parameters**:
* Under **Type of key to generate**, select **EdDSA**.
* In the **Curve to use** dropdown menu, select **Ed25519 (255 bits)**.

*(Note: In older versions of PuTTYgen, you might need to select **Ed25519** directly from the key type list).*

### 3. Generate the Key
Click the **Generate** button. To generate entropy (randomness), move your mouse cursor randomly across the blank area in the middle of the window. The progress bar will fill up as your mouse movement feeds the random number generator.

### 4. Secure the Private Key
Once the key is generated:
* **Key comment:** The comment field will default to something like `eddsa-key-20260617`. You can change this to your email address or a descriptive label.
* **Key passphrase:** Enter a secure password in the **Key passphrase** field and re-enter it in the **Confirm passphrase** field. 

> [!IMPORTANT]
> Never leave the passphrase blank. If you save your private key without a password, anyone who gains access to your computer's files can copy the key and log into your remote servers instantly.

### 5. Save the Key Files
* Click **Save private key** to save the private key as a `.ppk` file (e.g., `id_ed25519.ppk`). Save this file in a secure location on your local machine.
* Click **Save public key** to save the public half as a text file for backup.
* **To authorize access:** Copy the entire block of text from the box at the top labeled **Public key for pasting into OpenSSH authorized_keys file**. The text should begin with `ssh-ed25519 AAAA...`. You will paste this line directly into your GitHub account settings or into the `~/.ssh/authorized_keys` file on your remote Linux server.

---

## Inside the `.ppk` Format: Why It Exists and How It Works

Unlike OpenSSH, which saves private keys as raw PEM or custom OpenSSH text blocks, PuTTY uses its own file format: the **PPK (PuTTY Private Key)** file. 

### Why PuTTY Uses `.ppk`
OpenSSH's private key format stores the public key and the private key together. If you want to view the public key, the client must decrypt the private key (requiring your passphrase) to extract the public half. 

The PuTTY team wanted a format where the public key remains readable in plaintext *without* decrypting the file, allowing applications like Pageant to display your public key comments and fingerprints instantly without prompting you for a password.

### PPK Version 2 vs. PPK Version 3
Over time, the PPK format has evolved to counter modern computational attacks.

* **PPK v2 (Legacy):**
  Uses SHA-1 to derive encryption keys from passphrases. While it remains functional, it is vulnerable to offline brute-force attacks if an attacker obtains the file, due to SHA-1's speed on modern GPUs.
* **PPK v3 (Modern default):**
  Introduced in PuTTY 0.75, PPK v3 uses the **Argon2** key derivation function (specifically `Argon2id`). Argon2 is a memory-hard algorithm designed to make GPU-based brute-force cracking extremely expensive. Additionally, PPK v3 replaces SHA-1 with SHA-256 for Message Authentication Codes (MAC), ensuring the key data has not been modified.

If you open a modern Ed25519 `.ppk` file in a text editor, you will see headers detailing the Argon2 parameters:

```text
PuTTY-User-Key-File-3: ssh-ed25519
Encryption: aes256-cbc
Comment: your_email@example.com
Key-Derivation: Argon2id
Argon2-Memory: 8192
Argon2-Passes: 13
Argon2-Parallelism: 1
Public-Lines: 2
AAAAC3NzaC1lZDI1NTE5AAAAIF58hF7p6R1122pX5U69o1u9yH8J30b355y67U7H8b8C
Private-MAC: 5e6a9f8c7d...
```

This structured formatting makes PPK v3 files highly secure and robust.

---

## Configuring a PuTTY Session with Your Key

If you prefer not to use Pageant (or want to make sure a specific saved session always uses a specific key), you can configure PuTTY to load your `.ppk` file automatically for a specific host:

1. Launch **PuTTY**.
2. In the **Category** tree on the left, navigate to **Connection** -> **SSH** -> **Auth**.
3. In modern PuTTY versions, click on **Credentials** under **Auth**. (In older versions, you may stay on the main **Auth** screen).
4. Locate the field labeled **Private key file for authentication** and click the **Browse...** button.
5. Select your saved `.ppk` file (e.g., `id_ed25519.ppk`).
6. Navigate back to the **Session** category at the top of the left-hand tree.
7. Under **Saved Sessions**, type a name for your connection (e.g., `MyLinuxServer`) and click **Save**.

Now, when you double-click that saved session, PuTTY will automatically authenticate using the specified Ed25519 key, prompting you only for the key's passphrase.

---

## Format Conversions: Moving Keys Between PuTTY and OpenSSH

If you collaborate across Windows and Unix-like operating systems, you will often need to convert keys between OpenSSH's flat-file format and PuTTY's `.ppk` format.

### 1. Converting OpenSSH (`id_ed25519`) to PuTTY (`.ppk`)
If you generated an Ed25519 key on Linux using `ssh-keygen` and want to use it with PuTTY on Windows:

1. Open **PuTTYgen**.
2. Go to the top menu and select **Conversions** -> **Import key**.
3. Browse to and select your OpenSSH private key file (`id_ed25519`).
4. Enter the key's passphrase if prompted.
5. Click **Save private key** to write out the `.ppk` file.

### 2. Converting PuTTY (`.ppk`) to OpenSSH (`id_ed25519`)
If you created a `.ppk` key in Windows and need the standard OpenSSH format for a Linux system or CI/CD variable:

1. Open **PuTTYgen**.
2. Go to **File** -> **Load private key** and select your `.ppk` file.
3. Enter the passphrase.
4. Go to **Conversions** -> **Export OpenSSH key** (or **Export OpenSSH key (force V2/new format)** for the modern OpenSSH format).
5. Save the file without a file extension as `id_ed25519`.

### Command-Line Conversion on Linux
If you are on Linux and want to convert a `.ppk` file to an OpenSSH key via the command line, you can install the `putty-tools` package and run:

```bash
puttygen id_ed25519.ppk -O private-openssh -o id_ed25519
```

---

## Managing Keys with Pageant

Pageant is PuTTY's built-in SSH agent. It runs in your Windows system tray, decrypts your `.ppk` keys once in memory, and automatically handles authentication requests from PuTTY, WinSCP, FileZilla, and Git.

### How to Use Pageant
1. Launch **Pageant** from your start menu. An icon representing a computer wearing a hat will appear in your system tray.
2. Right-click the Pageant tray icon and select **Add Key**.
3. Select your `.ppk` file and enter your passphrase.
4. The key is now loaded in memory. When you open a PuTTY session to a server containing your public key, Pageant will authenticate you automatically without prompting for a password.

### Automating Pageant Startup on Windows
To load your keys automatically when Windows starts:
1. Press `Win + R`, type `shell:startup`, and press Enter. This opens your system's Startup folder.
2. Right-click inside the folder, select **New** -> **Shortcut**.
3. Browse to the path of your Pageant executable (usually `C:\Program Files\PuTTY\pageant.exe`).
4. In the target box, append the path to your private key file:
   `"C:\Program Files\PuTTY\pageant.exe" C:\Users\YourUser\.ssh\id_ed25519.ppk`
5. Click **Next** and **Finish**.

Now, when you log into Windows, Pageant will launch and prompt you for your key passphrase immediately, preparing your SSH environment for the day.

### Pageant Integration with WSL (Windows Subsystem for Linux)
If you run Linux tools inside WSL, they cannot access Pageant directly because Pageant uses Windows-specific message passing. 

To bridge this gap, you can use third-party tools like **wsl-ssh-agent-bridge** or **ssh-agent-wsl**. These tools run a background listener in Windows and export a Unix socket inside WSL, allowing tools like Git in Ubuntu to authenticate using the keys managed by Pageant.

---

## Frequently Asked Questions (FAQs)

### Q1: What is the difference between PuTTY and OpenSSH formats?
OpenSSH uses standard formats (`id_ed25519`), which are flat PEM or OpenSSH text files. PuTTY uses its own custom `.ppk` (PuTTY Private Key) format, which contains metadata and structural parameters in plaintext (allowing fast key loading in Pageant) while keeping the private key safely encrypted.

### Q2: Why does PuTTYgen tell me it generated an EdDSA key instead of Ed25519?
Ed25519 is an implementation of the EdDSA (Edwards-curve Digital Signature Algorithm). When you select EdDSA in PuTTYgen and choose the **Ed25519 (255 bits)** curve, you are generating an Ed25519 key.

### Q3: Can I use PuTTYgen on Linux?
Yes. Although PuTTYgen is primarily known as a Windows GUI utility, the `putty-tools` package on Linux installs a command-line version of `puttygen` that you can use to convert, generate, and manage PPK keys on Linux systems.

### Q4: Does Pageant encrypt my keys in RAM?
No. Once you enter your passphrase, Pageant decrypts the private key and holds it in your computer's active memory (RAM) in plaintext so it can sign challenges. If your computer goes to sleep or restarts, Pageant loses the keys and you must re-add them.

### Q5: What is PPK v3 and should I use it?
PPK v3 is the modern version of the PuTTY Private Key format. It replaces the old SHA-1 key derivation with the highly secure, memory-hard Argon2id algorithm, making your key files far more resistant to offline brute-force attacks. You should always use PPK v3 (the default in PuTTY 0.75 and newer).

---

## About the Author

**Written by Zeeshan Tariq**

Software engineer focused on cryptography, authentication systems, and full-stack development. Zeeshan has designed secure authentication integrations for enterprise cloud systems and regularly audits cryptographic configurations.


---

## References
1. Tatham, S. (2024). *PuTTY Release Notes and Documentation*. [https://www.chiark.greenend.org.uk/~sgtatham/putty/](https://www.chiark.greenend.org.uk/~sgtatham/putty/)
2. Tatham, S. (2021). *PuTTY Private Key (PPK) file format version 3 specification*. [https://git.tartarus.org/?p=simon/putty.git;a=blob;f=doc/ppk.but](https://git.tartarus.org/?p=simon/putty.git;a=blob;f=doc/ppk.but)
3. IETF. (2017). *Edwards-Curve Digital Signature Algorithm (EdDSA)*. RFC 8032. [https://tools.ietf.org/html/rfc8032](https://tools.ietf.org/html/rfc8032)
4. Biryukov, A., Dinu, D., & Khovratovich, D. (2016). *Argon2: new generation of memory-hard functions*. ECRYPT. [https://www.cryptolounge.org/wiki/Argon2](https://www.cryptolounge.org/wiki/Argon2)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Does PuTTY support Ed25519? (and how to generate a key)",
  "description": "Learn how to use, generate, and convert modern Ed25519 SSH keys in PuTTY, PuTTYgen, and Pageant on Windows operating systems.",
  "author": {
    "@type": "Person",
    "name": "Zeeshan Tariq"
  },
  "datePublished": "2026-06-17",
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
      "name": "What is the difference between PuTTY and OpenSSH formats?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PuTTY uses its own proprietary .ppk format which stores metadata in plaintext, while OpenSSH uses PEM or OpenSSH format where all key elements are enclosed in a unified block."
      }
    },
    {
      "@type": "Question",
      "name": "Why does PuTTYgen tell me it generated an EdDSA key instead of Ed25519?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "EdDSA is the family of signature algorithms, and Ed25519 is EdDSA operating over Curve25519. They refer to the same cryptographic keys in this context."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use PuTTYgen on Linux?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. A command-line version of PuTTYgen is available in the putty-tools package on Linux, allowing you to convert keys between OpenSSH and PPK formats."
      }
    },
    {
      "@type": "Question",
      "name": "Does Pageant encrypt my keys in RAM?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Once you enter your passphrase, Pageant decrypts the private key and holds it in your computer's active memory (RAM) in plaintext to sign authentication challenges."
      }
    },
    {
      "@type": "Question",
      "name": "What is PPK v3 and should I use it?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PPK v3 is PuTTY's latest key file format. It uses Argon2 key derivation for enhanced resistance to offline brute-force attacks. You should use it for all new keys."
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
      "name": "Does PuTTY support Ed25519?",
      "item": "https://ed25519.com/blog/putty-ed25519/"
    }
  ]
}
</script>
