import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { sendCancellationEmail } from "@/libs/resend";
import config from "@/config";

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
		// (No cal carregar perfil per a inscripció simple.)

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

		// Cargar perfil del usuario que cancela para obtener un nombre legible (si existe)
		let cancellingUserProfile: { name?: string | null; surname?: string | null; email?: string | null } | null = null;
		try {
			const { data: profile } = await supabase
				.from("users")
				.select("name, surname, email")
				.eq("id", user.id)
				.single();
			cancellingUserProfile = profile || null;
		} catch (_e) {
			// No es crítico; fallback a metadata/email
		}

		const cancellingUserDisplayName = (() => {
			const parts: string[] = [];
			if (cancellingUserProfile?.name) parts.push(cancellingUserProfile.name.trim());
			if (cancellingUserProfile?.surname) parts.push(cancellingUserProfile.surname.trim());
			const joined = parts.join(" ").trim();
			if (joined) return joined;
			const meta: any = (user as any)?.user_metadata || {};
			if (meta.full_name) return meta.full_name;
			if (meta.name) return meta.name;
			return (
				cancellingUserProfile?.email ||
				(user as any)?.email ||
				""
			);
		})();

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

		// --- START: Gather partner users BEFORE deletion (so we can notify them) ---
		let partnerUsers: Array<{ id: number; name?: string | null; email?: string | null }> = [];
		try {
			if (existingRegistration?.pair_id) {
				const { data: pairRegs, error: pairRegsErr } = await supabase
					.from("registrations")
					.select("user_id")
					.eq("pair_id", existingRegistration.pair_id)
					.eq("event_id", eventId);

				if (!pairRegsErr && Array.isArray(pairRegs) && pairRegs.length) {
					const partnerIds = (pairRegs as any[])
						.map((r) => r.user_id)
						.filter((id) => id && id !== user.id);

					if (partnerIds.length) {
						const { data: usersData } = await supabase
							.from("users")
							.select("id, name, email")
							.in("id", partnerIds);
						partnerUsers = usersData || [];
					}
				}
			}
		} catch (e) {
			// Non-fatal: proceed with cancellation even if partner lookup fails
			console.warn("Failed to lookup partner users for cancellation email:", e);
		}
		// --- END gather partner users ---

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

			// After successful deletion, send best-effort notification emails:
			try {
				const subject = `Inscripció cancel·lada — ${(event as any).title}`;
				const when = (event as any).date ? new Date((event as any).date).toLocaleString() : "";
				// Display canonical domain but link to local dashboard tournaments page during development
				const siteDomain = config.domainName || "padelsegria.com";
				const eventUrlDisplay = `https://${siteDomain}`;
				const eventUrlLink = `https://${siteDomain}/dashboard/tournaments`;

				// Email to cancelling user
				const cancellingEmail = (user as any)?.email;
				if (cancellingEmail) {
					try {
						await sendCancellationEmail({
							to: cancellingEmail,
							recipientName: cancellingUserDisplayName,
							eventName: (event as any).title,
							eventDate: when,
							eventLocation: (event as any).location || (event as any).venue || "",
							eventUrl: eventUrlLink,
							supportEmail: config.resend.supportEmail,
							subject,
							text: `La teva inscripció a "${(event as any).title}" (${when}) ha estat cancel·lada.`,
						});
					} catch (e) {
						console.warn("Failed to send cancellation email to cancelling user:", e);
					}
				}

				// Emails to partner(s) (if any)
				for (const p of partnerUsers) {
					if (p?.email) {
						const text = `La teva parella ha cancel·lat la inscripció a "${(event as any).title}" (${when}). Consulta altres esdeveniments a ${eventUrlDisplay} (Dashboard de tornejos: ${eventUrlLink}).`;
						const html = `<p>Hola ${p.name || ""},</p><p>La teva parella ha cancel·lat la inscripció a "<strong>${(event as any).title}</strong>" (${when}).</p><p>Per veure altres esdeveniments o inscriure't de nou, visita <a href="${eventUrlLink}">${eventUrlDisplay}</a>.</p>`;
						try {
							await sendCancellationEmail({
								to: p.email,
								recipientName: p.name || p.email || "",
								eventName: (event as any).title,
								eventDate: when,
								eventLocation: (event as any).location || (event as any).venue || "",
								eventUrl: eventUrlLink,
								supportEmail: config.resend.supportEmail,
								subject,
								text,
								canceledByName: cancellingUserDisplayName,
							});
						} catch (e) {
							console.warn(`Failed to send cancellation email to partner ${p.id}:`, e);
						}
					}
				}
			} catch (e) {
				console.warn("Error sending cancellation emails (non-fatal):", e);
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

			// After successful deletion, send best-effort notification emails:
			try {
				const subject = `Inscripció cancel·lada — ${(event as any).title}`;
				const when = (event as any).date ? new Date((event as any).date).toLocaleString() : "";
				const siteDomain = config.domainName || "padelsegria.com";
				const eventUrlDisplay = `https://${siteDomain}`;
				const eventUrlLink = `https://${siteDomain}/dashboard/tournaments`;

				// Email to cancelling user
				const cancellingEmail = (user as any)?.email;
				if (cancellingEmail) {
					try {
						await sendCancellationEmail({
							to: cancellingEmail,
							recipientName: cancellingUserDisplayName,
							eventName: (event as any).title,
							eventDate: when,
							eventLocation: (event as any).location || (event as any).venue || "",
							eventUrl: eventUrlLink,
							supportEmail: config.resend.supportEmail,
							subject,
							text: `La teva inscripció a "${(event as any).title}" (${when}) ha estat cancel·lada.`,
						});
					} catch (e) {
						console.warn("Failed to send cancellation email to cancelling user:", e);
					}
				}
			} catch (e) {
				console.warn("Error sending cancellation emails (non-fatal):", e);
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
