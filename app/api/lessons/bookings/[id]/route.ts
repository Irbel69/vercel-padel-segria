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

	// 2) Recompute slot joinable/locked_by_booking_id (best-effort)
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
		const newJoinable = newLockedId === null;
		const { error: updErr } = await supabase
			.from("lesson_slots")
			.update({ joinable: newJoinable, locked_by_booking_id: newLockedId })
			.eq("id", booking.slot_id);
		if (updErr) {
			console.warn("Could not update slot joinable after cancellation", updErr);
		}
	}

	return NextResponse.json({ message: "Reserva cancel·lada" });
}
