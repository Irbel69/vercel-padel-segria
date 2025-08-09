import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createClient();
		const eventId = parseInt(params.id);

		if (isNaN(eventId)) {
			return NextResponse.json(
				{ error: "ID d'esdeveniment invàlid" },
				{ status: 400 }
			);
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

		// Verify event exists
		const { data: event, error: eventError } = await supabase
			.from("events")
			.select("id, title")
			.eq("id", eventId)
			.single();

		if (eventError || !event) {
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
			);
		}

		// Get matches for this event with user information
		const { data: matches, error: matchesError } = await supabase
			.from("matches")
			.select(
				`
					id,
					event_id,
					winner_pair,
					match_date,
					created_at,
					user_matches (
						position,
						users (
							id,
							name,
							surname,
							avatar_url
						)
					)
				`
			)
			.eq("event_id", eventId)
			.order("created_at", { ascending: true });

		if (matchesError) {
			console.error("Error fetching matches:", matchesError);
			return NextResponse.json(
				{ error: "Error carregant els partits" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			event,
			matches: matches || [],
		});
	} catch (error) {
		console.error("Error in GET /api/admin/events/[id]/matches:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createClient();
		const eventId = parseInt(params.id);

		if (isNaN(eventId)) {
			return NextResponse.json(
				{ error: "ID d'esdeveniment invàlid" },
				{ status: 400 }
			);
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

		// Verify event exists
		const { data: event, error: eventError } = await supabase
			.from("events")
			.select("id")
			.eq("id", eventId)
			.single();

		if (eventError || !event) {
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
			);
		}

		const body = await request.json();
		const { players, winner_pair } = body;

		// Validate input
		if (
			!players ||
			!Array.isArray(players) ||
			players.length < 1 ||
			players.length > 4
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

		// Create match
		const { data: match, error: matchError } = await supabase
			.from("matches")
			.insert({
				event_id: eventId,
				winner_pair: winner_pair || null,
			})
			.select()
			.single();

		if (matchError || !match) {
			console.error("Error creating match:", matchError);
			return NextResponse.json(
				{ error: "Error creant el partit" },
				{ status: 500 }
			);
		}

		// Create user_matches entries
		const userMatches = players.map((playerId: string, index: number) => ({
			match_id: match.id,
			user_id: playerId,
			position: index + 1,
		}));

		const { error: userMatchesError } = await supabase
			.from("user_matches")
			.insert(userMatches);

		if (userMatchesError) {
			console.error("Error creating user matches:", userMatchesError);
			// Clean up the match if user_matches creation fails
			await supabase.from("matches").delete().eq("id", match.id);
			return NextResponse.json(
				{ error: "Error assignant jugadors al partit" },
				{ status: 500 }
			);
		}

		// If winner_pair is provided, update users' scores
		if (winner_pair === 1 || winner_pair === 2) {
			// Get all players for score distribution
			const allPlayerIds = players;
			const numPlayers = allPlayerIds.length;

			if (numPlayers === 4) {
				// Traditional 4-player logic: positions 1 & 3 => pair 1, positions 2 & 4 => pair 2
				const winnerIndices = winner_pair === 1 ? [0, 2] : [1, 3];
				const loserIndices = winner_pair === 1 ? [1, 3] : [0, 2];
				const winnerIds = winnerIndices.map((i) => players[i]);
				const loserIds = loserIndices.map((i) => players[i]);

				// Fetch current scores and apply points
				const [{ data: winnerUsers }, { data: loserUsers }] = await Promise.all(
					[
						supabase.from("users").select("id, score").in("id", winnerIds),
						supabase.from("users").select("id, score").in("id", loserIds),
					]
				);

				if (winnerUsers) {
					for (const wu of winnerUsers) {
						const newScore = (wu.score || 0) + 10;
						await supabase
							.from("users")
							.update({ score: newScore })
							.eq("id", wu.id);
					}
				}
				if (loserUsers) {
					for (const lu of loserUsers) {
						const newScore = (lu.score || 0) + 3;
						await supabase
							.from("users")
							.update({ score: newScore })
							.eq("id", lu.id);
					}
				}
			} else {
				// For less than 4 players, award points based on pair positions but with reduced logic
				// Still use position-based pairing but be flexible with missing players
				const pair1Players = [];
				const pair2Players = [];

				// Distribute existing players into pairs based on their positions
				for (let i = 0; i < players.length; i++) {
					const position = i + 1; // positions are 1-indexed
					if (position === 1 || position === 3) {
						pair1Players.push(players[i]);
					} else if (position === 2 || position === 4) {
						pair2Players.push(players[i]);
					}
				}

				const winnerIds = winner_pair === 1 ? pair1Players : pair2Players;
				const loserIds = winner_pair === 1 ? pair2Players : pair1Players;

				// Award points to winners and participation points to losers
				if (winnerIds.length > 0) {
					const { data: winnerUsers } = await supabase
						.from("users")
						.select("id, score")
						.in("id", winnerIds);

					if (winnerUsers) {
						for (const wu of winnerUsers) {
							const newScore = (wu.score || 0) + 10;
							await supabase
								.from("users")
								.update({ score: newScore })
								.eq("id", wu.id);
						}
					}
				}

				if (loserIds.length > 0) {
					const { data: loserUsers } = await supabase
						.from("users")
						.select("id, score")
						.in("id", loserIds);

					if (loserUsers) {
						for (const lu of loserUsers) {
							const newScore = (lu.score || 0) + 3;
							await supabase
								.from("users")
								.update({ score: newScore })
								.eq("id", lu.id);
						}
					}
				}
			}
		}

		return NextResponse.json(
			{
				message: "Partit creat correctament",
				match: {
					id: match.id,
					event_id: match.event_id,
					winner_pair: match.winner_pair,
					match_date: match.match_date,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error in POST /api/admin/events/[id]/matches:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
