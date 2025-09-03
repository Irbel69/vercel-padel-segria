import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { Event, EventsListResponse, CreateEventData } from "@/types";

// GET /api/admin/events - Lista todos los eventos (solo administradores)
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

		// Verificar si es administrador
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (profileError || !userProfile?.is_admin) {
			return NextResponse.json(
				{ error: "Accés denegat. Només administradors." },
				{ status: 403 }
			);
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "10");
		const search = url.searchParams.get("search") || "";

		const offset = (page - 1) * limit;

		// Construir query base
		let query = supabase.from("events").select("*", { count: "exact" });

		// Añadir filtro de búsqueda si existe
		if (search) {
			query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
		}

		// Aplicar paginación y ordenamiento
		query = query
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		const { data: events, error, count } = await query;

		if (error) {
			console.error("Error fetching events:", error);
			return NextResponse.json(
				{ error: "Error carregant els esdeveniments" },
				{ status: 500 }
			);
		}

		// Obtener número de participantes para cada evento
		const eventsWithParticipants = await Promise.all(
			(events || []).map(async (event) => {
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

		const totalEvents = count || 0;
		const totalPages = Math.ceil(totalEvents / limit);
		const hasMore = page < totalPages;

		const response: EventsListResponse = {
			events: eventsWithParticipants,
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
		console.error("Error in GET /api/admin/events:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// POST /api/admin/events - Crear nuevo evento (solo administradores)
export async function POST(request: NextRequest) {
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

		// Verificar si es administrador
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (profileError || !userProfile?.is_admin) {
			return NextResponse.json(
				{ error: "Accés denegat. Només administradors." },
				{ status: 403 }
			);
		}

		const body: CreateEventData = await request.json();

			console.debug("[POST /api/admin/events] incoming body", {
			// Only log non-sensitive fields
			title: body.title,
			date: body.date,
			location: body.location,
			max_participants: body.max_participants,
			registration_deadline: body.registration_deadline,
				pair_required: Object.prototype.hasOwnProperty.call(body, "pair_required") ? body.pair_required : undefined,
			image_url_present: Object.prototype.hasOwnProperty.call(body, "image_url"),
			image_url: body.image_url ?? null,
		});

		// Validar datos requeridos
		if (
			!body.title ||
			!body.date ||
			!body.registration_deadline ||
			!body.max_participants
		) {
			return NextResponse.json(
				{ error: "Falten dades obligatòries" },
				{ status: 400 }
			);
		}

		// Validar coordenadas si se proporcionan
		if (
			(body.latitude && !body.longitude) ||
			(!body.latitude && body.longitude)
		) {
			return NextResponse.json(
				{
					error:
						"Si es proporcionen coordenades, cal especificar tant la latitud com la longitud",
				},
				{ status: 400 }
			);
		}

		// Validar que la fecha límite sea anterior a la fecha del evento
		const eventDate = new Date(body.date);
		const deadlineDate = new Date(body.registration_deadline);

		if (deadlineDate >= eventDate) {
			return NextResponse.json(
				{
					error:
						"La data límit d'inscripció ha de ser anterior a la data de l'esdeveniment",
				},
				{ status: 400 }
			);
		}

		// Determinar el estado basado en la fecha límite
		const now = new Date();
		let status: "open" | "soon" | "closed" = "open";

		if (deadlineDate <= now) {
			status = "closed";
		} else if (eventDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
			// Una semana antes
			status = "soon";
		}

		// Crear el evento
			const { data: newEvent, error: insertError } = await supabase
			.from("events")
			.insert([
				{
					title: body.title,
					date: body.date,
					location: body.location || null,
					latitude: body.latitude || null,
					longitude: body.longitude || null,
					prizes: body.prizes || null,
					max_participants: body.max_participants,
					registration_deadline: body.registration_deadline,
					status,
						pair_required: typeof body.pair_required === "boolean" ? body.pair_required : true,
					image_url: body.image_url || null,
				},
			])
			.select()
			.single();

		if (insertError) {
			console.error("[POST /api/admin/events] Error creating event:", insertError);
			return NextResponse.json(
				{ error: "Error creant l'esdeveniment" },
				{ status: 500 }
			);
		}

		console.debug("[POST /api/admin/events] created event", {
			id: newEvent?.id,
			image_url: newEvent?.image_url ?? null,
		});

		return NextResponse.json({
			message: "Esdeveniment creat amb èxit",
			data: { ...newEvent, current_participants: 0 },
		});
	} catch (error) {
		console.error("Error in POST /api/admin/events:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
