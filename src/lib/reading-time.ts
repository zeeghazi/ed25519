const WPM = 200

export function readingTime(content: string): string {
	const words = content.trim().split(/\s+/).filter(Boolean).length
	const minutes = Math.max(1, Math.ceil(words / WPM))
	return `${minutes} min read`
}
