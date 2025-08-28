import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const supabase = createClient();

	// Get slots with booking count and rule information
	let query = supabase
		.from("lesson_slots")
		.select(
			`
			*,
			lesson_bookings!left (
				id,
				status,
				group_size
			),
			lesson_availability_rules!left (
				id,
				title
			)
		`
		)
		.order("start_at");

	if (from) query = query.gte("start_at", from);
	if (to) query = query.lte("end_at", to);

	const { data, error } = await query;
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	// Process the data to include booking counts and rule info
	const processedSlots = (data || []).map((slot: any) => {
		const activeBookings =
			slot.lesson_bookings?.filter(
				(booking: any) => booking.status !== "cancelled"
			) || [];

		const totalBooked = activeBookings.reduce(
			(sum: number, booking: any) => sum + (booking.group_size || 0),
			0
		);

		return {
			...slot,
			booking_count: activeBookings.length,
			participants_count: totalBooked,
			rule_title: slot.lesson_availability_rules?.title || null,
			lesson_bookings: undefined, // Remove the raw bookings data
			lesson_availability_rules: undefined, // Remove the raw rule data
		};
	});

	return NextResponse.json({ slots: processedSlots });
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body = await request.json();
	// Whitelist allowed fields to avoid inserting client-only properties
	const allowed = [
		"start_at",
		"end_at",
		"max_capacity",
		"location",
		"status",
		"joinable",
		"locked_by_booking_id",
		"created_from_rule_id",
	];
	const insertPayload: any = {};
	for (const k of allowed) {
		if (Object.prototype.hasOwnProperty.call(body, k))
			insertPayload[k] = (body as any)[k];
	}
	const { data, error } = await supabase
		.from("lesson_slots")
		.insert(insertPayload)
		.select("*")
		.single();
	if (error)
		return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ slot: data });
}
