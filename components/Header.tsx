"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import config from "@/config";

const links: {
	href: string;
	label: string;
}[] = [
	{
		href: "/",
		label: "Home",
	},
	{
		href: "/club",
		label: "Club",
	},
	{
		href: "/shop",
		label: "Shop",
	},
	{
		href: "/event",
		label: "Event",
	},
];

// Define the Contact button component
const ContactButton = ({
	isHomePage,
	transparent,
}: {
	isHomePage?: boolean;
	transparent?: boolean;
}): JSX.Element => (
	<Link
		href="/contact"
		className={`${
			isHomePage || transparent
				? "bg-[#c3fb12] text-black hover:bg-white"
				: "btn btn-primary"
		} font-bold px-6 py-2 rounded-md flex items-center justify-center`}>
		Contact
	</Link>
);

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
interface HeaderProps {
	transparent?: boolean;
}

const Header = ({ transparent = false }: HeaderProps) => {
	const searchParams = useSearchParams();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const path = searchParams.toString();
	const isHomePage = path === "";

	// setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
	useEffect(() => {
		setIsOpen(false);
	}, [searchParams]);

	return (
		<header
			className={`${
				isHomePage || transparent
					? "bg-transparent absolute top-0 left-0 right-0 z-50"
					: "bg-base-200"
			}`}>
			<nav
				className="container flex items-center justify-between px-8 py-4 mx-auto"
				aria-label="Global">
				{/* Your logo/name on large screens */}
				<div className="flex lg:flex-1">
					<Link
						className="flex items-center gap-2 shrink-0 "
						href="/"
						title={`${config.appName} homepage`}>
						<Image
							src="/logo_yellow.png"
							alt={`${config.appName} logo`}
							className="w-10 h-10"
							priority={true}
							width={40}
							height={40}
						/>
						<span className="font-extrabold text-lg text-[#c3fb12]">
							Padel Segrià
						</span>
					</Link>
				</div>
				{/* Burger button to open menu on mobile */}
				<div className="flex lg:hidden">
					<button
						type="button"
						className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
						onClick={() => setIsOpen(true)}>
						<span className="sr-only">Open main menu</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-6 h-6 text-base-content">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
							/>
						</svg>
					</button>
				</div>

				{/* Your links on large screens */}
				<div className="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
					{links.map((link) => (
						<Link
							href={link.href}
							key={link.href}
							className={`text-base font-medium ${
								isHomePage || transparent
									? "text-white hover:text-[#c3fb12]"
									: "hover:text-[#c3fb12]"
							} transition-colors`}
							title={link.label}>
							{link.label}
						</Link>
					))}
				</div>

				{/* Contact button on large screens */}
				<div className="hidden lg:flex lg:justify-end lg:flex-1">
					<ContactButton isHomePage={isHomePage} transparent={transparent} />
				</div>
			</nav>

			{/* Mobile menu, show/hide based on menu state. */}
			<div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
				{/* Backdrop with dotted pattern and blur effect */}
				<div
					className="fixed inset-0 bg-black/80 backdrop-blur-sm"
					style={{
						backgroundImage: `radial-gradient(circle, rgba(229, 240, 0, 0.1) 1px, transparent 1px)`,
						backgroundSize: "20px 20px",
					}}
					onClick={() => setIsOpen(false)}
				/>

				{/* Mobile menu panel */}
				<div
					className="fixed inset-y-0 right-0 z-10 w-full sm:max-w-sm overflow-y-auto transform origin-right transition-all ease-in-out duration-500"
					style={{
						background: `linear-gradient(135deg, rgba(5, 28, 44, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)`,
						backdropFilter: "blur(20px)",
						WebkitBackdropFilter: "blur(20px)",
						borderLeft: "1px solid rgba(229, 240, 0, 0.2)",
						boxShadow:
							"0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 100px rgba(229, 240, 0, 0.05)",
					}}>
					{/* Decorative background elements */}
					<div className="absolute inset-0 overflow-hidden pointer-events-none">
						<div className="absolute top-20 -right-20 w-40 h-40 bg-padel-primary/5 rounded-full blur-3xl" />
						<div className="absolute bottom-40 -left-20 w-32 h-32 bg-padel-primary/10 rounded-full blur-2xl" />
						<div className="absolute top-1/2 right-10 w-2 h-2 bg-padel-primary/30 rounded-full animate-pulse" />
						<div
							className="absolute top-1/3 right-20 w-1 h-1 bg-padel-primary/40 rounded-full animate-pulse"
							style={{ animationDelay: "1s" }}
						/>
						<div
							className="absolute bottom-1/3 right-6 w-1.5 h-1.5 bg-padel-primary/20 rounded-full animate-pulse"
							style={{ animationDelay: "2s" }}
						/>
					</div>

					<div className="relative z-10 p-6">
						{/* Header with logo and close button */}
						<div className="flex items-center justify-between mb-12">
							<Link
								className="flex items-center gap-3 shrink-0 group"
								title={`${config.appName} homepage`}
								href="/">
								<div className="relative">
									<div className="absolute inset-0 bg-padel-primary/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
									<Image
										src="/logo_yellow.png"
										alt={`${config.appName} logo`}
										className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-300"
										priority={true}
										width={40}
										height={40}
									/>
								</div>
								<span className="font-extrabold text-xl text-padel-primary group-hover:text-white transition-colors duration-300">
									Padel Segrià
								</span>
							</Link>

							<button
								type="button"
								className="relative group p-3 rounded-xl transition-all duration-300"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}
								onClick={() => setIsOpen(false)}>
								<span className="sr-only">Close menu</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={2}
									stroke="currentColor"
									className="w-6 h-6 text-white group-hover:text-padel-primary transition-colors duration-300 group-hover:rotate-90">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
								<div className="absolute inset-0 bg-padel-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							</button>
						</div>

						{/* Navigation Links */}
						<div className="space-y-6 mb-12">
							{links.map((link, index) => (
								<Link
									href={link.href}
									key={link.href}
									className="group relative block"
									title={link.label}
									style={{
										animationDelay: `${index * 100}ms`,
									}}>
									<div
										className="relative p-4 rounded-2xl transition-all duration-300 group-hover:scale-105"
										style={{
											background: "rgba(255, 255, 255, 0.03)",
											border: "1px solid rgba(255, 255, 255, 0.05)",
											backdropFilter: "blur(10px)",
										}}>
										{/* Hover background effect */}
										<div className="absolute inset-0 bg-gradient-to-r from-padel-primary/10 to-padel-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

										{/* Link content */}
										<div className="relative flex items-center gap-4">
											<div className="w-2 h-2 bg-padel-primary/50 rounded-full group-hover:bg-padel-primary group-hover:scale-150 transition-all duration-300" />
											<span className="text-xl font-semibold text-white group-hover:text-padel-primary transition-colors duration-300">
												{link.label}
											</span>
											<div className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													strokeWidth={2}
													stroke="currentColor"
													className="w-5 h-5 text-padel-primary">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
													/>
												</svg>
											</div>
										</div>

										{/* Animated border */}
										<div
											className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
											style={{
												background: `linear-gradient(90deg, transparent, rgba(229, 240, 0, 0.3), transparent)`,
												backgroundSize: "200% 1px",
												backgroundPosition: "-100% 0",
												animation: "shimmer 2s ease-in-out infinite",
												height: "1px",
												top: "0",
											}}
										/>
									</div>
								</Link>
							))}
						</div>

						{/* Divider with gradient */}
						<div className="relative mb-8">
							<div className="absolute inset-0 flex items-center">
								<div
									className="w-full border-t border-gradient-to-r from-transparent via-padel-primary/30 to-transparent"
									style={{
										background: `linear-gradient(90deg, transparent, rgba(229, 240, 0, 0.3), transparent)`,
										height: "1px",
									}}
								/>
							</div>
							<div className="relative flex justify-center">
								<div className="px-4 bg-black/50 backdrop-blur-sm">
									<div className="w-2 h-2 bg-padel-primary/60 rounded-full" />
								</div>
							</div>
						</div>

						{/* Contact Button - Enhanced */}
						<div className="space-y-6">
							<div className="relative group">
								<div className="absolute inset-0 bg-gradient-to-r from-padel-primary/20 to-padel-primary/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
								<Link
									href="/contact"
									className="relative block w-full p-6 rounded-2xl text-center font-bold text-xl transition-all duration-300 group-hover:scale-105"
									style={{
										background: `linear-gradient(135deg, rgba(229, 240, 0, 0.9) 0%, rgba(229, 240, 0, 1) 100%)`,
										color: "#051c2c",
										boxShadow: "0 10px 30px rgba(229, 240, 0, 0.3)",
									}}>
									<div className="flex items-center justify-center gap-3">
										<span>Contacta'ns</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={2}
											stroke="currentColor"
											className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
											/>
										</svg>
									</div>
								</Link>
							</div>

							{/* Additional Menu Options */}
							<div className="grid grid-cols-2 gap-4">
								<button
									className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-105"
									style={{
										background: "rgba(255, 255, 255, 0.05)",
										border: "1px solid rgba(255, 255, 255, 0.1)",
									}}>
									<div className="text-padel-primary mb-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={2}
											stroke="currentColor"
											className="w-6 h-6 mx-auto">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
											/>
										</svg>
									</div>
									<span className="text-sm font-medium text-white">Login</span>
								</button>

								<button
									className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-105"
									style={{
										background: "rgba(255, 255, 255, 0.05)",
										border: "1px solid rgba(255, 255, 255, 0.1)",
									}}>
									<div className="text-padel-primary mb-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={2}
											stroke="currentColor"
											className="w-6 h-6 mx-auto">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275"
											/>
										</svg>
									</div>
									<span className="text-sm font-medium text-white">Perfil</span>
								</button>
							</div>
						</div>

						{/* Footer info */}
						<div
							className="mt-12 pt-6 text-center"
							style={{
								borderTop: "1px solid rgba(255, 255, 255, 0.1)",
							}}>
							<p className="text-sm text-gray-400">© 2025 Padel Segrià</p>
							<p className="text-xs text-gray-500 mt-1">
								Lleu, Competeix, Guanya
							</p>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
