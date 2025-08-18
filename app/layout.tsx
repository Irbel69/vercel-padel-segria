import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import DottedBackground from "@/components/DottedBackground";
import { ThemeProvider } from "@/components/theme-provider";
import { getNonce } from "@/lib/nonce";
import config from "@/config";
import "./globals.css";

const font = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
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
			className={`${font.className} dark`}
			suppressHydrationWarning
		>
			<head>
				{/* CSP nonce is handled by middleware, but if you need inline scripts, use the nonce */}
				{nonce && (
					<meta name="csp-nonce" content={nonce} />
				)}
			</head>
			<body>
				<ThemeProvider
					attribute="class"
					forcedTheme="dark"
					defaultTheme="dark"
					enableSystem={false}
					disableTransitionOnChange
				>
					{/* Global background pattern (single instance) */}
					<div className="relative min-h-screen w-full overflow-x-hidden overflow-y-hidden">
						<DottedBackground />
						{/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
						<ClientLayout nonce={nonce}>{children}</ClientLayout>
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
