import { KeyGeneration } from '../components/KeyGeneration'
import { MessageSigning } from '../components/MessageSigning'
import { SignatureVerification } from '../components/SignatureVerification'
import { Toaster } from 'react-hot-toast'

export function HomePage() {
	return (
		<>
			<div className="min-h-screen bg-gray-900 p-8">
				<div className="mx-auto max-w-6xl">
					{/* Terminal Header */}
					<div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-2xl">
						<div className="mb-4 flex items-center gap-2">
							<div className="h-3 w-3 rounded-full bg-red-500"></div>
							<div className="h-3 w-3 rounded-full bg-yellow-500"></div>
							<div className="h-3 w-3 rounded-full bg-green-500"></div>
							<span className="ml-4 font-mono text-sm text-gray-400">
								terminal@cryptolab:~/ed25519-utils$
							</span>
						</div>
						<h1 className="mb-2 font-mono text-4xl font-bold text-green-400">
							&gt; ED25519 CRYPTO SUITE
						</h1>
						<p className="font-mono text-green-300">
							[INFO] Elliptic Curve Digital Signature Algorithm |
							RFC 8032 Implementation
						</p>
						<div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
							<span className="rounded bg-gray-700 px-2 py-1 text-gray-500">
								EdDSA
							</span>
							<span className="rounded bg-gray-700 px-2 py-1 text-gray-500">
								CURVE25519
							</span>
							<span className="rounded bg-gray-700 px-2 py-1 text-gray-500">
								SHA-512
							</span>
							<span className="rounded bg-gray-700 px-2 py-1 text-gray-500">
								RFC 8032
							</span>
							<a
								href="https://blog.mozilla.org/warner/2011/11/29/ed25519-keys/"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 rounded bg-green-900/30 px-2 py-1 text-green-400 transition-colors hover:bg-green-900/50 hover:text-green-300"
							>
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
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
								Mozilla: "How do Ed25519 keys work?"
							</a>
						</div>
					</div>

					{/* Key Generation - Full Width */}
					<div className="mb-6">
						<KeyGeneration />
					</div>

					{/* Sign and Verify - Side by Side */}
					<div className="grid gap-6 lg:grid-cols-2">
						<MessageSigning />
						<SignatureVerification />
					</div>
				</div>
			</div>

			<Toaster
				position="top-right"
				toastOptions={{
					duration: 3000,
					style: {
						background: '#1f2937',
						color: '#d1d5db',
						border: '1px solid #374151',
						fontFamily:
							'ui-monospace, SFMono-Regular, "SF Mono", monospace',
						fontSize: '14px',
					},
					success: {
						iconTheme: {
							primary: '#10b981',
							secondary: '#1f2937',
						},
					},
					error: {
						iconTheme: {
							primary: '#ef4444',
							secondary: '#1f2937',
						},
					},
				}}
			/>
		</>
	)
}
