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
import { Analytics } from "@vercel/analytics/next";
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
		    translate="no"
		    data-theme="dark"
		    className={`${font.className} dark h-full`}
		    suppressHydrationWarning>
			<head>
				{/* Charset: explicit for older user agents */}
				<meta charSet="utf-8" />
				{/* Description + author (fall back to config) */}
				<meta name="description" content={metadata?.description ?? config.appDescription ?? ''} />
				<meta name="author" content={config?.resend?.fromAdmin ?? config.appName} />
				{/* Robots / indexing */}
				<meta name="robots" content={'index,follow'} />
				{/* Canonical URL */}
				{((metadata as any)?.url || config.domainName) ? (
					<link rel="canonical" href={(metadata as any)?.url ?? `https://${config.domainName}`} />
				) : null}
				{/* Open Graph */}
				<meta property="og:site_name" content={config.appName} />
				<meta property="og:title" content={(metadata as any)?.title ?? config.appName} />
				<meta property="og:description" content={(metadata as any)?.description ?? config.appDescription} />
				<meta property="og:type" content={(metadata as any)?.type ?? 'website'} />
				<meta property="og:url" content={(metadata as any)?.url ?? `https://${config.domainName}`} />
				{(metadata as any)?.openGraph?.images ? (
					<meta property="og:image" content={(metadata as any).openGraph.images[0]} />
				) : (
					<meta property="og:image" content={`https://${config.domainName}/opengraph-image.png`} />
				)}
				{/* Twitter Card */}
				<meta name="twitter:card" content={(metadata as any)?.twitter?.card ?? 'summary_large_image'} />
				<meta name="twitter:title" content={(metadata as any)?.title ?? config.appName} />
				<meta name="twitter:description" content={(metadata as any)?.description ?? config.appDescription} />
				<meta name="twitter:site" content={''} />
				<meta name="twitter:image" content={(metadata as any)?.openGraph?.images?.[0] ?? `https://${config.domainName}/opengraph-image.png`} />
				{/* Microsoft Tiles */}
				<meta name="msapplication-TileColor" content={config.colors?.main ?? '#000000'} />
				<link rel="mask-icon" href="/icons/icon-192x192.png" color={config.colors?.main ?? '#000000'} />
				{/* Preconnect to fonts/cdn for performance */}
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				{/* CSP nonce is handled by middleware, but if you need inline scripts, use the nonce */}
				{nonce && <meta name="csp-nonce" content={nonce} />}
				{/* Support for iOS safe areas and proper viewport handling */}
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover"
				/>
				<meta name="theme-color" content="#000000" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="black-translucent"
				/>
				<meta name="apple-mobile-web-app-title" content="Padel Segrià" />

				{/* PWA Manifest */}
				<link rel="manifest" href="/manifest.json" />
				{/* Prevent automatic translation (Google Translate / iOS) */}
				<meta name="google" content="notranslate" />

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
				className={`bg-black touch-pan-y min-h-screen overflow-x-hidden overflow-y-auto`}
				style={{
					overscrollBehaviorX: "none",
					overscrollBehavior: "auto",
				}}>
				<ThemeProvider
					attribute="class"
					forcedTheme="dark"
					defaultTheme="dark"
					enableSystem={false}
					disableTransitionOnChange>
					{/* Allow vertical scrolling globally; `/dashboard` uses its own
					   full-height/no-page-scroll behavior in `app/dashboard/layout.tsx`. */}
					<div className="relative min-h-screen w-full bg-black overflow-x-hidden overflow-y-hidden"
						style={{
							paddingLeft: "env(safe-area-inset-left)",
							paddingRight: "env(safe-area-inset-right)",
						}}>
						<DottedBackground />
						<ServiceWorkerRegister />
						{/* Vercel Analytics — middleware provides a per-request nonce so inline bootstrap is allowed */}
						<Analytics />
						{/* ClientLayout contains all the client wrappers (toast messages, tooltips, etc.) */}
						<ClientLayout nonce={nonce}>{children}</ClientLayout>
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
