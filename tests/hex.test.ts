import { describe, it, expect } from 'vitest'
import { bytesToHex, hexToBytes, isHex } from '../src/lib/hex'

describe('hex', () => {
	it('bytesToHex encodes bytes as lowercase hex', () => {
		expect(bytesToHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe(
			'00010f10ff'
		)
	})

	it('hexToBytes decodes hex into bytes', () => {
		expect(Array.from(hexToBytes('00010f10ff'))).toEqual([
			0, 1, 15, 16, 255,
		])
	})

	it('round-trips', () => {
		const bytes = new Uint8Array([42, 7, 200, 99, 1])
		expect(Array.from(hexToBytes(bytesToHex(bytes)))).toEqual(
			Array.from(bytes)
		)
	})

	it('hexToBytes strips whitespace', () => {
		expect(Array.from(hexToBytes(' 00 ff '))).toEqual([0, 255])
	})

	it('hexToBytes rejects odd-length input', () => {
		expect(() => hexToBytes('abc')).toThrow()
	})

	it('hexToBytes rejects non-hex characters', () => {
		expect(() => hexToBytes('zz')).toThrow()
	})

	it('isHex validates length and charset', () => {
		expect(isHex('00ff', 4)).toBe(true)
		expect(isHex('00ff', 6)).toBe(false)
		expect(isHex('zzzz', 4)).toBe(false)
	})
})
