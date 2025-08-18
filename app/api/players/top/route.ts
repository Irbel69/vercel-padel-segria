import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/libs/supabase/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";

export interface TopPlayer {
	id: string;
	name: string | null;
	surname: string | null;
	score: number;
	avatar_url: string | null;
	rank: number;
	isChampion: boolean;
	qualities: Array<{
		id: number;
		name: string;
	}>;
}

async function handler(req: NextRequest) {
	try {
		const supabase = createPublicClient();

		// Obtener los top 3 jugadores ordenados por score CON sus cualidades
		const { data: topUsersWithQualities, error: usersError } = await supabase
			.from("users")
			.select(`
				id, 
				name, 
				surname, 
				score, 
				avatar_url,
				user_qualities (
					quality_id,
					assigned_at,
					qualities (
						id,
						name
					)
				)
			`)
			.order("score", { ascending: false })
			.limit(3);

		if (usersError) {
			console.error("Error fetching top users:", usersError);
			throw new Error(usersError.message);
		}

		if (!topUsersWithQualities || topUsersWithQualities.length === 0) {
			return NextResponse.json({
				players: [],
				message: "No players found"
			});
		}

		console.log("Raw data from Supabase:", JSON.stringify(topUsersWithQualities, null, 2));

		// Transformar los datos al formato esperado
		const playersWithQualities: TopPlayer[] = topUsersWithQualities.map((user, index) => {
			// Extraer y transformar las cualidades
			const qualities = (user.user_qualities || []).map((uq: any) => ({
				id: uq.qualities?.id || 0,
				name: uq.qualities?.name || ""
			})).filter((q: any) => q.name); // Filtrar cualidades válidas

			console.log(`User ${user.name} qualities:`, qualities);

			return {
				id: user.id,
				name: user.name,
				surname: user.surname,
				score: user.score || 0,
				avatar_url: user.avatar_url,
				rank: index + 1,
				isChampion: index === 0, // El primer puesto es el campeón
				qualities
			};
		});

		const response = NextResponse.json({
			players: playersWithQualities,
			totalPlayers: playersWithQualities.length
		});

		// Add cache headers (short s-maxage to keep performance but allow quick updates)
		// short cache so changes propagate quickly (60s). Admin updates will also call revalidatePath.
		response.headers.set(
			"Cache-Control",
			"public, s-maxage=60, stale-while-revalidate=30"
		);

		return response;

	} catch (error) {
		console.error("Error al obtener top players:", error);
		return NextResponse.json(
			{ error: "Error al obtener top players" },
			{ status: 500 }
		);
	}
}

// Apply rate limiting to the GET handler
export const GET = withRateLimit('default', handler);