import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const supabase = createClient();

		// Sign out the user
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("Error signing out:", error);
			return NextResponse.json(
				{ error: "Error tancant sessió" },
				{ status: 500 }
			);
		}

		// Create response and clear auth cookies
		const response = NextResponse.json(
			{ message: "Sessió tancada correctament" },
			{ status: 200 }
		);

		// Clear auth-related cookies
		const cookiesToClear = [
			"sb-access-token",
			"sb-refresh-token",
			"supabase-auth-token",
			"supabase.auth.token",
		];

		cookiesToClear.forEach((cookieName) => {
			response.cookies.set(cookieName, "", {
				expires: new Date(0),
				path: "/",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
			});
		});

		return response;
	} catch (error) {
		console.error("Unexpected error during logout:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// Also support GET requests for direct navigation
export async function GET(req: NextRequest) {
	try {
		const supabase = createClient();

		// Sign out the user
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("Error signing out:", error);
			// Even if there's an error, redirect to home page
		}

		// Redirect to home page after logout
		const url = new URL("/", req.url);
		const response = NextResponse.redirect(url);

		// Clear auth-related cookies
		const cookiesToClear = [
			"sb-access-token",
			"sb-refresh-token",
			"supabase-auth-token",
			"supabase.auth.token",
		];

		cookiesToClear.forEach((cookieName) => {
			response.cookies.set(cookieName, "", {
				expires: new Date(0),
				path: "/",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
			});
		});

		return response;
	} catch (error) {
		console.error("Unexpected error during logout:", error);
		// Even if there's an error, redirect to home page
		const url = new URL("/", req.url);
		return NextResponse.redirect(url);
	}
}
