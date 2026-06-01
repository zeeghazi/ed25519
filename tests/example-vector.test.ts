import { describe, it, expect } from 'vitest'
import { EXAMPLE } from '../src/lib/example-vector'
import { signMessage, verifySignature } from '../src/lib/ed25519'
import { getPublicKeyAsync } from '@noble/ed25519'
import { bytesToHex, hexToBytes } from '../src/lib/hex'

describe('EXAMPLE worked-example vector', () => {
	it('public key derives from the private seed', async () => {
		const pub = await getPublicKeyAsync(hexToBytes(EXAMPLE.privateKeyHex))
		expect(bytesToHex(pub)).toBe(EXAMPLE.publicKeyHex)
	})

	it('signing the message reproduces the signature (Ed25519 is deterministic)', async () => {
		const sig = await signMessage(EXAMPLE.message, EXAMPLE.privateKeyHex)
		expect(sig).toBe(EXAMPLE.signatureHex)
	})

	it('the signature verifies against the public key + message', async () => {
		const ok = await verifySignature(
			EXAMPLE.signatureHex,
			EXAMPLE.message,
			EXAMPLE.publicKeyHex
		)
		expect(ok).toBe(true)
	})

	it('a tampered message fails verification', async () => {
		const ok = await verifySignature(
			EXAMPLE.signatureHex,
			EXAMPLE.message + 'x',
			EXAMPLE.publicKeyHex
		)
		expect(ok).toBe(false)
	})
})
