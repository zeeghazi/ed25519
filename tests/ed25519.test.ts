import { describe, it, expect } from 'vitest'
import {
	generateKeypair,
	signMessage,
	verifySignature,
} from '../src/lib/ed25519'

describe('ed25519', () => {
	it('generates a 64-hex private key and 64-hex public key', async () => {
		const { privateKeyHex, publicKeyHex } = await generateKeypair()
		expect(privateKeyHex).toMatch(/^[0-9a-f]{64}$/)
		expect(publicKeyHex).toMatch(/^[0-9a-f]{64}$/)
		expect(privateKeyHex).not.toBe(publicKeyHex)
	})

	it('signs and verifies a round-trip', async () => {
		const { privateKeyHex, publicKeyHex } = await generateKeypair()
		const sig = await signMessage('hello noble', privateKeyHex)
		expect(sig).toMatch(/^[0-9a-f]{128}$/)
		expect(await verifySignature(sig, 'hello noble', publicKeyHex)).toBe(
			true
		)
	})

	it('fails verification when the message is altered', async () => {
		const { privateKeyHex, publicKeyHex } = await generateKeypair()
		const sig = await signMessage('original', privateKeyHex)
		expect(await verifySignature(sig, 'tampered', publicKeyHex)).toBe(false)
	})

	it('fails verification under a different public key', async () => {
		const a = await generateKeypair()
		const b = await generateKeypair()
		const sig = await signMessage('shared message', a.privateKeyHex)
		expect(
			await verifySignature(sig, 'shared message', b.publicKeyHex)
		).toBe(false)
	})

	it('rejects a private key that is not 64 hex chars', async () => {
		await expect(signMessage('x', 'deadbeef')).rejects.toThrow(/64 hex/)
	})

	it('rejects a public key that is not 64 hex chars', async () => {
		await expect(
			verifySignature('00'.repeat(64), 'x', 'abc')
		).rejects.toThrow(/64 hex/)
	})

	it('rejects a signature that is not 128 hex chars', async () => {
		const { publicKeyHex } = await generateKeypair()
		await expect(
			verifySignature('dead', 'x', publicKeyHex)
		).rejects.toThrow(/128 hex/)
	})
})
