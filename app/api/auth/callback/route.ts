import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import { withRateLimit } from "@/libs/rate-limiter-middleware";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
async function handler(req: NextRequest) {
	const requestUrl = new URL(req.url);
	const code = requestUrl.searchParams.get("code");

			if (code) {
		const supabase = createClient();
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);

			if (error) {
				// Common reason: PKCE code_verifier is stored in browser localStorage and not
				// available on the server. In that case, redirect to the client-side handler
				// which will perform the exchange in the browser where the PKCE state exists.
				const msg = String(error.message || error);
				if (error.status === 400 || /code verifier|invalid request|both auth code and code verifier/i.test(msg)) {
					const fallback = NextResponse.redirect(requestUrl.origin + "/auth/callback" + requestUrl.search, { status: 303 });
					fallback.headers.set('Cache-Control', 'no-store');
					return fallback;
				}
				// For other errors, log and redirect to signin
				console.error("Error exchanging code for session:", error);
				const fallback2 = NextResponse.redirect(requestUrl.origin + "/signin?error=auth_error", { status: 303 });
				fallback2.headers.set('Cache-Control', 'no-store');
				return fallback2;
		}

		if (data.user) {
			// Check if user has completed their profile
			const { data: userProfile, error: profileError } = await supabase
				.from("users")
				.select("name, surname")
				.eq("id", data.user.id)
				.single();

					if (profileError) {
				console.error("Error fetching user profile:", profileError);
				// If error fetching profile, likely user doesn't exist yet
				if (profileError.code === "PGRST116") {
							// User not found, redirect to complete profile
							const res = NextResponse.redirect(requestUrl.origin + "/complete-profile", { status: 303 });
							res.headers.set('Cache-Control', 'no-store');
							return res;
				}
				// For other errors, still try to redirect to complete profile
						const res2 = NextResponse.redirect(requestUrl.origin + "/complete-profile", { status: 303 });
						res2.headers.set('Cache-Control', 'no-store');
						return res2;
			}

			// If no profile or incomplete profile, redirect to complete profile
					if (!userProfile || !userProfile.name || !userProfile.surname) {
						const res3 = NextResponse.redirect(requestUrl.origin + "/complete-profile", { status: 303 });
						res3.headers.set('Cache-Control', 'no-store');
						return res3;
			}
		}
	}

	// URL to redirect to after sign in process completes
			const final = NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl, { status: 303 });
			final.headers.set('Cache-Control', 'no-store');
			return final;
}

// Apply rate limiting to the GET handler
export const GET = withRateLimit('auth', handler);
