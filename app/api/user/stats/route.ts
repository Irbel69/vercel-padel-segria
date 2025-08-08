import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const supabase = createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user matches data
		const { data: userMatches, error: userMatchesError } = await supabase
			.from("user_matches")
			.select(
				`
				position,
				matches!inner (
					id,
					winner_pair,
					match_date
				)
			`
			)
			.eq("user_id", user.id);

		if (userMatchesError) {
			console.error("Error fetching user matches:", userMatchesError);
			return NextResponse.json(
				{ error: "Error fetching match data" },
				{ status: 500 }
			);
		}

		// Calculate statistics
		let matchesPlayed = 0;
		let matchesWon = 0;

		if (userMatches) {
			matchesPlayed = userMatches.length;

			// Count wins based on position and winner_pair
			// Position 1 & 3 = Pair 1, Position 2 & 4 = Pair 2
			matchesWon = userMatches.filter((userMatch: any) => {
				const userPosition = userMatch.position;
				const winnerPair = userMatch.matches.winner_pair;

				if (!winnerPair) return false;

				// Determine which pair the user belongs to
				const userPair = userPosition === 1 || userPosition === 3 ? 1 : 2;

				return userPair === winnerPair;
			}).length;
		}

		// Calculate win percentage
		const winPercentage =
			matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

		// Calculate score according to the formula: wins * 0.7 + total matches * 0.3
		const userScore =
			Math.round((matchesWon * 0.7 + matchesPlayed * 0.3) * 100) / 100;

		return NextResponse.json({
			matchesPlayed,
			matchesWon,
			winPercentage,
			userScore,
		});
	} catch (error) {
		console.error("Error in user stats API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
