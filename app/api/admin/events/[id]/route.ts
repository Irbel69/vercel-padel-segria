import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { CreateEventData } from "@/types";

// GET /api/admin/events/[id] - Obtener evento específico
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
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

		const eventId = parseInt(params.id);

		// Obtener el evento
		const { data: event, error } = await supabase
			.from("events")
			.select("*")
			.eq("id", eventId)
			.single();

		if (error || !event) {
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
			);
		}

		// Obtener número de participantes
		const { count: participantCount } = await supabase
			.from("registrations")
			.select("*", { count: "exact", head: true })
			.eq("event_id", eventId)
			.eq("status", "confirmed");

		// Obtener lista de participantes
		const { data: registrations } = await supabase
			.from("registrations")
			.select(
				`
				*,
				users!inner(id, name, surname, email, avatar_url)
			`
			)
			.eq("event_id", eventId)
			.eq("status", "confirmed");

		return NextResponse.json({
			...event,
			current_participants: participantCount || 0,
			participants: registrations || [],
		});
	} catch (error) {
		console.error("Error in GET /api/admin/events/[id]:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// PUT /api/admin/events/[id] - Actualizar evento
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
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

		const eventId = parseInt(params.id);
		const body: CreateEventData = await request.json();

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

		// Verificar que el evento existe
		const { data: existingEvent, error: fetchError } = await supabase
			.from("events")
			.select("*")
			.eq("id", eventId)
			.single();

		if (fetchError || !existingEvent) {
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
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

		// Actualizar el evento
		const { data: updatedEvent, error: updateError } = await supabase
			.from("events")
			.update({
				title: body.title,
				date: body.date,
				location: body.location || null,
				latitude: body.latitude || null,
				longitude: body.longitude || null,
				prizes: body.prizes || null,
				max_participants: body.max_participants,
				registration_deadline: body.registration_deadline,
				status,
				updated_at: new Date().toISOString(),
			})
			.eq("id", eventId)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating event:", updateError);
			return NextResponse.json(
				{ error: "Error actualitzant l'esdeveniment" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: "Esdeveniment actualitzat amb èxit",
			data: updatedEvent,
		});
	} catch (error) {
		console.error("Error in PUT /api/admin/events/[id]:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// DELETE /api/admin/events/[id] - Eliminar evento
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
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

		const eventId = parseInt(params.id);

		// Verificar que el evento existe
		const { data: existingEvent, error: fetchError } = await supabase
			.from("events")
			.select("*")
			.eq("id", eventId)
			.single();

		if (fetchError || !existingEvent) {
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
			);
		}

		// Verificar si hay inscripciones (de cualquier estado)
		const { count: totalRegistrations } = await supabase
			.from("registrations")
			.select("*", { count: "exact", head: true })
			.eq("event_id", eventId);

		// Obtener el parámetro force desde la query string
		const url = new URL(request.url);
		const force = url.searchParams.get("force") === "true";

		// Si hay inscripciones y no se ha forzado la eliminación
		if (totalRegistrations && totalRegistrations > 0 && !force) {
			return NextResponse.json(
				{
					error: "tournament_has_registrations",
					registrations_count: totalRegistrations,
					message: "Aquest torneig té inscripcions. Utilitzeu el paràmetre 'force' per eliminar-lo.",
				},
				{ status: 400 }
			);
		}

		// Eliminar todas las inscripciones primero (si las hay)
		if (totalRegistrations && totalRegistrations > 0) {
			const { error: deleteRegistrationsError } = await supabase
				.from("registrations")
				.delete()
				.eq("event_id", eventId);

			if (deleteRegistrationsError) {
				console.error("Error deleting registrations:", deleteRegistrationsError);
				return NextResponse.json(
					{ error: "Error eliminant les inscripcions" },
					{ status: 500 }
				);
			}
		}

		// Eliminar el evento
		const { error: deleteError } = await supabase
			.from("events")
			.delete()
			.eq("id", eventId);

		if (deleteError) {
			console.error("Error deleting event:", deleteError);
			return NextResponse.json(
				{ error: "Error eliminant l'esdeveniment" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: "Esdeveniment eliminat amb èxit",
			deleted_registrations: totalRegistrations || 0,
		});
	} catch (error) {
		console.error("Error in DELETE /api/admin/events/[id]:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
