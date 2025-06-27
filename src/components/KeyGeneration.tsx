import toast from 'react-hot-toast'
import { useState } from 'react'
import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'

// Set the SHA-512 function for ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m))

export function KeyGeneration() {
	const [publicKey, setPublicKey] = useState('')
	const [privateKey, setPrivateKey] = useState('')
	const [publicCopied, setPublicCopied] = useState(false)
	const [privateCopied, setPrivateCopied] = useState(false)
	const [isGenerating, setIsGenerating] = useState(false)

	const handleGenerate = async () => {
		setIsGenerating(true)
		try {
			// Generate random private key (32 bytes)
			const privKey = ed.utils.randomPrivateKey()

			// Derive public key from private key
			const pubKey = await ed.getPublicKey(privKey)

			// Convert to hex strings for display
			const privateKeyHex = Array.from(privKey, (byte) =>
				byte.toString(16).padStart(2, '0')
			).join('')
			const publicKeyHex = Array.from(pubKey, (byte) =>
				byte.toString(16).padStart(2, '0')
			).join('')

			setPrivateKey(privateKeyHex)
			setPublicKey(publicKeyHex)

			toast.success('Ed25519 keypair generated successfully!', {
				icon: '🔑',
			})
		} catch (error) {
			toast.error('Failed to generate keypair', {
				icon: '⚠️',
			})
			console.error('Key generation error:', error)
		} finally {
			setIsGenerating(false)
		}
	}

	const handleCopyPublic = async () => {
		if (!publicKey) {
			toast.error('No public key to copy', { icon: '⚠️' })
			return
		}

		try {
			await navigator.clipboard.writeText(publicKey)
			setPublicCopied(true)
			toast.success('Ed25519 public key copied to clipboard!', {
				icon: '📋',
			})
			setTimeout(() => setPublicCopied(false), 2000)
		} catch (error) {
			console.error(error)
			toast.error('Failed to copy public key', { icon: '⚠️' })
		}
	}

	const handleCopyPrivate = async () => {
		if (!privateKey) {
			toast.error('No private key to copy', { icon: '⚠️' })
			return
		}

		try {
			await navigator.clipboard.writeText(privateKey)
			setPrivateCopied(true)
			toast.success('Ed25519 private key copied to clipboard!', {
				icon: '🔐',
			})
			setTimeout(() => setPrivateCopied(false), 2000)
		} catch (error) {
			console.error(error)
			toast.error('Failed to copy private key', { icon: '⚠️' })
		}
	}

	return (
		<div className="rounded-lg border border-cyan-700 bg-gray-800 p-6 shadow-2xl transition-all hover:border-cyan-500 hover:shadow-[0_-8px_25px_-5px_rgba(34,211,238,0.25)]">
			{/* Two Column Layout */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left: Command Section */}
				<div className="space-y-4">
					{/* KEYGEN Header */}
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-cyan-400"></div>
						<h2 className="font-mono text-lg font-bold text-cyan-400">
							[ED25519-KEYGEN]
						</h2>
					</div>
					{/* Terminal Content */}
					<div className="rounded bg-gray-900 p-4">
						<p className="mb-2 font-mono text-sm text-cyan-300">
							$ ./keygen --curve edwards25519 --format hex
						</p>
						<p className="font-mono text-xs text-gray-400">
							Generate cryptographically secure Ed25519 keypair
							using Curve25519
						</p>
					</div>

					{/* Generate Button */}
					<button
						onClick={handleGenerate}
						disabled={isGenerating}
						className="w-full cursor-pointer rounded border border-cyan-600 bg-cyan-900/50 px-4 py-3 font-mono text-cyan-300 transition-all hover:bg-cyan-800/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span className="mr-2">&gt;</span>
						{isGenerating
							? 'GENERATING KEYPAIR...'
							: 'GENERATE ED25519 KEYPAIR'}
					</button>
				</div>

				{/* Right: Keys Display Column */}
				<div className="flex flex-col gap-4">
					{/* Public Key */}
					<div className="flex flex-grow flex-col gap-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-cyan-400"></div>
								<label className="font-mono text-sm font-bold text-cyan-400">
									PUBLIC KEY (VERIFY)
								</label>
								<span className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-xs text-gray-400">
									{publicKey
										? `${publicKey.length} hex chars`
										: '64 hex chars'}
								</span>
							</div>
							<button
								onClick={handleCopyPublic}
								className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-cyan-400 transition-all hover:bg-cyan-900/30 hover:text-cyan-300"
							>
								{publicCopied ? (
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
						<div className="flex flex-grow items-center justify-start rounded border border-gray-600 bg-gray-900 p-3">
							<input
								type="text"
								value={publicKey || ''}
								placeholder="Ed25519 public key (64 hex characters) will appear here after generation..."
								readOnly
								className="w-full bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							/>
						</div>
					</div>

					{/* Private Key */}
					<div className="flex flex-grow flex-col gap-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-cyan-400"></div>
								<label className="font-mono text-sm font-bold text-cyan-400">
									PRIVATE KEY (SIGN)
								</label>
								<span className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-xs text-gray-400">
									{privateKey
										? `${privateKey.length} hex chars`
										: '64 hex chars'}
								</span>
								<span className="rounded bg-cyan-900/30 px-1.5 py-0.5 font-mono text-xs text-cyan-400">
									SECRET
								</span>
							</div>
							<button
								onClick={handleCopyPrivate}
								className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-cyan-400 transition-all hover:bg-cyan-900/30 hover:text-cyan-300"
							>
								{privateCopied ? (
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
						<div className="flex flex-grow items-center justify-start rounded border border-gray-600 bg-gray-900 p-3">
							<input
								type="text"
								value={privateKey || ''}
								placeholder="Ed25519 private key (64 hex characters) will appear here after generation..."
								readOnly
								className="w-full bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
