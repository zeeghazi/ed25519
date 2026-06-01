export function bytesToHex(bytes: Uint8Array): string {
	let hex = ''
	for (const b of bytes) hex += b.toString(16).padStart(2, '0')
	return hex
}

export function hexToBytes(hex: string): Uint8Array {
	const clean = hex.replace(/\s/g, '')
	if (clean.length % 2 !== 0) {
		throw new Error('Hex string must have an even number of characters')
	}
	if (!/^[0-9a-fA-F]*$/.test(clean)) {
		throw new Error('Hex string contains non-hex characters')
	}
	const out = new Uint8Array(clean.length / 2)
	for (let i = 0; i < out.length; i++) {
		out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
	}
	return out
}

export function isHex(value: string, expectedLength?: number): boolean {
	const clean = value.replace(/\s/g, '')
	if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) return false
	if (expectedLength !== undefined && clean.length !== expectedLength)
		return false
	return true
}
