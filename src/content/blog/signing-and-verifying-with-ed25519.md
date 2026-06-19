---
title: 'Signing and verifying messages with Ed25519: a walkthrough'
description: 'A hands-on walkthrough of signing a message with an Ed25519 private key and verifying it with the public key, including what each value means.'
pubDate: 2026-05-28
tags: ['tutorial', 'signing']
author: 'Zeeshan Tariq'
draft: false
---

*Last updated: June 17, 2026*

In asymmetric cryptography, keys perform two primary operations: encryption (hiding data) and digital signatures (proving authorship). While Curve25519 is used for key exchanges (via the X25519 protocol), **Ed25519** is designed specifically to handle digital signatures.

> **Featured Snippet: How does signing and verifying with Ed25519 work?**
> In Ed25519, signing works by combining a message and the sender's private scalar to produce a 64-byte deterministic signature. Verification works by using the sender's public key to check that the signature matches the message hash, ensuring authenticity and integrity.


A digital signature is the digital equivalent of a hand-written signature, but far more secure. It proves two things simultaneously:
1. **Authenticity:** The message was created by the holder of the matching private key.
2. **Integrity:** The message has not been modified in transit, not even by a single bit.

In this guide, we will break down the mathematical mechanics of how Ed25519 signs and verifies messages under the hood. We will then walk through concrete code implementations in Node.js, Python, and Rust, and explore how digital signatures are applied in real-world systems like Git, JWT tokens, and blockchain technology.

---

## Table of Contents
1. [The Core Concept: Non-Repudiation and Digital Signatures](#the-core-concept-non-repudiation-and-digital-signatures)
2. [The Mathematical Mechanics of Ed25519 Signing](#the-mathematical-mechanics-of-ed25519-signing)
3. [The Mechanics of Verification](#the-mechanics-of-verification)
4. [Code Walkthrough: Implementing Ed25519 Signatures](#code-walkthrough-implementing-ed25519-signatures)
5. [Real-World Use Cases](#real-world-use-cases)
6. [Hands-On Verification: Try it Yourself](#hands-on-verification-try-it-yourself)
7. [Frequently Asked Questions (FAQs)](#frequently-asked-questions-faqs)
8. [References](#references)

---

## The Core Concept: Non-Repudiation and Digital Signatures

Before looking at the math, it helps to understand why digital signatures are unique. In symmetric cryptography, if two people share a secret password, either of them can sign or encrypt a message. Because both hold the same key, neither can mathematically prove that the *other* person wrote a message. 

Asymmetric digital signatures solve this by providing **non-repudiation**:
* Since only you hold your **private key**, only you could have generated the signature.
* Since everyone has access to your **public key**, anyone can verify the signature.
* If you generate a signature, you cannot deny having written the message, as no one else has the key required to produce that specific mathematical proof.

---

## The Mathematical Mechanics of Ed25519 Signing

Ed25519 uses the **Edwards-curve Digital Signature Algorithm (EdDSA)**. The signing process is deterministic, meaning it does not rely on a random number generator during the signing step. Here is how it works step-by-step:

### 1. The Inputs
To generate a signature, you need three things:
* A **message ($M$)** (represented as a byte array).
* A **32-byte private key seed ($k$)**.
* A **32-byte public key ($A$)**, which is the compressed point $s \cdot B$ (where $s$ is the secret scalar derived from $k$, and $B$ is the public base point).

### 2. Generating the Deterministic Scalar $r$
Instead of selecting a random value for the nonce, which is a major security vulnerability in ECDSA, Ed25519 derives a secret value $r$ using the SHA-512 hash function. 

The system hashes the secret prefix (the right half of the SHA-512 digest of the seed $k$, which we will call $prefix$) concatenated with the message $M$:
$$r = \text{SHA-512}(prefix \parallel M)$$

This output is interpreted as a massive 512-bit integer modulo $L$ (the prime order of the Curve25519 subgroup).

Because $r$ is derived directly from the message and your private key prefix, it is completely unique to this specific message. If you sign the message again, $r$ remains the same. If you change a single character in the message, $r$ changes completely.

### 3. Calculating the Commitment Point $R$
Next, the algorithm performs scalar multiplication, multiplying the derived scalar $r$ by the public base point $B$:
$$R = r \cdot B$$

The resulting point $R$ is compressed into a 32-byte representation. This is the first half of the final signature.

### 4. Generating the Verification Scalar $S$
The algorithm now creates a second scalar $S$. First, it computes a SHA-512 hash of the commitment point $R$, the public key $A$, and the message $M$:
$$h = \text{SHA-512}(R \parallel A \parallel M)$$

Like $r$, this hash is converted into a large integer modulo $L$. Finally, the algorithm computes $S$:
$$S = (r + h \cdot s) \pmod L$$

Where $s$ is the private scalar derived from your seed (the clamped left half of the seed's hash).

### 5. The Signature Output
The final signature is a **64-byte (512-bit) array** formed by concatenating the 32-byte compressed point $R$ and the 32-byte encoded scalar $S$:
$$\text{Signature} = R \parallel S$$

```text
Ed25519 Signature (64 bytes):
[  Point R: 32 bytes  ] [  Scalar S: 32 bytes  ]
```

---

## The Mechanics of Verification

To verify a signature, an external validator requires:
* The original **message ($M$)**.
* The sender's **public key ($A$)**.
* The **signature ($R \parallel S$)**.

The verification process performs a mathematical test to confirm if the signature scalar $S$ matches the commitment point $R$ and the public key $A$:

1. The validator parses $R$ and $S$ from the signature.
2. The validator calculates the same hash value $h$:
   $$h = \text{SHA-512}(R \parallel A \parallel M) \pmod L$$
3. The validator checks if the following elliptic curve equation holds true:
   $$S \cdot B = R + h \cdot A$$

### Why does this equation work?
We can expand the terms to verify the mathematical relationship:
* We know that $S = r + h \cdot s$.
* Multiplying both sides by the base point $B$ yields:
  $$S \cdot B = (r + h \cdot s) \cdot B$$
  $$S \cdot B = r \cdot B + h \cdot (s \cdot B)$$
* Since $R = r \cdot B$ and $A = s \cdot B$, we substitute these values:
  $$S \cdot B = R + h \cdot A$$

To prevent mathematical attacks utilizing rare points on the curve (low-order points), implementations actually multiply the entire equation by the curve cofactor $8$:
$$8S \cdot B = 8R + 8h \cdot A$$

If both sides of the equation balance out, verification returns **true** (the signature is valid). If even a single bit of the message, signature, or public key is altered, the equation fails, and verification returns **false**.

---

## Code Walkthrough: Implementing Ed25519 Signatures

Almost every modern programming language includes support for Ed25519 in its standard library or official cryptographic packages.

### 1. Implementation in Node.js (Web Crypto API)
Modern Node.js versions (v15+) support Ed25519 natively via the standard `crypto` module.

```javascript
const crypto = require('crypto');

async function runSignatureRoundtrip() {
  // 1. Generate an Ed25519 Keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { format: 'der', type: 'pkcs8' },
    publicKeyEncoding: { format: 'der', type: 'spki' }
  });

  const message = Buffer.from("Secure this message");

  // 2. Sign the message
  const signature = crypto.sign(null, message, privateKey);
  console.log("Signature (64 bytes / hex):", signature.toString('hex'));

  // 3. Verify the signature
  const isValid = crypto.verify(null, message, publicKey, signature);
  console.log("Is the signature valid?", isValid); // Output: true

  // 4. Test tampering
  const tamperedMessage = Buffer.from("Secure this Message"); // changed 'm' to 'M'
  const isStillValid = crypto.verify(null, tamperedMessage, publicKey, signature);
  console.log("Is tampered signature valid?", isStillValid); // Output: false
}

runSignatureRoundtrip();
```

### 2. Implementation in Python (PyNaCl / libsodium)
Python developers typically use the `pynacl` library, which wraps the fast C-based `libsodium` library.

```python
from nacl.signing import SigningKey, VerifyKey
from nacl.exceptions import BadSignatureError

# 1. Generate a signing key (private key)
signing_key = SigningKey.generate()

# 2. Extract the verify key (public key)
verify_key = signing_key.verify_key

message = b"Cryptographic validation"

# 3. Sign the message
signature = signing_key.sign(message)
raw_signature = signature.signature
print(f"Raw Signature (hex): {raw_signature.hex()}")

# 4. Verify the message
try:
    verify_key.verify(message, raw_signature)
    print("Verification successful!")
except BadSignatureError:
    print("Verification failed!")
```

### 3. Implementation in Rust (`ed25519-dalek`)
In the Rust ecosystem, `ed25519-dalek` is the standard, highly-optimized crate for Ed25519 operations.

```rust
use ed25519_dalek::{Keypair, Signer, Verifier, Signature};
use rand::rngs::OsRng;

fn main() {
    // 1. Generate keypair using system entropy
    let mut csprng = OsRng;
    let keypair: Keypair = Keypair::generate(&mut csprng);

    let message: &[u8] = b"Rust performance signing";

    // 2. Generate the signature
    let signature: Signature = keypair.sign(message);
    println!("Signature: {:?}", signature.to_bytes());

    // 3. Verify the signature
    let public_key = keypair.public;
    let is_valid = public_key.verify(message, &signature).is_ok();
    println!("Is valid? {}", is_valid); // Output: true
}
```

---

## Real-World Use Cases

Because of its balance of speed, safety, and short signature size, Ed25519 is used across many areas of modern technology.

### 1. JSON Web Tokens (JWT) using EdDSA
Web applications use JSON Web Tokens (JWT) to authenticate API requests. When a user logs in, the server generates a token containing user details and signs it. On subsequent requests, the server verifies the signature.

While RSA (`RS256`) was historically the standard for signing JWTs, the newer `EdDSA` algorithm (utilizing Ed25519) is becoming the standard. The resulting token is shorter, which reduces HTTP header sizes and speeds up verification on API gateways.

### 2. Git Commit Signing
To prevent developers from spoofing commits (pretending to be another author), Git supports signing commits using SSH keys or GPG keys. By generating an Ed25519 key pair, you can configure Git to sign every commit automatically:

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

When you push your commits to platforms like GitHub, the platform verifies your signature against the public key uploaded to your profile, displaying a "Verified" badge next to your commits.

### 3. Secure Firmware Updates
IoT (Internet of Things) devices and embedded hardware must verify that firmware updates are authentic before installing them to prevent remote bricking or malware injection. 

Because IoT devices have limited memory and power, they cannot afford the computation overhead of verifying massive RSA-3072 signatures. Ed25519's fast verification and tiny 64-byte signature overhead make it perfect for resource-constrained hardware.

### 4. Blockchain and Smart Contracts
Blockchains process thousands of transactions per second, and every single transaction must be cryptographically signed by an account holder. 

Modern blockchains like **Solana**, **Cardano**, **NEAR**, and **Stellar** use Ed25519 as their primary account key and signing standard. The speed of Ed25519 allows validator nodes to verify signatures in parallel at high throughput rates, which is a major factor in scaling transaction capacity.

---

## Hands-On Verification: Try it Yourself

You do not need to write code to see this in action. Our homepage features an interactive, in-browser demonstration:
1. Navigate to the **[Key Generator Tool](/#tool)** on the home page to instantly generate an Ed25519 key pair.
2. Go to the **[Message Signing Tool](/#sign)**, paste your private key, and type a message to generate a 64-byte signature.
3. Paste the message, public key, and signature into the **[Signature Verifier](/#verify)** to test the validation math. Try changing a single character in the message and observe how the validation instantly fails.

All calculations run locally in your browser's sandboxed memory, ensuring your keys never leave your machine.

To learn more about the math behind generating these keys, check out our guide on [how Ed25519 key generation works](/blog/how-ed25519-key-generation-works/). For details on setting up your own keys, see our [Ed25519 SSH key guide](/ed25519-ssh-key/).

---

## Frequently Asked Questions (FAQs)

### Q1: Can I use an Ed25519 signature to encrypt a message?
No. Ed25519 is purely a signature scheme and does not have native encryption mechanisms. For encrypting data, you should establish a shared key using X25519 Diffie-Hellman and encrypt with a symmetric algorithm like ChaCha20. Refer to [X25519 vs Ed25519](/blog/x25519-vs-ed25519/) for the trade-offs.

### Q2: Why is Ed25519 signing called "deterministic"?
Unlike ECDSA or RSA-PSS, which require generating a cryptographically secure random value during signing, Ed25519 derives its nonce using a cryptographic hash of the private key prefix and the message. This ensures that the same message and key always produce the exact same signature.

### Q3: What happens if I change one letter of the message after signing it?
The verification equation ($8S \cdot B = 8R + 8h \cdot A$) will fail because the hash value $h = \text{SHA-512}(R \parallel A \parallel M)$ will change completely, resulting in the equation not balancing. The signature will be rejected as invalid.

### Q4: How long is an Ed25519 signature?
An Ed25519 signature is exactly 64 bytes (512 bits) long, represented as a 128-character hexadecimal string. It is split into two 32-byte halves: the commitment point $R$ and the verification scalar $S$.

### Q5: Is Ed25519 signing faster than RSA signing?
Yes, dramatically. RSA signing requires modular exponentiation of very large integers (e.g., 3072 or 4096 bits), which is CPU-intensive. Ed25519 signing is performed on a much smaller 256-bit field and is optimized to run in constant time, making it thousands of times faster on standard hardware.

---

## About the Author

**Written by Zeeshan Tariq**

Software engineer focused on cryptography, authentication systems, and full-stack development. Zeeshan has designed secure authentication integrations for enterprise cloud systems and regularly audits cryptographic configurations.


---

## References
1. Bernstein, D. J., Duif, N., Lange, T., Schwab, P.-Y., & Yang, B.-Y. (2012). *High-speed high-security signatures*. Journal of Cryptographic Engineering, 2(2), 77-89. [https://ed25519.cr.yp.to/ed25519-20110926.pdf](https://ed25519.cr.yp.to/ed25519-20110926.pdf)
2. Josefsson, S., & Liusvaara, I. (2017). *Edwards-Curve Digital Signature Algorithm (EdDSA)*. RFC 8032. IETF. [https://tools.ietf.org/html/rfc8032](https://tools.ietf.org/html/rfc8032)
3. OpenSSH Project. (2014). *OpenSSH 6.5 Release Notes*. [https://www.openssh.com/txt/release-6.5](https://www.openssh.com/txt/release-6.5)
4. libsodium development team. (2020). *libsodium: A modern, easy-to-use software library for encryption, decryption, signatures, password hashing and more*. [https://doc.libsodium.org/](https://doc.libsodium.org/)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Signing and verifying messages with Ed25519: a walkthrough",
  "description": "A comprehensive developer guide detailing how to digitally sign and verify messages using the Ed25519 signature algorithm.",
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
      "name": "Can I use an Ed25519 signature to encrypt a message?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Ed25519 is designed strictly for digital signatures and does not support encryption. To encrypt data, you should use Curve25519 with X25519 key agreement."
      }
    },
    {
      "@type": "Question",
      "name": "Why is Ed25519 signing called 'deterministic'?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Unlike older schemes, Ed25519 derives the signature nonce from a hash of the message and private prefix, ensuring that the same message always produces the exact same signature."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if I change one letter of the message after signing it?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Changing any character alters the message digest. During verification, the mathematical check will fail, and the signature will be rejected as tampered."
      }
    },
    {
      "@type": "Question",
      "name": "How long is an Ed25519 signature?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An Ed25519 digital signature is always exactly 64 bytes (512 bits) long, consisting of a compressed commitment point R and a scalar S."
      }
    },
    {
      "@type": "Question",
      "name": "Is Ed25519 signing faster than RSA signing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Ed25519 signing is significantly faster because it operates on a small 256-bit prime field, avoiding RSA's slow prime factor mathematics."
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
      "name": "Signing and Verifying with Ed25519",
      "item": "https://ed25519.com/blog/signing-and-verifying-with-ed25519/"
    }
  ]
}
</script>
