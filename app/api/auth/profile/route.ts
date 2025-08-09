import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
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
				"id, email, name, surname, phone, observations, avatar_url, is_admin, skill_level, trend, image_rights_accepted, privacy_policy_accepted, created_at"
			)
			.eq("id", user.id)
			.single();

		if (profileError) {
			console.error("Error fetching user profile:", profileError);
			if (profileError.code === "PGRST116") {
				// User profile not found - return user without profile
				return NextResponse.json({
					user: {
						id: user.id,
						email: user.email,
						profile: null,
					},
				});
			}
			// For other errors, return error
			return NextResponse.json(
				{ error: "Error obtenint el perfil" },
				{ status: 500 }
			);
		}

		// Calculate user score and matches played dynamically
		let score = 0;
		let matchesPlayed = 0;

		if (userProfile) {
			// Get all matches for this user
			const { data: userMatches, error: matchesError } = await supabase
				.from("user_matches")
				.select(
					`
					match_id,
					matches!inner(
						id,
						winner_id
					)
				`
				)
				.eq("user_id", user.id);

			if (!matchesError && userMatches) {
				matchesPlayed = userMatches.length;

				// Calculate score based on wins/losses
				userMatches.forEach((userMatch) => {
					const match = userMatch.matches as any;
					if (match.winner_id === user.id) {
						// User won: 10 points
						score += 10;
					} else {
						// User lost: 3 points
						score += 3;
					}
				});
			}
		}

		return NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
						profile: userProfile
					? {
							...userProfile,
							score,
							matches_played: matchesPlayed,
						}
					: null,
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
