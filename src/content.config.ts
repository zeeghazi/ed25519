import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string().max(70),
		description: z.string().min(50).max(170),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).default([]),
		author: z.string().default('Ed25519.com'),
		ogImage: z.string().optional(),
		draft: z.boolean().default(false),
	}),
})

export const collections = { blog }
