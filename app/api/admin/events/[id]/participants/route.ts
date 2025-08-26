import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// POST /api/admin/events/[id]/participants  { user_id, pair_user_id? }
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	console.log("[ADMIN][POST] /participants start, event id:", params.id);
	try {
		const supabase = createClient();
		console.log("[ADMIN][POST] Supabase client created");
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		console.log("[ADMIN][POST] Auth user:", user, "authError:", authError);
		if (authError || !user)
			return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
		console.log("[ADMIN][POST] Auth check passed, admin user id:", user.id);
		const { data: profile } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();
		console.log("[ADMIN][POST] User profile is_admin:", profile?.is_admin);
		if (!profile?.is_admin)
			return NextResponse.json({ error: "Accés denegat" }, { status: 403 });

		const eventId = parseInt(params.id);
		console.log("[ADMIN][POST] Parsed eventId:", eventId);
		const body = await request.json();
		console.log("[ADMIN][POST] Request body:", body);
		const userId: string | undefined = body.user_id;
		const pairUserId: string | undefined = body.pair_user_id;
		if (!userId)
			return NextResponse.json({ error: "Falta user_id" }, { status: 400 });
		console.log("[ADMIN][POST] Adding userId:", userId);

		// Verify event exists
		const { data: event } = await supabase
			.from("events")
			.select("id, max_participants")
			.eq("id", eventId)
			.single();
		console.log("[ADMIN][POST] Event fetched:", event);
		if (!event)
			return NextResponse.json(
				{ error: "Esdeveniment no trobat" },
				{ status: 404 }
			);

		// If pair_user_id is provided, create or reactivate pair registrations
		if (pairUserId) {
			console.log(
				"[ADMIN][POST] Pair registration requested with:",
				userId,
				pairUserId
			);
			if (pairUserId === userId) {
				return NextResponse.json(
					{ error: "Els dos usuaris han de ser diferents" },
					{ status: 400 }
				);
			}
			// Check both users existing registrations
			const { data: regs } = await supabase
				.from("registrations")
				.select("id, user_id, status, pair_id")
				.eq("event_id", eventId)
				.in("user_id", [userId, pairUserId]);
			const regA = regs?.find((r) => r.user_id === userId) || null;
			const regB = regs?.find((r) => r.user_id === pairUserId) || null;

			const newPairId =
				(globalThis as any).crypto?.randomUUID?.() ||
				`${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

			// A) Upsert A
			if (regA) {
				const { error: updAErr } = await supabase
					.from("registrations")
					.update({ status: "confirmed", pair_id: newPairId })
					.eq("id", regA.id);
				if (updAErr) {
					console.error("[ADMIN][POST] Error updating A:", updAErr);
					return NextResponse.json(
						{ error: "Error creant la parella" },
						{ status: 500 }
					);
				}
			} else {
				const { error: insAErr } = await supabase
					.from("registrations")
					.insert([
						{
							user_id: userId,
							event_id: eventId,
							status: "confirmed",
							pair_id: newPairId,
						},
					]);
				if (insAErr) {
					console.error("[ADMIN][POST] Error inserting A:", insAErr);
					return NextResponse.json(
						{ error: "Error creant la parella" },
						{ status: 500 }
					);
				}
			}

			// B) Upsert B
			if (regB) {
				const { error: updBErr } = await supabase
					.from("registrations")
					.update({ status: "confirmed", pair_id: newPairId })
					.eq("id", regB.id);
				if (updBErr) {
					console.error("[ADMIN][POST] Error updating B:", updBErr);
					return NextResponse.json(
						{ error: "Error creant la parella" },
						{ status: 500 }
					);
				}
			} else {
				const { error: insBErr } = await supabase
					.from("registrations")
					.insert([
						{
							user_id: pairUserId,
							event_id: eventId,
							status: "confirmed",
							pair_id: newPairId,
						},
					]);
				if (insBErr) {
					console.error("[ADMIN][POST] Error inserting B:", insBErr);
					return NextResponse.json(
						{ error: "Error creant la parella" },
						{ status: 500 }
					);
				}
			}

			return NextResponse.json({
				message: "Parella afegida",
				data: { pair_id: newPairId },
			});
		}

		// Single user flow
		// Check existing registration for single user
		const { data: existing } = await supabase
			.from("registrations")
			.select("id, status")
			.eq("event_id", eventId)
			.eq("user_id", userId)
			.single();
		console.log("[ADMIN][POST] Existing registration:", existing);

		if (existing) {
			// If exists but not confirmed -> set to confirmed
			if (existing.status !== "confirmed") {
				console.log(
					"[ADMIN][POST] Reactivating cancelled registration id:",
					existing.id
				);
				const { error: updErr } = await supabase
					.from("registrations")
					.update({ status: "confirmed", pair_id: null })
					.eq("id", existing.id);
				console.log("[ADMIN][POST] Update error:", updErr);
				if (updErr)
					return NextResponse.json(
						{ error: "Error actualitzant inscripció" },
						{ status: 500 }
					);
				return NextResponse.json({ message: "Usuari confirmat" });
			}
			return NextResponse.json({ message: "L'usuari ja està inscrit" });
		}

		// Insert new confirmed registration (admins can bypass limit intentionally)
		console.log("[ADMIN][POST] Inserting new registration");
		const { data: registration, error: regErr } = await supabase
			.from("registrations")
			.insert([
				{
					user_id: userId,
					event_id: eventId,
					status: "confirmed",
					pair_id: null,
				},
			])
			.select()
			.single();
		console.log("[ADMIN][POST] Insert result:", registration, "error:", regErr);
		if (regErr)
			return NextResponse.json(
				{ error: "Error afegint usuari" },
				{ status: 500 }
			);

		return NextResponse.json({ message: "Usuari afegit", data: registration });
	} catch (e) {
		console.error("[ADMIN][POST] Unexpected error:", e);
		console.error("Error admin add participant", e);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// DELETE /api/admin/events/[id]/participants?user_id=... or ?pair_id=...
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	console.log(
		"[ADMIN][DELETE] /participants start, event id:",
		params.id,
		"query:",
		request.url
	);
	try {
		const supabase = createClient();
		console.log("[ADMIN][DELETE] Supabase client created");
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		console.log("[ADMIN][DELETE] Auth user:", user, "authError:", authError);
		if (authError || !user)
			return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
		const { data: profile } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();
		console.log("[ADMIN][DELETE] User profile is_admin:", profile?.is_admin);
		if (!profile?.is_admin)
			return NextResponse.json({ error: "Accés denegat" }, { status: 403 });

		const url = new URL(request.url);
		const userId = url.searchParams.get("user_id");
		const pairId = url.searchParams.get("pair_id");
		console.log("[ADMIN][DELETE] Removing userId:", userId, "pairId:", pairId);
		if (!userId && !pairId)
			return NextResponse.json(
				{ error: "Falta user_id o pair_id" },
				{ status: 400 }
			);
		const eventId = parseInt(params.id);

		if (pairId) {
			console.log(
				"[ADMIN][DELETE] Deleting pair registrations for pair_id:",
				pairId
			);
			const { error: delPairErr } = await supabase
				.from("registrations")
				.delete()
				.eq("event_id", eventId)
				.eq("pair_id", pairId);
			console.log("[ADMIN][DELETE] Delete pair error:", delPairErr);
			if (delPairErr)
				return NextResponse.json(
					{ error: "Error eliminant la parella" },
					{ status: 500 }
				);
			return NextResponse.json({ message: "Parella eliminada" });
		}

		// Single user removal
		const { data: registration } = await supabase
			.from("registrations")
			.select("id")
			.eq("event_id", eventId)
			.eq("user_id", userId)
			.single();
		console.log("[ADMIN][DELETE] Found registration:", registration);
		if (!registration)
			return NextResponse.json(
				{ error: "Inscripció no trobada" },
				{ status: 404 }
			);

		console.log("[ADMIN][DELETE] Deleting registration id:", registration.id);
		const { error: delErr } = await supabase
			.from("registrations")
			.delete()
			.eq("id", registration.id);
		console.log("[ADMIN][DELETE] Delete error:", delErr);
		if (delErr)
			return NextResponse.json(
				{ error: "Error eliminant inscripció" },
				{ status: 500 }
			);

		return NextResponse.json({ message: "Usuari eliminat" });
	} catch (e) {
		console.error("[ADMIN][DELETE] Unexpected error:", e);
		console.error("Error admin delete participant", e);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
