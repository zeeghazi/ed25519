import toast from 'react-hot-toast'

export function SignatureVerificationComponent() {
	const handleVerifySignature = () => {
		// Simulate verification result (random for demo)
		const isValid = Math.random() > 0.3
		
		if (isValid) {
			toast.success('Signature is VALID! ✅', {
				icon: '🔐',
			})
		} else {
			toast.error('Signature is INVALID! ❌', {
				icon: '⚠️',
			})
		}
	}

	return (
		<div className="rounded-lg border border-violet-700 bg-gray-800 p-6 shadow-2xl transition-all hover:border-violet-500 hover:shadow-violet-500/20">
			{/* Terminal Window Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-violet-400"></div>
					<h2 className="font-mono text-lg font-bold text-violet-400">
						[VERIFY]
					</h2>
				</div>
				<span className="font-mono text-xs text-gray-500">AUTH</span>
			</div>
			
			{/* Terminal Content */}
			<div className="mb-6 rounded bg-gray-900 p-4">
				<p className="mb-2 font-mono text-sm text-violet-300">
					$ ./verify --sig signature.bin --pub public.pem
				</p>
				<p className="font-mono text-xs text-gray-400">
					Validate signature authenticity and message integrity
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
							className="w-full resize-none bg-transparent font-mono text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={4}
							placeholder="Enter the original message that was signed..."
						/>
					</div>
				</div>

				{/* Public Key Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-violet-400">
						PUBLIC KEY [32 bytes]
					</label>
					<div className="rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-violet-500">
						<textarea
							className="w-full resize-none bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={3}
							placeholder="Paste the Ed25519 public key here..."
						/>
					</div>
				</div>

				{/* Signature Input */}
				<div>
					<label className="mb-2 block font-mono text-sm font-bold text-violet-400">
						SIGNATURE [64 bytes]
					</label>
					<div className="rounded border border-gray-600 bg-gray-900 p-3 transition-all focus-within:border-violet-500">
						<textarea
							className="w-full resize-none bg-transparent font-mono text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
							rows={3}
							placeholder="Paste the signature to verify here..."
						/>
					</div>
				</div>
			</div>

			<button 
				onClick={handleVerifySignature}
				className="cursor-pointer mb-4 w-full rounded border border-violet-600 bg-violet-900/50 px-4 py-3 font-mono text-violet-300 transition-all hover:bg-violet-800/50 hover:text-violet-200"
			>
				<span className="mr-2">&gt;</span>
				VERIFY SIGNATURE
			</button>

			{/* Verification Result */}
			<div className="rounded border border-gray-600 bg-gray-900 p-4">
				<div className="flex items-center justify-between">
					<span className="font-mono text-sm font-bold text-violet-400">
						VERIFICATION STATUS:
					</span>
					<div className="rounded bg-gray-800 px-3 py-1">
						<span className="font-mono text-xs text-gray-400">
							Click verify to check signature...
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}