"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
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
];

export function AppSidebar() {
	const pathname = usePathname();
	const { user, profile, signOut } = useUser();

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
			className="border-r-0"
			style={{
				background: "rgba(0, 0, 0, 0.9)",
				backdropFilter: "blur(20px)",
				WebkitBackdropFilter: "blur(20px)",
			}}>
			<SidebarHeader className="border-b border-white/10">
				<div className="flex items-center gap-3 px-4 py-4">
					<div className="relative">
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
						<span className="font-bold text-white text-lg">Padel Segrià</span>
						<span className="text-xs text-white/60">Dashboard</span>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2 py-4">
				{/* Main Navigation */}
				<div className="mb-6">
					<div className="px-3 mb-3">
						<h4 className="text-xs font-semibold tracking-wide text-white/40 uppercase">
							Navegació Principal
						</h4>
					</div>
					<SidebarMenu>
						{menuItems.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.url}
									className={cn(
										"group relative overflow-hidden rounded-xl mb-1 transition-all duration-300",
										pathname === item.url
											? "bg-padel-primary/20 text-padel-primary border border-padel-primary/30"
											: "text-white/70 hover:text-white hover:bg-white/10"
									)}>
									<Link href={item.url} className="flex items-center gap-3 p-3">
										<item.icon className="h-5 w-5 shrink-0" />
										<div className="flex flex-col">
											<span className="font-medium">{item.title}</span>
											<span className="text-xs opacity-60">
												{item.description}
											</span>
										</div>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</div>

				{/* Admin Section - Only show if user is admin */}
				{profile?.is_admin && (
					<div className="mb-6">
						<div className="px-3 mb-3 flex items-center gap-2">
							<Shield className="w-3 h-3 text-padel-primary" />
							<h4 className="text-xs font-semibold tracking-wide text-white/40 uppercase">
								Administració
							</h4>
						</div>
						<SidebarMenu>
							{adminItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.url}
										className={cn(
											"group relative overflow-hidden rounded-xl mb-1 transition-all duration-300",
											pathname === item.url
												? "bg-padel-primary/20 text-padel-primary border border-padel-primary/30"
												: "text-white/70 hover:text-white hover:bg-white/10"
										)}>
										<Link
											href={item.url}
											className="flex items-center gap-3 p-3">
											<item.icon className="h-5 w-5 shrink-0" />
											<div className="flex flex-col">
												<span className="font-medium">{item.title}</span>
												<span className="text-xs opacity-60">
													{item.description}
												</span>
											</div>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</div>
				)}

				{/* Settings Section */}
				<div>
					<div className="px-3 mb-3 flex items-center gap-2">
						<Settings className="w-3 h-3 text-white/40" />
						<h4 className="text-xs font-semibold tracking-wide text-white/40 uppercase">
							Configuració
						</h4>
					</div>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								isActive={pathname === "/dashboard/config"}
								className={cn(
									"group relative overflow-hidden rounded-xl mb-1 transition-all duration-300",
									pathname === "/dashboard/config"
										? "bg-padel-primary/20 text-padel-primary border border-padel-primary/30"
										: "text-white/70 hover:text-white hover:bg-white/10"
								)}>
								<Link
									href="/dashboard/config"
									className="flex items-center gap-3 p-3">
									<Settings className="h-5 w-5 shrink-0" />
									<div className="flex flex-col">
										<span className="font-medium">Configuració General</span>
										<span className="text-xs opacity-60">
											Preferències i ajustos
										</span>
									</div>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</div>
			</SidebarContent>

			<SidebarFooter className="border-t border-white/10 p-4">
				<Button
					variant="outline"
					className="w-full flex items-center gap-3 bg-white/5 border-white/20 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
					onClick={handleLogout}>
					<LogOut className="h-4 w-4" />
					<span>Tancar Sessió</span>
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
