import type { APIContext } from 'astro'

export const prerender = false

interface ContactPayload {
	name?: string
	email?: string
	message?: string
	company?: string // honeypot
}

function json(body: Record<string, unknown>, status: number) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	})
}

async function readPayload(request: Request): Promise<ContactPayload> {
	const type = request.headers.get('content-type') ?? ''
	if (type.includes('application/json')) {
		return (await request.json()) as ContactPayload
	}
	const form = await request.formData()
	return Object.fromEntries(form) as ContactPayload
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export async function POST({ request }: APIContext) {
	let data: ContactPayload
	try {
		data = await readPayload(request)
	} catch {
		return json({ error: 'Invalid request.' }, 400)
	}

	// Honeypot: silently succeed so bots don't learn anything.
	if (data.company) return json({ ok: true }, 200)

	// Coerce defensively: form fields can arrive as File/array, not just string.
	const name = typeof data.name === 'string' ? data.name.trim() : ''
	const email = typeof data.email === 'string' ? data.email.trim() : ''
	const message = typeof data.message === 'string' ? data.message.trim() : ''

	if (!name || !email || !message)
		return json({ error: 'All fields are required.' }, 400)
	if (!isEmail(email))
		return json({ error: 'Please enter a valid email address.' }, 400)
	if (name.length > 200 || email.length > 254)
		return json({ error: 'Name or email is too long.' }, 400)
	if (message.length > 5000)
		return json({ error: 'Message is too long.' }, 400)

	// Astro v6 removed locals.runtime.env; bindings come from cloudflare:workers.
	// Dynamic import keeps Node-side build/check from statically resolving the module.
	// @ts-expect-error cloudflare runtime module
	const { env } = await import('cloudflare:workers')
	if (!env?.SEB || !env.CONTACT_TO_EMAIL) {
		return json(
			{ error: 'Contact is not configured. Email us directly.' },
			503
		)
	}

	try {
		// @ts-expect-error cloudflare runtime module
		const { EmailMessage } = await import('cloudflare:email')
		const { createMimeMessage, Mailbox } = await import('mimetext')

		const sender = 'noreply@ed25519.com'
		const msg = createMimeMessage()
		msg.setSender({ name: 'Ed25519.com contact', addr: sender })
		msg.setRecipient(env.CONTACT_TO_EMAIL)
		// Use a Mailbox (not a raw string): mimetext base64-encodes the display
		// name, which neutralizes CRLF header-injection via the name field.
		msg.setHeader('Reply-To', new Mailbox({ addr: email, name }))
		msg.setSubject(`Contact form: ${name}`)
		msg.addMessage({
			contentType: 'text/plain',
			data: `From: ${name} <${email}>\n\n${message}`,
		})

		const emailMessage = new EmailMessage(
			sender,
			env.CONTACT_TO_EMAIL,
			msg.asRaw()
		)
		await env.SEB.send(emailMessage)
		return json({ ok: true }, 200)
	} catch {
		return json(
			{ error: 'Could not send your message. Please email us directly.' },
			502
		)
	}
}
