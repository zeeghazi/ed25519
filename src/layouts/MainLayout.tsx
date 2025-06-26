import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'react-hot-toast'

export function MainLayout() {
	return (
		<>
			<Outlet />
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 3000,
					style: {
						background: '#1f2937',
						color: '#d1d5db',
						border: '1px solid #374151',
						fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
						fontSize: '14px',
					},
					success: {
						iconTheme: {
							primary: '#10b981',
							secondary: '#1f2937',
						},
					},
					error: {
						iconTheme: {
							primary: '#ef4444',
							secondary: '#1f2937',
						},
					},
				}}
			/>
			<TanStackRouterDevtools />
		</>
	)
}
