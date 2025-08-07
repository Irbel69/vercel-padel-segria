import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();

		// Check if user is authenticated and is admin
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
		}

		const { data: userProfile } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (!userProfile?.is_admin) {
			return NextResponse.json({ error: "Accés denegat" }, { status: 403 });
		}

		const url = new URL(request.url);
		const search = url.searchParams.get("search") || "";

		// Build query
		let query = supabase
			.from("users")
			.select("id, name, surname, avatar_url, score")
			.order("name", { ascending: true });

		// Add search filter if provided
		if (search) {
			query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%`);
		}

		const { data: users, error } = await query;

		if (error) {
			console.error("Error fetching users:", error);
			return NextResponse.json(
				{ error: "Error carregant els usuaris" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			users: users || [],
		});
	} catch (error) {
		console.error("Error in GET /api/admin/users/search:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
