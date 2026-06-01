export type Theme = 'light' | 'dark'

const KEY = 'theme'

export function toggleTheme(): Theme {
	const next: Theme = document.documentElement.classList.contains('dark')
		? 'light'
		: 'dark'
	localStorage.setItem(KEY, next)
	document.documentElement.classList.toggle('dark', next === 'dark')
	return next
}
