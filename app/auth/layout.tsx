import type { ReactNode } from "react";

// Prevent Next.js from attempting to prerender pages under /auth (client-only)
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }) {
	return children as any;
}

