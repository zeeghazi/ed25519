export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}

export function toast(
	message: string,
	type: 'success' | 'error' = 'success'
): void {
	window.dispatchEvent(
		new CustomEvent('toast', { detail: { message, type } })
	)
}
