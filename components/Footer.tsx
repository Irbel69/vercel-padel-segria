import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import { Instagram } from "lucide-react";

// Modern, minimalist footer for Padel Segrià with social links and essential information

const Footer = () => {
	return (
		<footer className="py-24 relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -bottom-40 -right-40 w-80 h-80 bg-padel-primary/10 rounded-full blur-3xl" />
				<div className="absolute -top-40 -left-40 w-80 h-80 bg-padel-primary/5 rounded-full blur-3xl" />
			</div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="flex flex-col md:flex-row items-start justify-between gap-10">
					{/* Logo & Branding */}
					<div className="flex flex-col items-center md:items-start">
						<Link
							href="/#"
							className="flex items-center gap-3 mb-4 transition-transform duration-300 hover:scale-105">
							<Image
								src="/logo_yellow.png"
								alt={`${config.appName} logo`}
								width={50}
								height={50}
								priority={true}
								className="h-12 w-auto"
							/>
							<span className="text-xl md:text-2xl font-bold text-white">
								Padel Segrià
							</span>
						</Link>

						<p className="text-sm text-gray-300 text-center md:text-left max-w-xs leading-relaxed">
							La millor comunitat de pàdel del Segrià. Uneix-te a nosaltres i
							gaudeix d&apos;aquest apassionant esport.
						</p>
					</div>

					{/* Navigation Links */}
					<div className="grid grid-cols-2 gap-x-16 gap-y-8">
						<div className="flex flex-col items-center md:items-start">
							<h3 className="font-bold text-padel-primary mb-4 uppercase tracking-wider text-sm">
								ENLLAÇOS
							</h3>
							<div className="flex flex-col gap-2 items-center md:items-start">
								<Link
									href="/#"
									className="text-white hover:text-padel-primary transition-colors">
									Inici
								</Link>
								<Link
									href="/#rankings"
									className="text-white hover:text-padel-primary transition-colors">
									Rànquings
								</Link>
								<Link
									href="/#events"
									className="text-white hover:text-padel-primary transition-colors">
									Esdeveniments
								</Link>
								<Link
									href="/#contact"
									className="text-white hover:text-padel-primary transition-colors">
									Contacte
								</Link>
							</div>
						</div>

						<div className="flex flex-col items-center md:items-start">
							<h3 className="font-bold text-padel-primary mb-4 uppercase tracking-wider text-sm">
								LEGAL
							</h3>
							<div className="flex flex-col gap-2 items-center md:items-start">
								<Link
									href="/privacy-policy"
									className="text-white hover:text-padel-primary transition-colors">
									Política de privacitat
								</Link>
								<Link
									href="/tos"
									className="text-white hover:text-padel-primary transition-colors">
									Termes del servei
								</Link>
								<Link
									href="/cookies"
									className="text-white hover:text-padel-primary transition-colors">
									Política de cookies
								</Link>
							</div>
						</div>
					</div>

					{/* Social & Contact */}
					<div className="flex flex-col items-center md:items-end">
						<h3 className="font-bold text-padel-primary mb-4 uppercase tracking-wider text-sm">
							SEGUEIX-NOS
						</h3>
						<div className="flex gap-4">
							<a
								href="https://www.instagram.com/padel.segria?igsh=MWZyMTl1NmEwNzh1aQ=="
								target="_blank"
								rel="noopener noreferrer"
								className="p-3 rounded-full bg-padel-primary/10 hover:bg-padel-primary/20 transition-all duration-300 group"
								aria-label="Instagram">
								<Instagram className="w-5 h-5 text-padel-primary group-hover:scale-110 transition-transform" />
							</a>
						</div>
						<div className="mt-6 text-center md:text-right">
							<p className="text-sm text-white">
								<a
									href="mailto:info@padelsegria.cat"
									className="hover:text-padel-primary transition-colors">
									info@padelsegria.cat
								</a>
							</p>
							<p className="text-sm text-white mt-1">
								<a
									href="tel:+34973123456"
									className="hover:text-padel-primary transition-colors">
									+34 973 123 456
								</a>
							</p>
						</div>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-16 pt-6 border-t border-white/10 text-center">
					<p className="text-sm text-gray-400">
						© {new Date().getFullYear()} Padel Segrià. Tots els drets reservats.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
