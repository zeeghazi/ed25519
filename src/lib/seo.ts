import { SITE } from '../consts'

export interface SeoInput {
	title?: string
	description?: string
	path?: string // e.g. '/faq'
	ogImage?: string
	noindex?: boolean
}

export interface ResolvedSeo {
	title: string
	description: string
	canonical: string
	ogImage: string
	noindex: boolean
}

// The site serves trailing-slash URLs (Astro redirects no-slash → slash), so the
// canonical must match — otherwise it points at a 307 redirect. Normalize here so every
// caller's path gets a trailing slash (root stays '/').
function withTrailingSlash(path: string): string {
	if (path === '/' || path.endsWith('/')) return path
	return `${path}/`
}

export function resolveSeo(input: SeoInput = {}): ResolvedSeo {
	const path = withTrailingSlash(input.path ?? '/')
	return {
		title: input.title ? `${input.title} — ${SITE.name}` : SITE.title,
		description: input.description ?? SITE.description,
		canonical: new URL(path, SITE.url).href,
		ogImage: new URL(input.ogImage ?? '/og/default.png', SITE.url).href,
		noindex: input.noindex ?? false,
	}
}

export function webApplicationJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: SITE.name,
		url: SITE.url,
		applicationCategory: 'SecurityApplication',
		operatingSystem: 'Web Browser',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		description: SITE.description,
	}
}

export function websiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE.name,
		url: SITE.url,
	}
}

export function articleJsonLd(opts: {
	title: string
	description: string
	path: string
	pubDate: Date
	updatedDate?: Date
	author?: string
	ogImage?: string
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: opts.title,
		description: opts.description,
		url: new URL(withTrailingSlash(opts.path), SITE.url).href,
		mainEntityOfPage: new URL(withTrailingSlash(opts.path), SITE.url).href,
		datePublished: opts.pubDate.toISOString(),
		dateModified: (opts.updatedDate ?? opts.pubDate).toISOString(),
		author: { '@type': 'Person', name: opts.author ?? SITE.author },
		publisher: { '@type': 'Organization', name: SITE.name },
		image: new URL(opts.ogImage ?? '/og/default.png', SITE.url).href,
	}
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			item: new URL(withTrailingSlash(item.path), SITE.url).href,
		})),
	}
}

export function faqPageJsonLd(faqs: { q: string; a: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a },
		})),
	}
}

export function howToJsonLd(opts: {
	name: string
	description: string
	steps: { name: string; text: string }[]
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: opts.name,
		description: opts.description,
		step: opts.steps.map((s, i) => ({
			'@type': 'HowToStep',
			position: i + 1,
			name: s.name,
			text: s.text,
		})),
	}
}
