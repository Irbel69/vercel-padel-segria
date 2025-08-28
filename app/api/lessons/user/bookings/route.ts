import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// GET /api/lessons/user/bookings?from=YYYY-MM-DD
export async function GET(request: Request) {
	const supabase = createClient();

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) {
		return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");

	let query = supabase
		.from("lesson_bookings")
		.select(
			`
			id, status, group_size, created_at,
			slot:slot_id!inner(id,start_at,end_at,location,status,joinable)
		`
		)
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	if (from) {
		// Filter by related slot start time from the given date forward
		// Must reference the embedded relation alias ('slot') not the base table name
		query = query.gte("slot.start_at", from);
	}

	const { data, error } = await query;
	if (error) {
		console.error("GET /api/lessons/user/bookings error", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	// Only keep future or same-day bookings if no explicit from provided
	const now = new Date();
	const todayISO = new Date(
		Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
	)
		.toISOString()
		.slice(0, 10);

	let bookings = (data || []).filter((b: any) => !!b.slot);
	if (!from) {
		bookings = bookings.filter((b: any) => {
			const start = new Date(b.slot.start_at).toISOString().slice(0, 10);
			return start >= todayISO;
		});
	}

	// Map to a slimmer shape
	const items = bookings.map((b: any) => ({
		booking_id: b.id,
		status: b.status,
		group_size: b.group_size,
		created_at: b.created_at,
		slot: b.slot,
	}));

	return NextResponse.json({ bookings: items });
}
