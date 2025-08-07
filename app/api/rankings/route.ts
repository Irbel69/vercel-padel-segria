import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET() {
	try {
		const supabase = createClient();

		// Obtener todos los partidos con información de usuarios
		const { data: matches, error: matchesError } = await supabase.from(
			"matches"
		).select(`
        id,
        winner_pair,
        user_matches (
          position,
          user_id
        )
      `);

		if (matchesError) throw new Error(matchesError.message);

		// Obtener todos los usuarios
		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("id, name, surname, avatar_url, trend");

		if (usersError) throw new Error(usersError.message);

		// Calcular puntuaciones: 10 puntos por partido ganado, 3 puntos por partido perdido
		const playerStats = users.reduce((acc: any, user) => {
			acc[user.id] = {
				id: user.id,
				name: user.name,
				surname: user.surname,
				avatar_url: user.avatar_url,
				trend: user.trend,
				matches_played: 0,
				matches_won: 0,
				points: 0,
			};
			return acc;
		}, {});

		// Procesar todos los partidos
		matches.forEach((match) => {
			const userMatches = match.user_matches || [];

			userMatches.forEach((um) => {
				// Determinar si este usuario está en el par ganador
				const userPosition = um.position;
				const isInPair1 = userPosition === 1 || userPosition === 3;
				const isInPair2 = userPosition === 2 || userPosition === 4;
				const userPair = isInPair1 ? 1 : isInPair2 ? 2 : null;

				// Si el usuario existe en nuestras estadísticas
				if (playerStats[um.user_id]) {
					// Incrementar partidos jugados
					playerStats[um.user_id].matches_played += 1;

					// Comprobar si ganó
					if (match.winner_pair && match.winner_pair === userPair) {
						// Partido ganado: 10 puntos
						playerStats[um.user_id].matches_won += 1;
						playerStats[um.user_id].points += 10;
					} else if (match.winner_pair) {
						// Partido perdido: 3 puntos
						playerStats[um.user_id].points += 3;
					}
					// Si winner_pair es null, no se asignan puntos (partido sin resultado)
				}
			});
		});

		// Convertir a array y ordenar por puntos
		const rankings = Object.values(playerStats)
			.sort((a: any, b: any) => b.points - a.points)
			.map((player: any, index: number) => ({
				...player,
				position: index + 1,
			}));

		return NextResponse.json(
			{
				rankings,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error al obtener rankings:", error);
		return NextResponse.json(
			{ error: "Error al obtener rankings" },
			{ status: 500 }
		);
	}
}
