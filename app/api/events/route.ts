import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { EventsListResponse } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/events - Lista eventos disponibles para usuarios
export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();

		// Verificar autenticación
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "10");
		const status = url.searchParams.get("status") || "";

		const offset = (page - 1) * limit;

		// Construir query base - solo eventos futuros
		let query = supabase
			.from("events")
			.select("*", { count: "exact" })
			.gte("date", new Date().toISOString().split("T")[0]); // Solo eventos futuros

		// Filtrar por estado si se especifica
		if (status && ["open", "soon", "closed"].includes(status)) {
			query = query.eq("status", status);
		}

		// Aplicar paginación y ordenamiento
		query = query
			.order("date", { ascending: true })
			.range(offset, offset + limit - 1);

		const { data: events, error, count } = await query;

		if (error) {
			console.error("Error fetching events:", error);
			return NextResponse.json(
				{ error: "Error carregant els esdeveniments" },
				{ status: 500 }
			);
		}

		// Obtener información de participantes y registro del usuario para cada evento
		const eventsWithDetails = await Promise.all(
			(events || []).map(async (event) => {
				// Contar participantes confirmados
				const { count: participantCount } = await supabase
					.from("registrations")
					.select("*", { count: "exact", head: true })
					.eq("event_id", event.id)
					.eq("status", "confirmed");

				// Verificar si el usuario actual está registrado
				const { data: userRegistration } = await supabase
					.from("registrations")
					.select("status, pair_id")
					.eq("event_id", event.id)
					.eq("user_id", user.id)
					.single();

				// Si hay pair_id, buscar información del compañero
				let partner = null;
				if (userRegistration?.pair_id) {
					const { data: partnerReg } = await supabase
						.from("registrations")
						.select(`
							user_id,
							users!inner(
								id,
								name,
								surname,
								avatar_url
							)
						`)
						.eq("pair_id", userRegistration.pair_id)
						.neq("user_id", user.id)
						.single();

					if (partnerReg && partnerReg.users) {
						partner = partnerReg.users;
					}
				}

				return {
					...event,
					current_participants: participantCount || 0,
					user_registration_status: userRegistration?.status || null,
					partner,
				};
			})
		);

		const totalEvents = count || 0;
		const totalPages = Math.ceil(totalEvents / limit);
		const hasMore = page < totalPages;

		const response: EventsListResponse = {
			events: eventsWithDetails,
			pagination: {
				currentPage: page,
				totalPages,
				totalEvents,
				hasMore,
				limit,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error in GET /api/events:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
