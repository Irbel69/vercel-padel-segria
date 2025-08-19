"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
	Settings,
	Home,
	Users,
	BarChart3,
	FileText,
	Shield,
	Palette,
	Bell,
	Database,
	LogOut,
	Trophy,
	Calendar,
	Target,
	User,
	Award,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

const menuItems = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: Home,
		description: "Pàgina principal",
	},
	{
		title: "Tornejos",
		url: "/dashboard/tournaments",
		icon: Target,
		description: "Participa en competicions",
	},
	{
		title: "Classificació",
		url: "/dashboard/rankings",
		icon: Trophy,
		description: "Rànking de jugadors",
	},
];

const adminItems = [
	{
		title: "Esdeveniments",
		url: "/dashboard/admin/events",
		icon: Calendar,
		description: "Gestió de tornejos",
	},
	{
		title: "Usuaris",
		url: "/dashboard/users",
		icon: Users,
		description: "Gestió d'usuaris",
	},
	{
		title: "Qualitats",
		url: "/dashboard/admin/qualities",
		icon: Award,
		description: "Gestió de qualitats",
	},
];

export function AppSidebar() {
	const pathname = usePathname();
	const { user, profile, signOut } = useUser();

	// Access sidebar context to control mobile sheet state
	const { isMobile, setOpenMobile } = useSidebar();

	// Auto-close the sidebar sheet on mobile after navigation
	useEffect(() => {
		if (isMobile) {
			setOpenMobile(false);
		}
	}, [pathname, isMobile, setOpenMobile]);

	const handleLogout = async () => {
		try {
			await signOut();
			window.location.href = "/";
		} catch (error) {
			console.error("Error during logout:", error);
			// Still redirect to home even if there's an error
			window.location.href = "/";
		}
	};

	return (
		<Sidebar
			className={cn(
				"border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl animate-sidebar-enter"
			)}>
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="flex items-center gap-3 px-4 py-4">
					<div className="relative logo-glow">
						<div className="absolute inset-0 bg-padel-primary/30 rounded-full blur-sm" />
						<Image
							src="/logo_yellow.png"
							alt="Padel Segrià"
							width={40}
							height={40}
							className="relative"
						/>
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-sidebar-foreground text-lg">Padel Segrià</span>
						<span className="text-xs text-sidebar-foreground/60">Dashboard</span>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2 py-4">
				{/* Main Navigation */}
				<div className="mb-6">
					<div className="px-4 mb-3">
						<h4 className="text-xs font-semibold tracking-wide text-sidebar-foreground/60 uppercase">
							Navegació Principal
						</h4>
					</div>
					<SidebarMenu className="gap-1.5">
						{menuItems.map((item, idx) => (
							<SidebarMenuItem key={item.title}>
				<SidebarMenuButton
									asChild
									isActive={pathname === item.url}
									size="lg"
									className={cn(
										"group relative overflow-hidden rounded-xl mb-1.5 transition-all duration-200 hover:translate-x-0.5 px-4 py-3.5 animate-item-enter hover:shadow-[0_0_10px_rgba(229,240,0,0.06)]",
										pathname === item.url &&
											"bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-padel-primary before:rounded-l-xl before:shadow-[0_0_6px_rgba(229,240,0,0.35)]"
									)}
									style={{ animationDelay: `${(idx + 1) * 50}ms` }}
								>
									<Link
										href={item.url}
										className="flex items-center gap-4"
										onClick={() => {
											if (isMobile) setOpenMobile(false);
										}}
									>
										<item.icon className="h-5 w-5 shrink-0 transition-colors group-data-[active=true]:text-padel-primary" />
										<div className="flex flex-col">
											<span className="font-medium text-sidebar-foreground">
												{item.title}
											</span>
											<span className="text-[13px] leading-4 text-sidebar-foreground/60">
												{item.description}
											</span>
										</div>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
					<SidebarSeparator className="my-4" />
				</div>

				{/* Admin Section - Only show if user is admin */}
				{profile?.is_admin && (
					<div className="mb-6">
						<div className="px-4 mb-3 flex items-center gap-2">
							<Shield className="w-3 h-3 text-padel-primary" />
							<h4 className="text-xs font-semibold tracking-wide text-sidebar-foreground/60 uppercase">
								Administració
							</h4>
						</div>
						<SidebarMenu className="gap-1.5">
							{adminItems.map((item, idx) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.url}
										size="lg"
										className={cn(
											"group relative overflow-hidden rounded-xl mb-1.5 transition-all duration-200 hover:translate-x-0.5 px-4 py-3.5 animate-item-enter hover:shadow-[0_0_10px_rgba(229,240,0,0.06)]",
											pathname === item.url &&
												"bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-padel-primary before:rounded-l-xl before:shadow-[0_0_6px_rgba(229,240,0,0.35)]"
										)}
										style={{ animationDelay: `${(idx + 1) * 50}ms` }}
									>
										<Link
											href={item.url}
											className="flex items-center gap-4"
											onClick={() => {
												if (isMobile) setOpenMobile(false);
											}}
										>
											<item.icon className="h-5 w-5 shrink-0 transition-colors group-data-[active=true]:text-padel-primary" />
											<div className="flex flex-col">
												<span className="font-medium text-sidebar-foreground">{item.title}</span>
												<span className="text-[13px] leading-4 text-sidebar-foreground/60">
													{item.description}
												</span>
											</div>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
						<SidebarSeparator className="my-4" />
					</div>
				)}

				{/* Settings Section */}
				<div>
					<div className="px-4 mb-3 flex items-center gap-2">
						<Settings className="w-3 h-3 text-sidebar-foreground/60" />
						<h4 className="text-xs font-semibold tracking-wide text-sidebar-foreground/60 uppercase">
							Configuració
						</h4>
					</div>
			<SidebarMenu className="gap-1.5">
						<SidebarMenuItem>
				<SidebarMenuButton
								asChild
								isActive={pathname === "/dashboard/config"}
								size="lg"
								className={cn(
									"group relative overflow-hidden rounded-xl mb-1.5 transition-all duration-200 hover:translate-x-0.5 px-4 py-3.5 animate-item-enter hover:shadow-[0_0_10px_rgba(229,240,0,0.06)]",
									pathname === "/dashboard/config" &&
										"bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-padel-primary before:rounded-l-xl before:shadow-[0_0_6px_rgba(229,240,0,0.35)]"
								)}
								style={{ animationDelay: `200ms` }}
							>
				<Link
					href="/dashboard/config"
					className="flex items-center gap-4"
					onClick={() => {
						if (isMobile) setOpenMobile(false);
					}}
				>
									<Settings className="h-5 w-5 shrink-0 transition-colors group-data-[active=true]:text-padel-primary" />
									<div className="flex flex-col">
										<span className="font-medium text-sidebar-foreground">Configuració General</span>
					<span className="text-[13px] leading-4 text-sidebar-foreground/60">
											Preferències i ajustos
										</span>
									</div>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</div>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border p-4">
				<Button
					variant="outline"
					className="w-full flex items-center gap-3 bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:border-sidebar-accent transition-all duration-200"
					onClick={handleLogout}>
					<LogOut className="h-4 w-4" />
					<span>Tancar Sessió</span>
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
