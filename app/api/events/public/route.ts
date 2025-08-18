import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/libs/supabase/server";
import type { Event } from "@/types";
import { withRateLimit } from "@/libs/rate-limiter-middleware";

// GET /api/events/public - Lista eventos públicos para la landing page (sin autenticación)
async function handler(request: NextRequest) {
	try {
		const supabase = createPublicClient();

		const url = new URL(request.url);
		const limit = parseInt(url.searchParams.get("limit") || "4");

		// Obtener eventos futuros públicos
		const { data: events, error } = await supabase
			.from("events")
			.select("*")
			.gte("date", new Date().toISOString().split("T")[0]) // Solo eventos futuros
			.eq("status", "open") // Solo eventos abiertos para la landing
			.order("date", { ascending: true })
			.limit(limit);

		if (error) {
			console.error("Error fetching public events:", error);
			return NextResponse.json(
				{ error: "Error carregant els esdeveniments" },
				{ status: 500 }
			);
		}

		// Obtener información de participantes para cada evento
		const eventsWithDetails = await Promise.all(
			(events || []).map(async (event) => {
				// Contar participantes confirmados
				const { count: participantCount } = await supabase
					.from("registrations")
					.select("*", { count: "exact", head: true })
					.eq("event_id", event.id)
					.eq("status", "confirmed");

				return {
					...event,
					current_participants: participantCount || 0,
				};
			})
		);

			const res = NextResponse.json({
				events: eventsWithDetails,
				success: true,
			});
			res.headers.set(
				"Cache-Control",
				"public, s-maxage=60, stale-while-revalidate=30"
			);
			return res;
	} catch (error) {
		console.error("Error in GET /api/events/public:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// Apply rate limiting to the GET handler
export const GET = withRateLimit('events', handler);
