import { KeyGenerationComponent } from '../components/KeyGenerationComponent'
import { MessageSigningComponent } from '../components/MessageSigningComponent'
import { SignatureVerificationComponent } from '../components/SignatureVerificationComponent'

export function HomePage() {
	return (
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
						[INFO] Elliptic Curve Digital Signature Algorithm | RFC 8032 Implementation
					</p>
					<div className="mt-4 flex items-center gap-2 font-mono text-xs text-gray-500">
						<span className="rounded bg-gray-700 px-2 py-1">SECURE</span>
						<span className="rounded bg-gray-700 px-2 py-1">256-BIT</span>
						<span className="rounded bg-gray-700 px-2 py-1">CURVE25519</span>
					</div>
				</div>

				{/* Key Generation - Full Width */}
				<div className="mb-6">
					<KeyGenerationComponent />
				</div>

				{/* Sign and Verify - Side by Side */}
				<div className="grid gap-6 lg:grid-cols-2">
					<MessageSigningComponent />
					<SignatureVerificationComponent />
				</div>
			</div>
		</div>
	)
}
