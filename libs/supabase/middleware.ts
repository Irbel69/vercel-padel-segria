import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value)
					);
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options)
					);
				},
			},
		}
	);

	// refreshing the auth token
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const url = request.nextUrl.clone();

	// Feature flag: when set to "true" (string), allow public access to /complete-profile
	// This is useful for temporary testing (Playwright). Keep it easy to revert: remove
	// the env var or set it to "false" to restore original behavior.
	const allowPublicCompleteProfile = process.env.ALLOW_PUBLIC_COMPLETE_PROFILE === "true";

	// Protected routes that require authentication
	const protectedRoutes = ["/dashboard"];
	// Routes that require profile completion
	const profileRequiredRoutes = ["/dashboard"];
	// Routes that require admin access
	const adminRoutes = [
		"/dashboard/users",
		"/dashboard/analytics",
		"/dashboard/reports",
	];
	// Public routes that authenticated users shouldn't access
	const publicOnlyRoutes = ["/signin"];

	const isProtectedRoute = protectedRoutes.some((route) =>
		url.pathname.startsWith(route)
	);
	const isProfileRequiredRoute = profileRequiredRoutes.some((route) =>
		url.pathname.startsWith(route)
	);
	const isAdminRoute = adminRoutes.some((route) =>
		url.pathname.startsWith(route)
	);
	const isPublicOnlyRoute = publicOnlyRoutes.some((route) =>
		url.pathname.startsWith(route)
	);

	// If user is not authenticated and trying to access protected route
	if (!user && isProtectedRoute) {
		url.pathname = "/signin";
		return NextResponse.redirect(url);
	}

	// If user is authenticated and trying to access signin page
	if (user && isPublicOnlyRoute) {
		// Check if user has completed profile
		const { data: userProfile } = await supabase
			.from("users")
			.select("name, surname")
			.eq("id", user.id)
			.single();

		if (!userProfile || !userProfile.name || !userProfile.surname) {
			url.pathname = "/complete-profile";
		} else {
			url.pathname = "/dashboard";
		}
		return NextResponse.redirect(url);
	}

	// If user is authenticated but profile is incomplete and trying to access profile-required routes
	if (user && isProfileRequiredRoute && url.pathname !== "/complete-profile") {
		const { data: userProfile } = await supabase
			.from("users")
			.select("name, surname, is_admin")
			.eq("id", user.id)
			.single();

		// If we're temporarily allowing public access to complete-profile, skip
		// forcing users into it so Playwright / tests can open the page.
		if (!allowPublicCompleteProfile) {
			if (!userProfile || !userProfile.name || !userProfile.surname) {
				url.pathname = "/complete-profile";
				return NextResponse.redirect(url);
			}
		}

		// Check admin access for admin routes
		if (isAdminRoute && !userProfile.is_admin) {
			url.pathname = "/dashboard";
			return NextResponse.redirect(url);
		}
	}

	// If user has complete profile and trying to access complete-profile page
	if (user && url.pathname === "/complete-profile") {
		const { data: userProfile } = await supabase
			.from("users")
			.select("name, surname")
			.eq("id", user.id)
			.single();

		// When allowing public access, don't redirect authenticated users away
		// from the page even if their profile appears complete.
		if (!allowPublicCompleteProfile) {
			if (userProfile && userProfile.name && userProfile.surname) {
				url.pathname = "/dashboard";
				return NextResponse.redirect(url);
			}
		}
	}

	return supabaseResponse;
}
