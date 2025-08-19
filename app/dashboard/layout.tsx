import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import ButtonAccount from "@/components/ButtonAccount";
import AddToHomeScreen from "@/components/AddToHomeScreen";
import config from "@/config";

// This is a server-side component to ensure the user is logged in.
// If not, it will redirect to the login page.
// It's applied to all subpages of /dashboard in /app/dashboard/*** pages
// You can also add custom static UI elements like a Navbar, Sidebar, Footer, etc..
// See https://shipfa.st/docs/tutorials/private-page
export default async function LayoutPrivate({
	children,
}: {
	children: ReactNode;
}) {
	 const supabase = createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect(config.auth.loginUrl);
	}

	// Check if user has completed their profile
	const { data: userProfile } = await supabase
		.from("users")
		.select("name, surname")
		.eq("id", user.id)
		.single();

	if (!userProfile || !userProfile.name || !userProfile.surname) {
		redirect("/complete-profile");
	} 

	return (
		<div className="min-h-screen bg-black relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{/* Use transform-based offsets to avoid increasing scroll width on mobile */}
				<div className="hidden sm:block absolute -top-40 right-0 translate-x-1/2 w-96 h-96 bg-padel-primary/10 rounded-full blur-3xl" />
				<div className="hidden sm:block absolute -bottom-40 left-0 -translate-x-1/2 w-80 h-80 bg-padel-primary/5 rounded-full blur-3xl" />
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
					<div className="absolute inset-0 bg-gradient-to-br from-transparent via-padel-primary/3 to-transparent" />
				</div>
			</div>

			<SidebarProvider>
				<AppSidebar />
				<main className="flex-1 relative z-10">
					{/* Header */}
					<div
						className="flex h-16 items-center border-b px-4 lg:px-8 bg-white/5 border-white/10"
					>
						<SidebarTrigger className="text-white hover:bg-white/10" />
						<div className="ml-auto flex items-center space-x-4">
							<span className="hidden sm:block text-sm text-white/70">
								Benvingut
							</span>
							<ButtonAccount />
						</div>
					</div>

					{/* Main content */}
					<div className="flex-1 space-y-6 p-4 lg:p-8 pt-6">{children}</div>
				</main>
				
				{/* Add to Home Screen component - only shows on mobile when not installed */}
				<AddToHomeScreen />
			</SidebarProvider>
		</div>
	);
}
