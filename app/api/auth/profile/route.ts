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

		// Check if user profile exists
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select(
				"id, email, name, surname, phone, observations, avatar_url, is_admin, score, matches_played, skill_level, trend, image_rights_accepted, privacy_policy_accepted, created_at"
			)
			.eq("id", user.id)
			.single();
		if (profileError && profileError.code !== "PGRST116") {
			// PGRST116 = no rows returned
			console.error("Error fetching user profile:", profileError);
			return NextResponse.json(
				{ error: "Error obtenint el perfil" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
				profile: userProfile || null,
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
