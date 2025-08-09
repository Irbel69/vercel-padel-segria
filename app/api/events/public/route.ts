import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { Event } from "@/types";

// GET /api/events/public - Lista eventos públicos para la landing page (sin autenticación)
export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();

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

		return NextResponse.json({
			events: eventsWithDetails,
			success: true,
		});
	} catch (error) {
		console.error("Error in GET /api/events/public:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
