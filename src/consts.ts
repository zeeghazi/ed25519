export const SITE = {
	name: 'Ed25519.com',
	title: 'Ed25519 Crypto Suite — Generate, Sign & Verify',
	description:
		'Free, in-browser Ed25519 tools: generate keypairs, sign messages, and verify signatures. RFC 8032 EdDSA. Keys never leave your device.',
	url: 'https://ed25519.com',
	locale: 'en_US',
	author: 'Ed25519.com',
	email: 'hello@ed25519.com', // PLACEHOLDER — replace before launch
	twitter: '@ed25519', // PLACEHOLDER
} as const

export const NAV_LINKS = [
	{ label: 'Tool', href: '/#tool' },
	{ label: 'Blog', href: '/blog' },
	{ label: 'FAQ', href: '/faq' },
	{ label: 'About', href: '/about' },
] as const

export const SOCIAL_LINKS = [
	{ label: 'GitHub', href: 'https://github.com/' }, // PLACEHOLDER
] as const

export const FOOTER_SECTIONS = [
	{
		title: 'Tools',
		links: [
			{ label: 'Generate keys', href: '/#keygen' },
			{ label: 'Sign message', href: '/#sign' },
			{ label: 'Verify signature', href: '/#verify' },
		],
	},
	{
		title: 'Learn',
		links: [
			{ label: 'Blog', href: '/blog' },
			{ label: 'FAQ', href: '/faq' },
			{ label: 'About', href: '/about' },
		],
	},
	{
		title: 'Legal',
		links: [
			{ label: 'Privacy', href: '/privacy' },
			{ label: 'Terms', href: '/terms' },
			{ label: 'Contact', href: '/contact' },
		],
	},
] as const
