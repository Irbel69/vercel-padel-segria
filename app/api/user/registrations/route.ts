import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/user/registrations - Obtener inscripciones del usuario actual
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
		const status = url.searchParams.get("status") || "";

		// Construir query base
		let query = supabase
			.from("registrations")
			.select(
				`
				*,
				events!inner(
					id,
					title,
					date,
					location,
					status,
					prizes,
					max_participants,
					registration_deadline
				)
			`
			)
			.eq("user_id", user.id);

		// Filtrar por estado si se especifica
		if (status && ["pending", "confirmed", "cancelled"].includes(status)) {
			query = query.eq("status", status);
		}

		// Ordenar por fecha del evento
		query = query.order("registered_at", { ascending: false });

		const { data: registrations, error } = await query;

		if (error) {
			console.error("Error fetching user registrations:", error);
			return NextResponse.json(
				{ error: "Error carregant les inscripcions" },
				{ status: 500 }
			);
		}

		// Añadir información de participantes actuales para cada evento y compañero
		const registrationsWithDetails = await Promise.all(
			(registrations || []).map(async (registration) => {
				const { count: currentParticipants } = await supabase
					.from("registrations")
					.select("*", { count: "exact", head: true })
					.eq("event_id", registration.event_id)
					.eq("status", "confirmed");

				// Si hay pair_id, buscar información del compañero
				let partner = null;
				if (registration.pair_id) {
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
						.eq("pair_id", registration.pair_id)
						.neq("user_id", user.id)
						.single();

					if (partnerReg && partnerReg.users) {
						partner = partnerReg.users;
					}
				}

				return {
					...registration,
					event: {
						...registration.events,
						current_participants: currentParticipants || 0,
					},
					partner,
				};
			})
		);

		return NextResponse.json({
			registrations: registrationsWithDetails,
		});
	} catch (error) {
		console.error("Error in GET /api/user/registrations:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
