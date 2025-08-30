import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// DELETE /api/lessons/bookings/[id]
// Cancels a booking that belongs to the authenticated user.
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	const supabase = createClient();

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) {
		return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
	}

	const bookingId = parseInt(params.id, 10);
	if (!Number.isFinite(bookingId)) {
		return NextResponse.json({ error: "ID no vàlid" }, { status: 400 });
	}

	// Fetch the booking to ensure ownership and get slot info
	const { data: booking, error: fetchErr } = await supabase
		.from("lesson_bookings")
		.select("id, slot_id, user_id, status, allow_fill")
		.eq("id", bookingId)
		.single();

	if (fetchErr || !booking) {
		return NextResponse.json({ error: "Reserva no trobada" }, { status: 404 });
	}

	if (booking.user_id !== user.id) {
		return NextResponse.json({ error: "Prohibit" }, { status: 403 });
	}

	if (booking.status === "cancelled") {
		return NextResponse.json({ message: "Ja estava cancel·lada" });
	}

	// 1) Mark booking as cancelled
	const { error: cancelErr } = await supabase
		.from("lesson_bookings")
		.update({ status: "cancelled" })
		.eq("id", bookingId);

	if (cancelErr) {
		console.error(
			"[DELETE] /api/lessons/bookings/[id] cancel error",
			cancelErr
		);
		return NextResponse.json({ error: cancelErr.message }, { status: 500 });
	}

	// 2) Recompute slot lock (best-effort). Joinable is now derived from bookings.
	// Find any remaining active booking on same slot that disallows fill
	const { data: locker, error: lockErr } = await supabase
		.from("lesson_bookings")
		.select("id")
		.eq("slot_id", booking.slot_id)
		.neq("status", "cancelled")
		.eq("allow_fill", false)
		.order("id", { ascending: true })
		.limit(1)
		.maybeSingle();

	if (lockErr) {
		// Non-fatal: the booking is cancelled already
		console.warn("Could not recompute slot lock after cancellation", lockErr);
	} else {
		const newLockedId = locker?.id ?? null;
		const { error: updErr } = await supabase
			.from("lesson_slots")
			.update({ locked_by_booking_id: newLockedId })
			.eq("id", booking.slot_id);
		if (updErr) {
			console.warn("Could not update slot lock after cancellation", updErr);
		}
	}

	// 3) Recompute slot status (open/full) based on confirmed bookings only
	try {
		// Fetch slot information
		const { data: slot, error: slotErr } = await supabase
			.from("lesson_slots")
			.select("id, max_capacity, status")
			.eq("id", booking.slot_id)
			.single();
		if (slotErr || !slot) {
			console.warn("Could not fetch slot to recompute status", slotErr);
		} else {
			// Only adjust status when current status is open/full
			if (slot.status === "open" || slot.status === "full") {
				// Sum confirmed participants for this slot
				const { data: confirmedBookings, error: sumErr } = await supabase
					.from("lesson_bookings")
					.select("group_size")
					.eq("slot_id", slot.id)
					.eq("status", "confirmed");
				if (sumErr) {
					console.warn(
						"Could not list confirmed bookings to recompute status",
						sumErr
					);
				} else {
					const confirmedCount = (confirmedBookings || []).reduce(
						(sum: number, b: any) => sum + (b.group_size || 0),
						0
					);
					const newStatus = confirmedCount >= (slot.max_capacity || 0) ? "full" : "open";
					if (newStatus !== slot.status) {
						const { error: updStatusErr } = await supabase
							.from("lesson_slots")
							.update({ status: newStatus })
							.eq("id", slot.id);
						if (updStatusErr) {
							console.warn("Could not update slot status after cancellation", updStatusErr);
						}
					}
				}
			}
		}
	} catch (e) {
		console.warn("Unexpected error recomputing slot status after cancellation", e);
	}

	return NextResponse.json({ message: "Reserva cancel·lada" });
}
