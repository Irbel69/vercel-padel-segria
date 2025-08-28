import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// GET /api/lessons/admin/slots/[id]/bookings
export async function GET(
	_request: Request,
	context: { params: { id: string } }
) {
	const supabase = createClient();
	const slotId = Number(context.params.id);
	if (!slotId || Number.isNaN(slotId)) {
		return NextResponse.json({ error: "Invalid slot id" }, { status: 400 });
	}

	// Fetch bookings for this slot with user info and participants
	const { data, error } = await supabase
		.from("lesson_bookings")
		.select(
			`
        id,
        user_id,
        group_size,
        status,
        created_at,
        users!inner ( id, name, email, phone ),
        lesson_booking_participants!left ( id, name, is_primary )
      `
		)
		.eq("slot_id", slotId)
		.order("created_at", { ascending: true });

	if (error) {
		console.error("GET admin slot bookings error", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const bookings = (data || []).map((b: any) => ({
		id: b.id,
		user: b.users,
		group_size: b.group_size,
		status: b.status,
		created_at: b.created_at,
		participants: (b.lesson_booking_participants || []).map((p: any) => ({
			id: p.id,
			name: p.name,
			is_primary: p.is_primary,
		})),
	}));

	// Aggregate participants count for convenience
	const participants_count = bookings.reduce(
		(sum, b) => sum + (b.group_size || 0),
		0
	);

	return NextResponse.json({ bookings, participants_count });
}
