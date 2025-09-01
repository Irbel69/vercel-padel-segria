"use client";

import { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
// Crisp chat removed (not used). If you want to re-enable, add Crisp SDK and reintroduce CrispChat.
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Crisp functionality intentionally removed. The project previously included a Crisp chat component
// which injected third-party scripts; since Crisp is not used, we avoid adding those scripts to
// simplify CSP and reduce third-party surface.

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

			{/* Crisp chat intentionally disabled (not used) */}
		</QueryClientProvider>
	);
};

export default ClientLayout;
