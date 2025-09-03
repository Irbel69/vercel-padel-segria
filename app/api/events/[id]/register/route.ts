import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// POST /api/events/[id]/register - Inscribirse en un evento
export async function POST(
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

		const eventId = parseInt(params.id);

		// Verificar que el evento existe y está disponible
			const { data: event, error: eventError } = await supabase
			.from("events")
				.select("*")
			.eq("id", eventId)
			.single();

		if (eventError || !event) {
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
			);
		}

			// Verificar que el evento esté abierto para inscripciones
		if (event.status === "closed") {
			return NextResponse.json(
				{ error: "Les inscripcions per aquest esdeveniment estan tancades" },
				{ status: 400 }
			);
		}

			// If event requires pair, disallow solo registration via this endpoint
			if ((event as any).pair_required === true) {
				return NextResponse.json(
					{ error: "Aquest esdeveniment requereix inscriure's amb parella" },
					{ status: 400 }
				);
			}

		// Verificar que no haya pasado la fecha límite
		const registrationDeadline = new Date(event.registration_deadline);
		const now = new Date();

		if (registrationDeadline <= now) {
			return NextResponse.json(
				{ error: "La data límit d'inscripció ha passat" },
				{ status: 400 }
			);
		}

		// Verificar que el usuario no esté ya registrado
		const { data: existingRegistration } = await supabase
			.from("registrations")
			.select("*")
			.eq("event_id", eventId)
			.eq("user_id", user.id)
			.single();

		if (existingRegistration) {
			return NextResponse.json(
				{ error: "Ja estàs inscrit en aquest esdeveniment" },
				{ status: 400 }
			);
		}

		// Verificar que no se haya alcanzado el límite de participantes
		const { count: currentParticipants } = await supabase
			.from("registrations")
			.select("*", { count: "exact", head: true })
			.eq("event_id", eventId)
			.eq("status", "confirmed");

		if (currentParticipants && currentParticipants >= event.max_participants) {
			return NextResponse.json(
				{ error: "S'ha arribat al límit màxim de participants" },
				{ status: 400 }
			);
		}

		// Crear la inscripción
		const { data: registration, error: registrationError } = await supabase
			.from("registrations")
			.insert([
				{
					user_id: user.id,
					event_id: eventId,
					status: "confirmed", // Auto-confirmar por ahora
				},
			])
			.select()
			.single();

		if (registrationError) {
			console.error("Error creating registration:", registrationError);
			return NextResponse.json(
				{ error: "Error processant la inscripció" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: "Inscripció realitzada amb èxit",
			data: registration,
		});
	} catch (error) {
		console.error("Error in POST /api/events/[id]/register:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// DELETE /api/events/[id]/register - Cancelar inscripción
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

		const eventId = parseInt(params.id);

		// Verificar que el evento existe
		const { data: event, error: eventError } = await supabase
			.from("events")
			.select("*")
			.eq("id", eventId)
			.single();

		if (eventError || !event) {
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
			);
		}

		// Verificar que el usuario esté registrado
		const { data: existingRegistration, error: fetchError } = await supabase
			.from("registrations")
			.select("*")
			.eq("event_id", eventId)
			.eq("user_id", user.id)
			.single();

		if (fetchError || !existingRegistration) {
			return NextResponse.json(
				{ error: "No estàs inscrit en aquest esdeveniment" },
				{ status: 400 }
			);
		}

		// Verificar que no sea demasiado tarde para cancelar (por ejemplo, 24 horas antes)
		const eventDate = new Date(event.date);
		const now = new Date();
		const hoursUntilEvent =
			(eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

		if (hoursUntilEvent < 24) {
			return NextResponse.json(
				{
					error:
						"No es pot cancel·lar la inscripció amb menys de 24 hores d'antelació",
				},
				{ status: 400 }
			);
		}

		// Si el usuario está registrado como pareja, cancelar también la inscripción del compañero
		if (existingRegistration.pair_id) {
			// Buscar y eliminar todas las inscripciones con el mismo pair_id
			const { error: deletePairError } = await supabase
				.from("registrations")
				.delete()
				.eq("pair_id", existingRegistration.pair_id)
				.eq("event_id", eventId);

			if (deletePairError) {
				console.error("Error deleting pair registrations:", deletePairError);
				return NextResponse.json(
					{ error: "Error cancel·lant la inscripció de la parella" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Inscripció cancel·lada amb èxit (parella inclosa)",
			});
		} else {
			// Eliminar solo la inscripción del usuario actual
			const { error: deleteError } = await supabase
				.from("registrations")
				.delete()
				.eq("id", existingRegistration.id);

			if (deleteError) {
				console.error("Error deleting registration:", deleteError);
				return NextResponse.json(
					{ error: "Error cancel·lant la inscripció" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Inscripció cancel·lada amb èxit",
			});
		}
	} catch (error) {
		console.error("Error in DELETE /api/events/[id]/register:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
