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

export function resolveSeo(input: SeoInput = {}): ResolvedSeo {
	const path = input.path ?? '/'
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
