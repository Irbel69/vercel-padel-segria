import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request: NextRequest) {
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
				{ error: "Accés no autoritzat" },
				{ status: 403 }
			);
		}

		// Get all qualities
		const { data: qualities, error } = await supabase
			.from("qualities")
			.select("*")
			.order("name");

		if (error) {
			console.error("Error fetching qualities:", error);
			return NextResponse.json(
				{ error: "Error carregant les qualitats" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ qualities });
	} catch (error) {
		console.error("Error in GET /api/admin/qualities:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
