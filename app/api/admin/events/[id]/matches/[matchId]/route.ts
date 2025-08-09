import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string; matchId: string } }
) {
	try {
		const supabase = createClient();
		const eventId = parseInt(params.id);
		const matchId = parseInt(params.matchId);

		if (isNaN(eventId) || isNaN(matchId)) {
			return NextResponse.json({ error: "IDs invàlids" }, { status: 400 });
		}

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

		const body = await request.json();
		const { players, winner_pair } = body;

		// Validate input
		if (
			players &&
			(!Array.isArray(players) || players.length < 1 || players.length > 4)
		) {
			return NextResponse.json(
				{ error: "Cal especificar entre 1 i 4 jugadors" },
				{ status: 400 }
			);
		}

		if (winner_pair && ![1, 2].includes(winner_pair)) {
			return NextResponse.json(
				{ error: "La parella guanyadora ha de ser 1 o 2" },
				{ status: 400 }
			);
		}

		// Verify match exists and belongs to this event
		const { data: match, error: matchError } = await supabase
			.from("matches")
			.select("id, event_id, winner_pair")
			.eq("id", matchId)
			.eq("event_id", eventId)
			.single();

		if (matchError || !match) {
			return NextResponse.json({ error: "Partit no trobat" }, { status: 404 });
		}

		// If players are provided, validate and update them
		if (players) {
			// Check if all players exist
			const { data: existingUsers, error: usersError } = await supabase
				.from("users")
				.select("id")
				.in("id", players);

			if (
				usersError ||
				!existingUsers ||
				existingUsers.length !== players.length
			) {
				return NextResponse.json(
					{ error: "Algun dels jugadors especificats no existeix" },
					{ status: 400 }
				);
			}

			// Check for duplicate players
			const uniquePlayers = new Set(players);
			if (uniquePlayers.size !== players.length) {
				return NextResponse.json(
					{ error: "No es pot repetir el mateix jugador" },
					{ status: 400 }
				);
			}

			// Delete existing user_matches
			const { error: deleteError } = await supabase
				.from("user_matches")
				.delete()
				.eq("match_id", matchId);

			if (deleteError) {
				console.error("Error deleting existing user matches:", deleteError);
				return NextResponse.json(
					{ error: "Error actualitzant els jugadors" },
					{ status: 500 }
				);
			}

			// Create new user_matches entries
			const userMatches = players.map((playerId: string, index: number) => ({
				match_id: matchId,
				user_id: playerId,
				position: index + 1,
			}));

			const { error: userMatchesError } = await supabase
				.from("user_matches")
				.insert(userMatches);

			if (userMatchesError) {
				console.error("Error creating user matches:", userMatchesError);
				return NextResponse.json(
					{ error: "Error assignant jugadors al partit" },
					{ status: 500 }
				);
			}
		}

		// Update match (winner_pair)
		const updateData: any = {};
		if (winner_pair !== undefined) {
			updateData.winner_pair = winner_pair;
		}
		updateData.updated_at = new Date().toISOString();

		const { error: updateError } = await supabase
			.from("matches")
			.update(updateData)
			.eq("id", matchId);

		if (updateError) {
			console.error("Error updating match:", updateError);
			return NextResponse.json(
				{ error: "Error actualitzant el partit" },
				{ status: 500 }
			);
		}

		// If winner_pair provided, adjust scores based on previous vs new winner
		if (winner_pair === 1 || winner_pair === 2) {
			// Get current players for this match ordered by position
			const { data: um } = await supabase
				.from("user_matches")
				.select("user_id, position")
				.eq("match_id", matchId)
				.order("position", { ascending: true });

			if (um && um.length > 0) {
				const playerIds = um.map((row: any) => row.user_id);
				const numPlayers = playerIds.length;

				// Helper to apply delta to a list of user ids
				const applyDelta = async (ids: string[], delta: number) => {
					if (ids.length === 0) return;
					const { data: users } = await supabase
						.from("users")
						.select("id, score")
						.in("id", ids);
					if (!users) return;
					for (const u of users) {
						const newScore = (u.score || 0) + delta;
						await supabase
							.from("users")
							.update({ score: newScore })
							.eq("id", u.id);
					}
				};

				// Get pair groups based on positions
				const getPairGroups = (playerIds: string[], userMatches: any[]) => {
					const pair1 = [];
					const pair2 = [];

					for (const userMatch of userMatches) {
						const position = userMatch.position;
						if (position === 1 || position === 3) {
							pair1.push(userMatch.user_id);
						} else if (position === 2 || position === 4) {
							pair2.push(userMatch.user_id);
						}
					}

					return { pair1, pair2 };
				};

				const { pair1, pair2 } = getPairGroups(playerIds, um);

				// If previous winner exists and changed, revert previous points
				if (match.winner_pair === 1 || match.winner_pair === 2) {
					if (match.winner_pair !== winner_pair) {
						const prevWinnerIds = match.winner_pair === 1 ? pair1 : pair2;
						const prevLoserIds = match.winner_pair === 1 ? pair2 : pair1;
						await applyDelta(prevWinnerIds, -10);
						await applyDelta(prevLoserIds, -3);
					}
				}

				// Apply new points if no previous winner, or always apply if changed
				const newWinnerIds = winner_pair === 1 ? pair1 : pair2;
				const newLoserIds = winner_pair === 1 ? pair2 : pair1;

				// If previous winner is same as new, skip re-applying
				if (match.winner_pair !== winner_pair) {
					await applyDelta(newWinnerIds, +10);
					await applyDelta(newLoserIds, +3);
				}
			}
		}

		return NextResponse.json({
			message: "Partit actualitzat correctament",
		});
	} catch (error) {
		console.error(
			"Error in PUT /api/admin/events/[id]/matches/[matchId]:",
			error
		);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string; matchId: string } }
) {
	try {
		const supabase = createClient();
		const eventId = parseInt(params.id);
		const matchId = parseInt(params.matchId);

		if (isNaN(eventId) || isNaN(matchId)) {
			return NextResponse.json({ error: "IDs invàlids" }, { status: 400 });
		}

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

		// Verify match exists and belongs to this event
		const { data: match, error: matchError } = await supabase
			.from("matches")
			.select("id")
			.eq("id", matchId)
			.eq("event_id", eventId)
			.single();

		if (matchError || !match) {
			return NextResponse.json({ error: "Partit no trobat" }, { status: 404 });
		}

		// Delete match (cascade will handle user_matches)
		const { error: deleteError } = await supabase
			.from("matches")
			.delete()
			.eq("id", matchId);

		if (deleteError) {
			console.error("Error deleting match:", deleteError);
			return NextResponse.json(
				{ error: "Error eliminant el partit" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: "Partit eliminat correctament",
		});
	} catch (error) {
		console.error(
			"Error in DELETE /api/admin/events/[id]/matches/[matchId]:",
			error
		);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
