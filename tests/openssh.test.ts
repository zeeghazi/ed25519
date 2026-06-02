import { describe, it, expect } from 'vitest'
import { publicKeyToOpenSSH } from '../src/lib/openssh'
import { hexToBytes } from '../src/lib/hex'
import { EXAMPLE } from '../src/lib/example-vector'

describe('publicKeyToOpenSSH', () => {
	// Golden value computed independently (Node Buffer) from the RFC 8032 Test 2
	// public key, cross-checking the wire-format framing + base64.
	const GOLDEN =
		'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID1AF8PoQ4lakrcKp00bfrycmCzPLsSWjMDNVfEq9GYM'

	it('encodes a 32-byte public key to OpenSSH format', () => {
		const pub = hexToBytes(EXAMPLE.publicKeyHex)
		expect(publicKeyToOpenSSH(pub)).toBe(GOLDEN)
	})

	it('always starts with the standard ed25519 prefix', () => {
		const pub = hexToBytes(EXAMPLE.publicKeyHex)
		expect(publicKeyToOpenSSH(pub)).toMatch(
			/^ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI[\w+/]+={0,2}$/
		)
	})

	it('appends a comment when provided', () => {
		const pub = hexToBytes(EXAMPLE.publicKeyHex)
		expect(publicKeyToOpenSSH(pub, 'me@example.com')).toBe(
			`${GOLDEN} me@example.com`
		)
	})

	it('rejects keys that are not 32 bytes', () => {
		expect(() => publicKeyToOpenSSH(new Uint8Array(31))).toThrow()
		expect(() => publicKeyToOpenSSH(new Uint8Array(33))).toThrow()
	})
})
