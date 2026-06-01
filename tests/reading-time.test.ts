import { describe, it, expect } from 'vitest'
import { readingTime } from '../src/lib/reading-time'

describe('readingTime', () => {
	it('returns at least 1 min for short text', () => {
		expect(readingTime('hello world')).toBe('1 min read')
	})

	it('rounds up to whole minutes at ~200 wpm', () => {
		const words = Array.from({ length: 450 }, () => 'word').join(' ')
		expect(readingTime(words)).toBe('3 min read')
	})

	it('ignores markdown punctuation when counting words', () => {
		expect(readingTime('# Title\n\nOne, two; three.')).toBe('1 min read')
	})
})
