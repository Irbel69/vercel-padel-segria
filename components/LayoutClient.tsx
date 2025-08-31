"use client";

import { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = (): null => {
	const pathname = usePathname();

	const supabase = createClient();
	const [data, setData] = useState<{ user: User }>(null);

	// This is used to get the user data from Supabase Auth (if logged in) => user ID is used to identify users in Crisp
	useEffect(() => {
		const getUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				setData({ user });
			}
		};
		getUser();
	}, []);

	useEffect(() => {
		// Only load Crisp on allowed routes to respect CSP and avoid loading 3P scripts everywhere.
		if (!config?.crisp?.id) return;

		const { onlyShowOnRoutes } = config.crisp;
		const routeAllowed = !onlyShowOnRoutes || onlyShowOnRoutes.length === 0 || onlyShowOnRoutes.includes(pathname);
		if (!routeAllowed) return; // don't configure Crisp on this route

		Crisp.configure(config.crisp.id);
	}, [pathname]);

	// Add User Unique ID to Crisp to easily identify users when reaching support (optional)
	useEffect(() => {
		if (data?.user && config?.crisp?.id) {
			Crisp.session.setData({ userId: data.user?.id });
		}
	}, [data]);

	return null;
};

// All the client wrappers are here (they can't be in server components)
// 1. NextTopLoader: Show a progress bar at the top when navigating between pages
// 2. Toaster: Show Success/Error messages anywhere from the app with toast()
// 3. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 4. CrispChat: Set Crisp customer chat support (see above)
const ClientLayout = ({
	children,
	nonce,
}: {
	children: ReactNode;
	nonce?: string;
}) => {
	const [queryClient] = useState(() => new QueryClient());
	return (
		<QueryClientProvider client={queryClient}>
			{/* Show a progress bar at the top when navigating between pages */}
			<NextTopLoader color={config.colors.main} showSpinner={false} />

			{/* Content inside app/page.js files  */}
			{children}

			{/* Show Success/Error messages anywhere from the app with toast() */}
			<Toaster
				toastOptions={{
					duration: 5000,
				}}
			/>

			{/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
			<Tooltip
				id="tooltip"
				className="z-[60] !opacity-100 max-w-sm shadow-lg"
			/>

			{/* Set Crisp customer chat support */}
			<CrispChat />
		</QueryClientProvider>
	);
};

export default ClientLayout;
