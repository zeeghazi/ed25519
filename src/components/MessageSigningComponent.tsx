import toast from 'react-hot-toast'
import { useState } from 'react'

export function MessageSigningComponent() {
	const [signatureCopied, setSignatureCopied] = useState(false)

	const handleSignMessage = () => {
		toast.success('Message signed successfully!', {
			icon: '✍️',
		})
	}

	const handleCopySignature = () => {
		setSignatureCopied(true)
		toast.success('Signature copied to clipboard!', {
			icon: '📋',
		})
		setTimeout(() => setSignatureCopied(false), 2000)
	}

	return (
		<div className="rounded-lg border border-emerald-700 bg-gray-800 p-6 shadow-2xl transition-all hover:border-emerald-500 hover:shadow-emerald-500/20">
			{/* Terminal Window Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-emerald-400"></div>
					<h2 className="font-mono text-lg font-bold text-emerald-400">
						[SIGN]
					</h2>
				</div>
				<span className="font-mono text-xs text-gray-500">SHA-512</span>
			</div>
			
			{/* Terminal Content */}
			<div className="mb-6 rounded bg-gray-900 p-4">
				<p className="mb-2 font-mono text-sm text-emerald-300">
					$ ./sign --message "data.txt" --key private.pem
				</p>
				<p className="font-mono text-xs text-gray-400">
					Create digital signature using Ed25519 private key
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
							className="w-full resize-none bg-transparent font-mono text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={4}
							placeholder="Enter your message to sign..."
						/>
					</div>
				</div>

				{/* Private Key Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-emerald-400">
						PRIVATE KEY [32 bytes]
					</label>
					<div className="rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-emerald-500">
						<textarea
							className="w-full resize-none bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={3}
							placeholder="Paste your Ed25519 private key here..."
						/>
					</div>
				</div>
			</div>

			<button 
				onClick={handleSignMessage}
				className="cursor-pointer mb-4 w-full rounded border border-emerald-600 bg-emerald-900/50 px-4 py-3 font-mono text-emerald-300 transition-all hover:bg-emerald-800/50 hover:text-emerald-200"
			>
				<span className="mr-2">&gt;</span>
				SIGN MESSAGE
			</button>

			{/* Signature Output */}
			<div>
				<div className="mb-2 flex items-center justify-between">
					<label className="font-mono text-sm font-bold text-emerald-400">
						SIGNATURE OUTPUT [64 bytes]
					</label>
					<button 
						onClick={handleCopySignature}
						className="cursor-pointer flex items-center gap-1 font-mono text-xs text-emerald-400 transition-all hover:text-emerald-300"
					>
						{signatureCopied ? (
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
				<div className="rounded border border-gray-600 bg-gray-900 p-3">
					<textarea
						className="w-full resize-none bg-transparent font-mono text-xs text-gray-300 focus:outline-none"
						rows={3}
						placeholder="Digital signature will appear here after signing..."
						readOnly
					/>
				</div>
			</div>
		</div>
	)
}