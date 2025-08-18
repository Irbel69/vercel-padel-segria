import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/libs/supabase/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";

async function handler(req: NextRequest) {
	try {
		const supabase = createPublicClient();

		const { searchParams } = new URL(req.url);
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");

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

		const players = (data || []).map((u, idx) => ({
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

			const res = NextResponse.json(
			{
				players,
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
