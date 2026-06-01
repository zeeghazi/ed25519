import * as ed from '@noble/ed25519'
import { bytesToHex, hexToBytes, isHex } from './hex'

const KEY_HEX_LEN = 64 // 32 bytes
const SIG_HEX_LEN = 128 // 64 bytes

export interface Keypair {
	privateKeyHex: string
	publicKeyHex: string
}

export async function generateKeypair(): Promise<Keypair> {
	const secret = ed.utils.randomSecretKey()
	const publicKey = await ed.getPublicKeyAsync(secret)
	return {
		privateKeyHex: bytesToHex(secret),
		publicKeyHex: bytesToHex(publicKey),
	}
}

export async function signMessage(
	message: string,
	privateKeyHex: string
): Promise<string> {
	if (!isHex(privateKeyHex, KEY_HEX_LEN)) {
		throw new Error('Private key must be 64 hex characters (32 bytes)')
	}
	const secret = hexToBytes(privateKeyHex)
	const msg = new TextEncoder().encode(message)
	const sig = await ed.signAsync(msg, secret)
	return bytesToHex(sig)
}

export async function verifySignature(
	signatureHex: string,
	message: string,
	publicKeyHex: string
): Promise<boolean> {
	if (!isHex(publicKeyHex, KEY_HEX_LEN)) {
		throw new Error('Public key must be 64 hex characters (32 bytes)')
	}
	if (!isHex(signatureHex, SIG_HEX_LEN)) {
		throw new Error('Signature must be 128 hex characters (64 bytes)')
	}
	const sig = hexToBytes(signatureHex)
	const pub = hexToBytes(publicKeyHex)
	const msg = new TextEncoder().encode(message)
	try {
		return await ed.verifyAsync(sig, msg, pub)
	} catch {
		return false // malformed-but-correct-length input → invalid, not an exception
	}
}
