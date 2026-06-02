// Convert a raw 32-byte Ed25519 public key into OpenSSH authorized_keys format:
//   ssh-ed25519 <base64> [comment]
// The base64 payload is the SSH wire encoding of the key blob:
//   string("ssh-ed25519") || string(publicKey)
// where each `string` is a 4-byte big-endian length prefix followed by the bytes
// (RFC 4253 §6.6 / RFC 8709). This is a pure encoding of the PUBLIC key only —
// it never touches private key material.

const KEY_TYPE = 'ssh-ed25519'

function sshString(bytes: Uint8Array): Uint8Array {
	const out = new Uint8Array(4 + bytes.length)
	const len = bytes.length
	out[0] = (len >>> 24) & 0xff
	out[1] = (len >>> 16) & 0xff
	out[2] = (len >>> 8) & 0xff
	out[3] = len & 0xff
	out.set(bytes, 4)
	return out
}

function base64(bytes: Uint8Array): string {
	let bin = ''
	for (const b of bytes) bin += String.fromCharCode(b)
	return btoa(bin)
}

export function publicKeyToOpenSSH(
	publicKey: Uint8Array,
	comment = ''
): string {
	if (publicKey.length !== 32) {
		throw new Error('Ed25519 public key must be 32 bytes')
	}
	const typeField = sshString(new TextEncoder().encode(KEY_TYPE))
	const keyField = sshString(publicKey)
	const blob = new Uint8Array(typeField.length + keyField.length)
	blob.set(typeField, 0)
	blob.set(keyField, typeField.length)

	const line = `${KEY_TYPE} ${base64(blob)}`
	return comment ? `${line} ${comment}` : line
}
