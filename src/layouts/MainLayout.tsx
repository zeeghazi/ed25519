import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export function MainLayout() {
	return (
		<>
			<Outlet />
			<TanStackRouterDevtools />
		</>
	)
}
