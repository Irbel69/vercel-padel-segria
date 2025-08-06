import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const supabase = createClient();

		// Get the current user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		// Check if user is admin
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (profileError || !userProfile?.is_admin) {
			return NextResponse.json(
				{
					error:
						"Accés denegat. Només els administradors poden accedir a aquesta informació.",
				},
				{ status: 403 }
			);
		}

		// Get pagination parameters from URL
		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "10");
		const search = url.searchParams.get("search") || "";

		// Calculate offset
		const offset = (page - 1) * limit;

		// Build query for users
		let query = supabase.from("users").select(
			`
				id,
				email,
				name,
				surname,
				phone,
				is_admin,
				score,
				matches_played,
				skill_level,
				created_at,
				updated_at
				`,
			{ count: "exact" }
		);

		// Add search filter if provided
		if (search) {
			query = query.or(
				`name.ilike.%${search}%,surname.ilike.%${search}%,email.ilike.%${search}%`
			);
		}

		// Add pagination
		query = query
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		const { data: users, error: usersError, count } = await query;

		if (usersError) {
			console.error("Error fetching users:", usersError);
			return NextResponse.json(
				{ error: "Error obtenint la llista d'usuaris" },
				{ status: 500 }
			);
		}

		// Calculate pagination info
		const totalPages = Math.ceil((count || 0) / limit);
		const hasMore = page < totalPages;

		return NextResponse.json({
			users: users || [],
			pagination: {
				currentPage: page,
				totalPages,
				totalUsers: count || 0,
				hasMore,
				limit,
			},
		});
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
