import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/libs/supabase/service";
import { withRateLimit } from "@/libs/rate-limiter-middleware";

type RecentFormEntry = 'W' | 'L';

async function handler(req: NextRequest) {
	try {
	// Use server-only service client to avoid RLS issues on public endpoint
	const supabase = createServiceClient();

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
					.select("id, name, surname, avatar_url, score", { count: "exact" })
			.order("score", { ascending: false })
			.range(from, to);

		if (error) throw new Error(error.message);

			const pageUsers = data || [];
			const basePlayers = pageUsers.map((u, idx) => ({
			id: u.id,
			name: u.name ?? null,
			surname: u.surname ?? null,
			avatar_url: u.avatar_url ?? null,
			total_points: u.score ?? 0,
			ranking_position: from + idx + 1,
		}));

		// Enrich with recent form (last 5 results) and optional aggregates
		const pageUserIds = basePlayers.map((p) => p.id);

		const fetchAggregatesForUsers = async (userIds: string[]) => {
			if (userIds.length === 0) return { played: new Map<string, number>(), won: new Map<string, number>() };
			const { data: aggRows, error: aggErr } = await supabase
				.from('user_matches')
				.select('user_id, position, matches!inner(winner_pair, match_date)')
				.in('user_id', userIds);
			if (aggErr) {
				console.warn('Aggregates query error (non-fatal):', aggErr.message);
				return { played: new Map(), won: new Map() };
			}
			const played = new Map<string, number>();
			const won = new Map<string, number>();
			for (const row of aggRows ?? []) {
				const uid = row.user_id as string;
				played.set(uid, (played.get(uid) ?? 0) + 1);
				const pos = Number(row.position);
				const winner = (row as any).matches?.winner_pair as 1 | 2 | null;
				if (winner === 1 || winner === 2) {
					// Pair mapping: positions 1 & 3 = pair 1, positions 2 & 4 = pair 2
					const isPair1 = pos === 1 || pos === 3;
					const isWin = (isPair1 && winner === 1) || (!isPair1 && winner === 2);
					if (isWin) won.set(uid, (won.get(uid) ?? 0) + 1);
				}
			}
			return { played, won };
		}

		const fetchRecentFormForUsers = async (userIds: string[], perUser: number = 5) => {
			if (userIds.length === 0) return new Map<string, RecentFormEntry[]>();
			// Pull a reasonable cap to avoid huge payloads: 10 per user, then group in code
			const cap = Math.max(perUser, 10) * userIds.length;
			const { data: rmRows, error: rmErr } = await supabase
				.from('user_matches')
				.select('user_id, position, matches!inner(winner_pair, match_date)')
				.in('user_id', userIds)
				.order('match_date', { foreignTable: 'matches', ascending: false })
				.limit(cap);
			if (rmErr) {
				console.warn('Recent form query error (non-fatal):', rmErr.message);
				return new Map();
			}
			const map = new Map<string, RecentFormEntry[]>();
			for (const row of rmRows ?? []) {
				const uid = row.user_id as string;
				const pos = Number(row.position);
				const winner = (row as any).matches?.winner_pair as 1 | 2 | null;
				if (winner !== 1 && winner !== 2) continue; // skip matches without a winner
				// Pair mapping: positions 1 & 3 = pair 1, positions 2 & 4 = pair 2
				const isPair1 = pos === 1 || pos === 3;
				const isWin = (isPair1 && winner === 1) || (!isPair1 && winner === 2);
				const list = map.get(uid) ?? [];
				if (list.length < perUser) {
					list.push(isWin ? 'W' : 'L');
					map.set(uid, list);
				}
			}
			return map;
		}

		const [aggs, forms] = await Promise.all([
			fetchAggregatesForUsers(pageUserIds),
			fetchRecentFormForUsers(pageUserIds, 5)
		]);

		const players = basePlayers.map((p) => ({
			...p,
			recent_form: forms.get(p.id) ?? [],
			matches_played: aggs.played.get(p.id) ?? 0,
			matches_won: aggs.won.get(p.id) ?? 0,
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
						.select("id, name, surname, avatar_url, score")
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
								.select("id, name, surname, avatar_url, score")
								.gt("score", userScore)
								.order("score", { ascending: true })
								.limit(1);

							// Find immediate inferior (next lower score)
							const { data: inferiorData } = await supabase
								.from("users")
								.select("id, name, surname, avatar_url, score")
								.lt("score", userScore)
								.order("score", { ascending: false })
								.limit(1);

							// Map to response shape with positions
							const currentUserBase = {
								id: userData.id,
								name: userData.name ?? null,
								surname: userData.surname ?? null,
								avatar_url: userData.avatar_url ?? null,
								total_points: userScore,
								ranking_position: userPosition,
							};

							const contextIds: string[] = [userData.id];
							if (superiorData && superiorData.length > 0) contextIds.push(superiorData[0].id);
							if (inferiorData && inferiorData.length > 0) contextIds.push(inferiorData[0].id);
							const [ctxAggs, ctxForms] = await Promise.all([
								fetchAggregatesForUsers(contextIds),
								fetchRecentFormForUsers(contextIds, 5)
							]);

							const rows: typeof players = [];

							// Superior position = userPosition - 1 when exists
							if (superiorData && superiorData.length > 0) {
								const s = superiorData[0];
								rows.push({
									id: s.id,
									name: s.name ?? null,
									surname: s.surname ?? null,
									avatar_url: s.avatar_url ?? null,
									total_points: s.score ?? 0,
									ranking_position: Math.max(1, userPosition - 1),
									recent_form: ctxForms.get(s.id) ?? [],
									matches_played: ctxAggs.played.get(s.id) ?? 0,
									matches_won: ctxAggs.won.get(s.id) ?? 0,
								});
							}

							// Add current user row in the middle
							rows.push({
								...currentUserBase,
								recent_form: ctxForms.get(userData.id) ?? [],
								matches_played: ctxAggs.played.get(userData.id) ?? 0,
								matches_won: ctxAggs.won.get(userData.id) ?? 0,
							});

							// Inferior position = userPosition + 1 when exists
							if (inferiorData && inferiorData.length > 0) {
								const i = inferiorData[0];
								rows.push({
									id: i.id,
									name: i.name ?? null,
									surname: i.surname ?? null,
									avatar_url: i.avatar_url ?? null,
									total_points: i.score ?? 0,
									ranking_position: userPosition + 1,
									recent_form: ctxForms.get(i.id) ?? [],
									matches_played: ctxAggs.played.get(i.id) ?? 0,
									matches_won: ctxAggs.won.get(i.id) ?? 0,
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
