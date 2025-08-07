import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
	const requestUrl = new URL(req.url);
	const code = requestUrl.searchParams.get("code");

	if (code) {
		const supabase = createClient();
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error("Error exchanging code for session:", error);
			return NextResponse.redirect(
				requestUrl.origin + "/signin?error=auth_error"
			);
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
					return NextResponse.redirect(requestUrl.origin + "/complete-profile");
				}
				// For other errors, still try to redirect to complete profile
				return NextResponse.redirect(requestUrl.origin + "/complete-profile");
			}

			// If no profile or incomplete profile, redirect to complete profile
			if (!userProfile || !userProfile.name || !userProfile.surname) {
				return NextResponse.redirect(requestUrl.origin + "/complete-profile");
			}
		}
	}

	// URL to redirect to after sign in process completes
	return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl);
}
