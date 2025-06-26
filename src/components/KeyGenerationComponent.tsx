import toast from 'react-hot-toast'
import { useState } from 'react'

export function KeyGenerationComponent() {
	const [publicCopied, setPublicCopied] = useState(false)
	const [privateCopied, setPrivateCopied] = useState(false)

	const handleGenerate = () => {
		toast.success('Ed25519 keypair generated successfully!', {
			icon: '🔐',
		})
	}

	const handleCopyPublic = () => {
		setPublicCopied(true)
		toast.success('Public key copied to clipboard!', {
			icon: '📋',
		})
		setTimeout(() => setPublicCopied(false), 2000)
	}

	const handleCopyPrivate = () => {
		setPrivateCopied(true)
		toast.success('Private key copied to clipboard!', {
			icon: '🔒',
		})
		setTimeout(() => setPrivateCopied(false), 2000)
	}

	return (
		<div className="rounded-lg border border-cyan-700 bg-gray-800 p-4 shadow-2xl transition-all hover:border-cyan-500 hover:shadow-cyan-500/20">
			{/* Horizontal Layout */}
			<div className="flex items-center gap-6">
				{/* Left: Generation Section */}
				<div className="flex-shrink-0">
					<div className="mb-3 flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-cyan-400"></div>
						<h2 className="font-mono text-lg font-bold text-cyan-400">
							[KEYGEN]
						</h2>
						<span className="font-mono text-xs text-gray-500">
							Ed25519
						</span>
					</div>
					
					<button 
						onClick={handleGenerate}
						className="cursor-pointer rounded border border-cyan-600 bg-cyan-900/50 px-6 py-3 font-mono text-sm text-cyan-300 transition-all hover:bg-cyan-800/50 hover:text-cyan-200"
					>
						<span className="mr-2">&gt;</span>
						GENERATE
					</button>
				</div>

				{/* Right: Keys Display - Horizontal */}
				<div className="grid flex-1 grid-cols-2 gap-4">
					{/* Public Key */}
					<div>
						<div className="mb-1 flex items-center justify-between">
							<label className="font-mono text-xs font-bold text-cyan-400">
								PUBLIC KEY
							</label>
							<button 
								onClick={handleCopyPublic}
								className="cursor-pointer flex items-center gap-1 font-mono text-xs text-cyan-400 transition-all hover:text-cyan-300"
							>
								{publicCopied ? (
									<>
										<span>Copied</span>
										<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</>
								) : (
									<>
										<span>Copy</span>
										<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
										</svg>
									</>
								)}
							</button>
						</div>
						<div className="rounded border border-gray-600 bg-gray-900 p-2">
							<textarea
								className="w-full resize-none bg-transparent font-mono text-xs text-gray-300 focus:outline-none"
								rows={1}
								placeholder="Generated public key..."
								readOnly
							/>
						</div>
					</div>

					{/* Private Key */}
					<div>
						<div className="mb-1 flex items-center justify-between">
							<label className="font-mono text-xs font-bold text-cyan-400">
								PRIVATE KEY
							</label>
							<button 
								onClick={handleCopyPrivate}
								className="cursor-pointer flex items-center gap-1 font-mono text-xs text-cyan-400 transition-all hover:text-cyan-300"
							>
								{privateCopied ? (
									<>
										<span>Copied</span>
										<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</>
								) : (
									<>
										<span>Copy</span>
										<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
										</svg>
									</>
								)}
							</button>
						</div>
						<div className="rounded border border-gray-600 bg-gray-900 p-2">
							<textarea
								className="w-full resize-none bg-transparent font-mono text-xs text-gray-300 focus:outline-none"
								rows={1}
								placeholder="Generated private key..."
								readOnly
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
