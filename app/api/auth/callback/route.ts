import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import { withRateLimit } from "@/libs/rate-limiter-middleware";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
async function handler(req: NextRequest) {
	const requestUrl = new URL(req.url);

	// Do not attempt server-side exchange. Redirect to the client callback which will
	// perform the PKCE/code exchange in the browser (where the flow state and verifier
	// are stored). This avoids flow_state_not_found and PKCE issues.
	const redirectToClient = NextResponse.redirect(requestUrl.origin + "/auth/callback" + requestUrl.search, { status: 303 });
	redirectToClient.headers.set('Cache-Control', 'no-store');
	return redirectToClient;
}

// Apply rate limiting to the GET handler
export const GET = withRateLimit('auth', handler);
