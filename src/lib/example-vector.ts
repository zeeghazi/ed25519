// RFC 8032 §7.1 Ed25519 Test 2 — a public, reproducible test vector.
// The message byte is 0x72 (ASCII 'r'); because the tool UTF-8-encodes the
// message, signing the text 'r' in the live tool reproduces this signature.
// tests/example-vector.test.ts proves these values derive/sign/verify.
export const EXAMPLE = {
	privateKeyHex:
		'4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
	publicKeyHex:
		'3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c',
	message: 'r',
	signatureHex:
		'92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00',
} as const
