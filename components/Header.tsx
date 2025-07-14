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
							Padel Segria
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
				<div
					className={`fixed inset-y-0 right-0 z-10 w-full px-8 py-4 overflow-y-auto bg-base-200 sm:max-w-sm sm:ring-1 sm:ring-neutral/10 transform origin-right transition ease-in-out duration-300`}>
					{/* Your logo/name on small screens */}
					<div className="flex items-center justify-between">
						<Link
							className="flex items-center gap-2 shrink-0 "
							title={`${config.appName} homepage`}
							href="/">
							<Image
								src="/logo_yellow.png"
								alt={`${config.appName} logo`}
								className="w-8 h-8"
								priority={true}
								width={32}
								height={32}
							/>
							<span className="font-extrabold text-lg text-[#c3fb12]">
								Padel Segria
							</span>
						</Link>
						<button
							type="button"
							className="-m-2.5 rounded-md p-2.5"
							onClick={() => setIsOpen(false)}>
							<span className="sr-only">Close menu</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-6 h-6">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Your links on small screens */}
					<div className="flow-root mt-6">
						<div className="py-4">
							<div className="flex flex-col gap-y-4 items-start">
								{links.map((link) => (
									<Link
										href={link.href}
										key={link.href}
										className="text-base font-medium hover:text-[#c3fb12] transition-colors"
										title={link.label}>
										{link.label}
									</Link>
								))}
							</div>
						</div>
						<div className="divider"></div>
						{/* Contact button on small screens */}
						<div className="flex flex-col">
							<ContactButton
								isHomePage={isHomePage}
								transparent={transparent}
							/>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
