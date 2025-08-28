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

		// Obtener número de participantes (incluye todos los confirmados, aunque superen el límite)
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
		const body: Partial<CreateEventData> = await request.json();

		console.debug("[PUT /api/admin/events/:id] incoming", {
			eventId,
			keys: Object.keys(body),
			image_url_present: Object.prototype.hasOwnProperty.call(body, "image_url"),
			image_url: (body as any).image_url ?? null,
		});

		// Validar datos requeridos solo si se actualizan (permite parches parciales)
		if (
			Object.prototype.hasOwnProperty.call(body, "title") && !body.title
		) {
			return NextResponse.json({ error: "El títol és obligatori" }, { status: 400 });
		}
		if (
			Object.prototype.hasOwnProperty.call(body, "max_participants") &&
			(typeof body.max_participants !== "number" || body.max_participants <= 0)
		) {
			return NextResponse.json({ error: "Màxim de participants no vàlid" }, { status: 400 });
		}

		// Validar coordenadas si se proporcionan
		if (
			(Object.prototype.hasOwnProperty.call(body, "latitude") || Object.prototype.hasOwnProperty.call(body, "longitude")) &&
			((body.latitude && !body.longitude) || (!body.latitude && body.longitude))
		) {
			return NextResponse.json(
				{
					error:
						"Si es proporcionen coordenades, cal especificar tant la latitud com la longitud",
				},
				{ status: 400 }
			);
		}

		// Validación de fechas solo si ambas se proporcionan en la actualización
		let newStatus: "open" | "soon" | "closed" | undefined = undefined;
		if (body.date && body.registration_deadline) {
			const eventDate = new Date(body.date);
			const deadlineDate = new Date(body.registration_deadline);
			if (deadlineDate >= eventDate) {
				return NextResponse.json(
					{ error: "La data límit d'inscripció ha de ser anterior a la data de l'esdeveniment" },
					{ status: 400 }
				);
			}
			// Determinar el estado basado en la fecha límite
			const now = new Date();
			if (deadlineDate <= now) newStatus = "closed";
			else if (eventDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) newStatus = "soon";
			else newStatus = "open";
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

		// Actualizar el evento con parches parciales
		const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
		const maybeAssign = (key: keyof CreateEventData, value: any, nullIfEmpty = false) => {
			if (Object.prototype.hasOwnProperty.call(body, key)) {
				updatePayload[key] = nullIfEmpty ? (value ?? null) : value;
			}
		};
		maybeAssign("title", body.title);
		maybeAssign("date", body.date);
		maybeAssign("location", body.location, true);
		maybeAssign("latitude", body.latitude, true);
		maybeAssign("longitude", body.longitude, true);
		maybeAssign("prizes", body.prizes, true);
		maybeAssign("max_participants", body.max_participants);
		maybeAssign("registration_deadline", body.registration_deadline);
		if (typeof newStatus !== "undefined") updatePayload["status"] = newStatus;
		// image_url solo si viene (permite null explícito para borrar)
		if (Object.prototype.hasOwnProperty.call(body, "image_url")) {
			updatePayload["image_url"] = body.image_url ?? null;
		}

		console.debug("[PUT /api/admin/events/:id] update payload", updatePayload);

		const { data: updatedEvent, error: updateError } = await supabase
			.from("events")
			.update(updatePayload)
			.eq("id", eventId)
			.select()
			.single();

		if (updateError) {
			console.error("[PUT /api/admin/events/:id] Error updating event:", updateError);
			return NextResponse.json(
				{ error: "Error actualitzant l'esdeveniment" },
				{ status: 500 }
			);
		}

		console.debug("[PUT /api/admin/events/:id] updated event", {
			id: updatedEvent?.id,
			image_url: (updatedEvent as any)?.image_url ?? null,
		});

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
					message:
						"Aquest torneig té inscripcions. Utilitzeu el paràmetre 'force' per eliminar-lo.",
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
				console.error(
					"Error deleting registrations:",
					deleteRegistrationsError
				);
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
