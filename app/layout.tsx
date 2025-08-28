import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import DottedBackground from "@/components/DottedBackground";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/theme-provider";
import { getNonce } from "@/lib/nonce";
import config from "@/config";
import "./globals.css";

const font = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: "#000000",
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
	const nonce = getNonce();

	return (
		<html
			lang="en"
			data-theme="dark"
			className={`${font.className} dark h-full`}
			suppressHydrationWarning>
			<head>
				{/* CSP nonce is handled by middleware, but if you need inline scripts, use the nonce */}
				{nonce && <meta name="csp-nonce" content={nonce} />}
				{/* Support for iOS safe areas and proper viewport handling */}
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover"
				/>
				<meta name="theme-color" content="#000000" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="black-translucent"
				/>
				<meta name="apple-mobile-web-app-title" content="Padel Segrià" />

				{/* PWA Manifest */}
				<link rel="manifest" href="/manifest.json" />

				{/* Apple Touch Icons */}
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
				<link
					rel="apple-touch-icon"
					sizes="152x152"
					href="/icons/icon-152x152.png"
				/>
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/icons/icon-192x192.png"
				/>
			</head>
			<body
				className="bg-black touch-pan-y h-full"
				style={{
					overflowX: "hidden",
					overscrollBehaviorX: "none",
					// ensure body handles vertical scroll only
					overscrollBehavior: "auto",
				}}>
				<ThemeProvider
					attribute="class"
					forcedTheme="dark"
					defaultTheme="dark"
					enableSystem={false}
					disableTransitionOnChange>
					<div
						className="relative min-h-full overflow-y-hidden w-full bg-black"
						style={{
							overflowX: "hidden",
							paddingLeft: "env(safe-area-inset-left)",
							paddingRight: "env(safe-area-inset-right)",
						}}>
						<DottedBackground />
						<ServiceWorkerRegister />
						{/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
						<ClientLayout nonce={nonce}>{children}</ClientLayout>
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
