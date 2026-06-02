/**
 * Build-time Open Graph image generation (1200×630).
 *
 * Runs in plain Node (via tsx) BEFORE `astro build`, not inside the Cloudflare
 * adapter's workerd prerender sandbox — canvaskit can't resolve file paths
 * there, which is why this is a standalone prebuild script rather than an
 * `OGImageRoute` endpoint.
 *
 * One image per non-draft blog post (filename === the keyword-rich slug) plus
 * the key landing pages. Output: public/og/<slug>.png and public/og/blog/<id>.png
 * (git-ignored; regenerated each build). Brand: dark canvas, terminal-green
 * accent bar, Geist type.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { generateOpenGraphImage } from 'astro-og-canvas'
import { SITE } from '../src/consts'

const root = process.cwd()
const BLOG_DIR = path.join(root, 'src/content/blog')
const OUT_DIR = path.join(root, 'public/og')

const imageOptions = (title: string, description: string) => ({
	title,
	description,
	logo: { path: './src/assets/og/wordmark.png', size: [240] as [number] },
	bgGradient: [
		[10, 10, 10],
		[22, 22, 24],
	] as [number, number, number][],
	border: {
		color: [45, 212, 168] as [number, number, number],
		width: 16,
		side: 'inline-start' as const,
	},
	padding: 70,
	font: {
		title: {
			color: [237, 237, 237] as [number, number, number],
			size: 62,
			weight: 'Bold' as const,
			lineHeight: 1.15,
			families: ['Geist'],
		},
		description: {
			color: [161, 161, 161] as [number, number, number],
			size: 28,
			lineHeight: 1.45,
			families: ['Geist'],
		},
	},
	fonts: ['./src/assets/og-fonts/Geist.ttf'],
	cacheDir: false as const,
})

async function toBuffer(result: BodyInit): Promise<Buffer> {
	return Buffer.from(await new Response(result).arrayBuffer())
}

async function write(slug: string, title: string, description: string) {
	const result = await generateOpenGraphImage(
		imageOptions(title, description)
	)
	const file = path.join(OUT_DIR, `${slug}.png`)
	await fs.mkdir(path.dirname(file), { recursive: true })
	await fs.writeFile(file, await toBuffer(result))
	console.log(`  og  /og/${slug}.png`)
}

const landingPages: Record<string, { title: string; description: string }> = {
	index: { title: SITE.title, description: SITE.description },
	'ed25519-ssh-key': {
		title: 'Ed25519 SSH keys',
		description:
			'Generate an Ed25519 SSH key with ssh-keygen and add it to GitHub or a server.',
	},
	'ed25519-key-generator': {
		title: 'Ed25519 key generator',
		description:
			'Generate a secure Ed25519 keypair in your browser. Keys never leave your device.',
	},
	'ed25519-sign-message': {
		title: 'Sign a message with Ed25519',
		description:
			'Sign any message with your Ed25519 private key, locally in your browser.',
	},
	'ed25519-verify-signature': {
		title: 'Verify an Ed25519 signature',
		description:
			'Check an Ed25519 signature against a public key, locally in your browser.',
	},
}

async function main() {
	await fs.mkdir(OUT_DIR, { recursive: true })

	// Clear previously generated images (keep the committed default.png) so that
	// renamed or removed pages never leave orphaned cards behind.
	await fs.rm(path.join(OUT_DIR, 'blog'), { recursive: true, force: true })
	for (const f of await fs.readdir(OUT_DIR)) {
		if (f.endsWith('.png') && f !== 'default.png') {
			await fs.rm(path.join(OUT_DIR, f), { force: true })
		}
	}

	const files = (await fs.readdir(BLOG_DIR)).filter((f) => /\.mdx?$/.test(f))
	for (const f of files) {
		const raw = await fs.readFile(path.join(BLOG_DIR, f), 'utf8')
		const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
		if (!m) continue
		const fm = parseYaml(m[1]) as {
			title: string
			description: string
			draft?: boolean
		}
		if (fm.draft) continue
		const id = f.replace(/\.mdx?$/, '')
		await write(`blog/${id}`, fm.title, fm.description)
	}

	for (const [slug, p] of Object.entries(landingPages)) {
		await write(slug, p.title, p.description)
	}
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
