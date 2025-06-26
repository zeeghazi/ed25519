import toast from 'react-hot-toast'
import { useState } from 'react'
import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'

// Set the SHA-512 function for ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m))

export function MessageSigning() {
	const [message, setMessage] = useState('')
	const [privateKey, setPrivateKey] = useState('')
	const [signature, setSignature] = useState('')
	const [signatureCopied, setSignatureCopied] = useState(false)
	const [isSigning, setIsSigning] = useState(false)

	const handleSignMessage = async () => {
		if (!message.trim()) {
			toast.error('Please enter a message to sign', { icon: '⚠️' })
			return
		}

		if (!privateKey.trim()) {
			toast.error('Please enter a private key', { icon: '⚠️' })
			return
		}

		setIsSigning(true)
		try {
			// Validate and parse private key (hex string)
			const privateKeyHex = privateKey.replace(/\s/g, '')
			if (privateKeyHex.length !== 64) {
				throw new Error(
					'Private key must be 64 hex characters (32 bytes)'
				)
			}

			// Convert hex string to Uint8Array
			const privateKeyBytes = new Uint8Array(
				privateKeyHex
					.match(/.{1,2}/g)
					?.map((byte) => parseInt(byte, 16)) || []
			)

			// Convert message to bytes
			const messageBytes = new TextEncoder().encode(message)

			// Sign the message
			const signatureBytes = await ed.sign(messageBytes, privateKeyBytes)

			// Convert signature to hex string
			const signatureHex = Array.from(signatureBytes, (byte) =>
				byte.toString(16).padStart(2, '0')
			).join('')

			setSignature(signatureHex)
			toast.success('Message signed with Ed25519!', {
				icon: '✍️',
			})
		} catch (error) {
			console.error('Signing error:', error)
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to sign message',
				{ icon: '⚠️' }
			)
		} finally {
			setIsSigning(false)
		}
	}

	const handleClear = () => {
		setMessage('')
		setPrivateKey('')
		setSignature('')
		setSignatureCopied(false)
		toast.success('Form cleared successfully!', {
			icon: '🗑️',
		})
	}

	const handleCopySignature = async () => {
		if (!signature) {
			toast.error('No signature to copy', { icon: '⚠️' })
			return
		}

		try {
			await navigator.clipboard.writeText(signature)
			setSignatureCopied(true)
			toast.success('Ed25519 signature copied to clipboard!', {
				icon: '📋',
			})
			setTimeout(() => setSignatureCopied(false), 2000)
		} catch (error) {
			console.error(error)
			toast.error('Failed to copy signature', { icon: '⚠️' })
		}
	}

	return (
		<div className="rounded-lg border border-emerald-700 bg-gray-800 p-6 shadow-2xl transition-all hover:border-emerald-500 hover:shadow-[-8px_-8px_25px_-5px_rgba(16,185,129,0.25)]">
			{/* Terminal Window Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-emerald-400"></div>
					<h2 className="font-mono text-lg font-bold text-emerald-400">
						[ED25519-SIGN]
					</h2>
				</div>
				<button
					onClick={handleClear}
					className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-emerald-400 transition-all hover:bg-emerald-900/30 hover:text-emerald-300"
					title="Clear form and signature"
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
				<p className="mb-2 font-mono text-sm text-emerald-300">
					$ ./sign --message "Hello World" --private-key hex
				</p>
				<p className="font-mono text-xs text-gray-400">
					Create EdDSA digital signature using Ed25519 private key
				</p>
			</div>

			{/* Input Section */}
			<div className="mb-6 space-y-4">
				{/* Message Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-emerald-400">
						MESSAGE TO SIGN
					</label>
					<div className="rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-emerald-500">
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className="w-full resize-none bg-transparent font-mono text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={4}
							placeholder="Enter any text message to create an Ed25519 digital signature..."
						/>
					</div>
				</div>

				{/* Private Key Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-emerald-400">
						PRIVATE KEY (SIGNING) [64 hex chars]
					</label>
					<div className="flex items-center justify-start rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-emerald-500">
						<input
							type="text"
							value={privateKey}
							onChange={(e) => setPrivateKey(e.target.value)}
							className="w-full bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							placeholder="Paste your Ed25519 private signing key (64 hex characters)..."
						/>
					</div>
				</div>
			</div>

			<button
				onClick={handleSignMessage}
				disabled={isSigning}
				className="mb-4 w-full cursor-pointer rounded border border-emerald-600 bg-emerald-900/50 px-4 py-3 font-mono text-emerald-300 transition-all hover:bg-emerald-800/50 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<span className="mr-2">&gt;</span>
				{isSigning
					? 'CREATING SIGNATURE...'
					: 'SIGN MESSAGE WITH ED25519'}
			</button>

			{/* Signature Output */}
			<div>
				<div className="mb-2 flex items-center justify-between">
					<label className="font-mono text-sm font-bold text-emerald-400">
						EDDSA SIGNATURE [128 hex chars]
					</label>
					<button
						onClick={handleCopySignature}
						className="flex cursor-pointer items-center gap-1 font-mono text-xs text-emerald-400 transition-all hover:text-emerald-300"
					>
						{signatureCopied ? (
							<>
								<span>Copied</span>
								<svg
									className="h-3 w-3"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</>
						) : (
							<>
								<span>Copy</span>
								<svg
									className="h-3 w-3"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</>
						)}
					</button>
				</div>
				<div className="rounded border border-gray-600 bg-gray-900 p-3">
					<div className="flex h-8 w-full resize-none items-start bg-transparent font-mono text-xs break-all text-gray-300 focus:outline-none">
						{signature ||
							'Digital signature will appear here after signing...'}
					</div>
				</div>
			</div>
		</div>
	)
}
