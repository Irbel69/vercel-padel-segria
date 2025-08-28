import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/libs/supabase/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";

async function handler(req: NextRequest) {
	try {
		const supabase = createPublicClient();

		const { searchParams } = new URL(req.url);
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");
		const userId = searchParams.get("userId");

		const page = Math.max(1, Number(pageParam || 1));
		const limit = Math.max(1, Math.min(100, Number(limitParam || 10)));
		const from = (page - 1) * limit;
		const to = from + limit - 1;
		
		const { data, error, count } = await supabase
			.from("users")
				.select("id, name, surname, avatar_url, trend, score", { count: "exact" })
			.order("score", { ascending: false })
			.range(from, to);

		if (error) throw new Error(error.message);

			const pageUsers = data || [];
			const players = pageUsers.map((u, idx) => ({
			id: u.id,
			name: u.name ?? null,
			surname: u.surname ?? null,
			avatar_url: u.avatar_url ?? null,
			trend: (u.trend as "up" | "down" | "same") ?? "same",
			total_points: u.score ?? 0,
			ranking_position: from + idx + 1,
		}));

		const totalPlayers = count ?? players.length;
		const totalPages = Math.max(1, Math.ceil(totalPlayers / limit));

			// Compute context rows if userId provided and not in current page
			let contextRows: typeof players | undefined = undefined;
			if (userId) {
				const userInPage = players.find((p) => p.id === userId);
				if (!userInPage) {
					// Fetch the target user
					const { data: userData, error: userError } = await supabase
						.from("users")
						.select("id, name, surname, avatar_url, trend, score")
						.eq("id", userId)
						.maybeSingle();

					if (!userError && userData) {
						const userScore = userData.score ?? 0;

						// Compute user's absolute ranking position = count of users with score > userScore + 1
						const { count: higherCount, error: higherErr } = await supabase
							.from("users")
							.select("id", { count: "exact", head: true })
							.gt("score", userScore);

						if (!higherErr) {
							const userPosition = (higherCount ?? 0) + 1;

							// Find immediate superior (next higher score)
							const { data: superiorData } = await supabase
								.from("users")
								.select("id, name, surname, avatar_url, trend, score")
								.gt("score", userScore)
								.order("score", { ascending: true })
								.limit(1);

							// Find immediate inferior (next lower score)
							const { data: inferiorData } = await supabase
								.from("users")
								.select("id, name, surname, avatar_url, trend, score")
								.lt("score", userScore)
								.order("score", { ascending: false })
								.limit(1);

							// Map to response shape with positions
							const currentUserRow = {
								id: userData.id,
								name: userData.name ?? null,
								surname: userData.surname ?? null,
								avatar_url: userData.avatar_url ?? null,
								trend: (userData.trend as "up" | "down" | "same") ?? "same",
								total_points: userScore,
								ranking_position: userPosition,
							};

							const rows: typeof players = [];

							// Superior position = userPosition - 1 when exists
							if (superiorData && superiorData.length > 0) {
								const s = superiorData[0];
								rows.push({
									id: s.id,
									name: s.name ?? null,
									surname: s.surname ?? null,
									avatar_url: s.avatar_url ?? null,
									trend: (s.trend as "up" | "down" | "same") ?? "same",
									total_points: s.score ?? 0,
									ranking_position: Math.max(1, userPosition - 1),
								});
							}

							// Add current user row in the middle
							rows.push(currentUserRow);

							// Inferior position = userPosition + 1 when exists
							if (inferiorData && inferiorData.length > 0) {
								const i = inferiorData[0];
								rows.push({
									id: i.id,
									name: i.name ?? null,
									surname: i.surname ?? null,
									avatar_url: i.avatar_url ?? null,
									trend: (i.trend as "up" | "down" | "same") ?? "same",
									total_points: i.score ?? 0,
									ranking_position: userPosition + 1,
								});
							}

							contextRows = rows;
						}
					}
				}
			}

				const res = NextResponse.json(
			{
				players,
					...(contextRows ? { contextRows } : {}),
				pagination: {
					currentPage: page,
					totalPages,
					totalPlayers,
					hasMore: page < totalPages,
					limit,
				},
			},
			{ status: 200 }
		);
			// Add cache headers to reduce pressure and accidental rate limits
			res.headers.set(
				"Cache-Control",
				"public, s-maxage=60, stale-while-revalidate=30"
			);
			return res;
	} catch (error) {
		console.error("Error al obtenir el rànking:", error);
		return NextResponse.json(
			{ error: "Error al obtenir el rànking" },
			{ status: 500 }
		);
	}
}

// Apply rate limiting to the GET handler
export const GET = withRateLimit('rankings', handler);
