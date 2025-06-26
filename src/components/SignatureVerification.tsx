import toast from 'react-hot-toast'
import { useState } from 'react'
import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'

// Set the SHA-512 function for ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m))

export function SignatureVerification() {
	const [message, setMessage] = useState('')
	const [publicKey, setPublicKey] = useState('')
	const [signature, setSignature] = useState('')
	const [verificationStatus, setVerificationStatus] = useState('')
	const [isVerifying, setIsVerifying] = useState(false)

	const handleClear = () => {
		setMessage('')
		setPublicKey('')
		setSignature('')
		setVerificationStatus('')
		toast.success('Form cleared successfully!', {
			icon: '🗑️',
		})
	}

	const handleVerifySignature = async () => {
		if (!message.trim()) {
			toast.error('Please enter the original message', { icon: '⚠️' })
			return
		}

		if (!publicKey.trim()) {
			toast.error('Please enter a public key', { icon: '⚠️' })
			return
		}

		if (!signature.trim()) {
			toast.error('Please enter a signature', { icon: '⚠️' })
			return
		}

		setIsVerifying(true)
		try {
			// Validate and parse public key (hex string)
			const publicKeyHex = publicKey.replace(/\s/g, '')
			if (publicKeyHex.length !== 64) {
				throw new Error(
					'Public key must be 64 hex characters (32 bytes)'
				)
			}

			// Validate and parse signature (hex string)
			const signatureHex = signature.replace(/\s/g, '')
			if (signatureHex.length !== 128) {
				throw new Error(
					'Signature must be 128 hex characters (64 bytes)'
				)
			}

			// Convert hex strings to Uint8Array
			const publicKeyBytes = new Uint8Array(
				publicKeyHex
					.match(/.{1,2}/g)
					?.map((byte) => parseInt(byte, 16)) || []
			)
			const signatureBytes = new Uint8Array(
				signatureHex
					.match(/.{1,2}/g)
					?.map((byte) => parseInt(byte, 16)) || []
			)

			// Convert message to bytes
			const messageBytes = new TextEncoder().encode(message)

			// Verify the signature
			const isValid = await ed.verify(
				signatureBytes,
				messageBytes,
				publicKeyBytes
			)

			if (isValid) {
				setVerificationStatus('VALID ✅')
				toast.success('Ed25519 signature is VALID! ✅', {
					icon: '🔐',
				})
			} else {
				setVerificationStatus('INVALID ❌')
				toast.error('Ed25519 signature is INVALID! ❌', {
					icon: '⚠️',
				})
			}
		} catch (error) {
			console.error('Verification error:', error)
			setVerificationStatus('ERROR ❌')
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to verify signature',
				{ icon: '⚠️' }
			)
		} finally {
			setIsVerifying(false)
		}
	}

	return (
		<div className="rounded-lg border border-violet-700 bg-gray-800 p-6 shadow-2xl transition-all hover:border-violet-500 hover:shadow-[8px_-8px_25px_-5px_rgba(139,92,246,0.25)]">
			{/* Terminal Window Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-violet-400"></div>
					<h2 className="font-mono text-lg font-bold text-violet-400">
						[ED25519-VERIFY]
					</h2>
				</div>
				<button
					onClick={handleClear}
					className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-violet-400 transition-all hover:bg-violet-900/30 hover:text-violet-300"
					title="Clear form and verification status"
				>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					<span>Clear</span>
				</button>
			</div>

			{/* Terminal Content */}
			<div className="mb-6 rounded bg-gray-900 p-4">
				<p className="mb-2 font-mono text-sm text-violet-300">
					$ ./verify --signature hex --public-key hex --message text
				</p>
				<p className="font-mono text-xs text-gray-400">
					Validate Ed25519 signature authenticity and message
					integrity
				</p>
			</div>

			{/* Input Section */}
			<div className="mb-6 space-y-4">
				{/* Original Message Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-violet-400">
						ORIGINAL MESSAGE
					</label>
					<div className="rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-violet-500">
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className="w-full resize-none bg-transparent font-mono text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={4}
							placeholder="Enter the exact original message that was signed with Ed25519..."
						/>
					</div>
				</div>

				{/* Public Key Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-violet-400">
						PUBLIC KEY (VERIFY) [64 hex chars]
					</label>
					<div className="flex items-center justify-start rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-violet-500">
						<input
							type="text"
							value={publicKey}
							onChange={(e) => setPublicKey(e.target.value)}
							className="w-full bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							placeholder="Paste the Ed25519 public verification key (64 hex characters)..."
						/>
					</div>
				</div>

				{/* Signature Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-violet-400">
						EDDSA SIGNATURE [128 hex chars]
					</label>
					<div className="flex items-center justify-center rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-violet-500">
						<textarea
							value={signature}
							onChange={(e) => setSignature(e.target.value)}
							className="w-full resize-none bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={2}
							placeholder="Paste the Ed25519 signature to verify (128 hex characters)..."
						/>
					</div>
				</div>
			</div>

			<button
				onClick={handleVerifySignature}
				disabled={isVerifying}
				className="mb-4 w-full cursor-pointer rounded border border-violet-600 bg-violet-900/50 px-4 py-3 font-mono text-violet-300 transition-all hover:bg-violet-800/50 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<span className="mr-2">&gt;</span>
				{isVerifying
					? 'VERIFYING SIGNATURE...'
					: 'VERIFY ED25519 SIGNATURE'}
			</button>

			{/* Verification Result */}
			<div className="rounded border border-gray-600 bg-gray-900 p-4">
				<div className="flex items-center justify-between">
					<span className="font-mono text-sm font-bold text-violet-400">
						VERIFICATION STATUS:
					</span>
					<div className="rounded bg-gray-800 px-3 py-1">
						<span className="font-mono text-xs text-gray-400">
							{verificationStatus ||
								'Click to verify Ed25519 signature...'}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}
