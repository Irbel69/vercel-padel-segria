import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// GET /api/lessons/slots?from=ISO&to=ISO
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const supabase = createClient();

	let query = supabase
		.from("lesson_slots")
		.select(
			`
			id,start_at,end_at,max_capacity,location,status,
			lesson_bookings!left ( status, group_size, allow_fill )
		`
		)
		.order("start_at", { ascending: true });

	// Normalize date params: if a plain date (YYYY-MM-DD) is provided, expand to whole-day range in UTC
	const toIso = (() => {
		if (!to) return undefined;
		if (to.length <= 10) {
			return new Date(to + "T23:59:59.999Z").toISOString();
		}
		const d = new Date(to);
		return isNaN(d.getTime()) ? undefined : d.toISOString();
	})();
	const fromIso = (() => {
		if (!from) return undefined;
		if (from.length <= 10) {
			return new Date(from + "T00:00:00Z").toISOString();
		}
		const d = new Date(from);
		return isNaN(d.getTime()) ? undefined : d.toISOString();
	})();

	if (fromIso) query = query.gte("start_at", fromIso);
	if (toIso) query = query.lte("end_at", toIso);

	const { data: rawSlots, error } = await query;
	if (error) {
		console.error("GET /api/lessons/slots error", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	// Compute participants_count and derived joinable, then strip raw bookings
	const slots = (rawSlots || []).map((slot: any) => {
		const active = (slot.lesson_bookings || []).filter(
			(b: any) => b.status !== "cancelled"
		);
		const participants = active.reduce(
			(sum: number, b: any) => sum + (b.group_size || 0),
			0
		);
		const anyLocker = active.some((b: any) => b.allow_fill === false);
		// Derive allow_fill_policy: if there are active bookings and all share same allow_fill, expose it; else null
		let allow_fill_policy: boolean | null = null;
		if (active.length > 0) {
			const first = Boolean(active[0].allow_fill);
			const uniform = active.every((b: any) => Boolean(b.allow_fill) === first);
			allow_fill_policy = uniform ? first : null;
		}
		const { lesson_bookings, ...rest } = slot;
		const start = new Date(rest.start_at);
		const end = new Date(rest.end_at);
		const duration_minutes =
			Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())
				? Math.round((end.getTime() - start.getTime()) / 60000)
				: undefined;
		return {
			...rest,
			participants_count: participants,
			// joinable is true when no active booking disallows fill
			joinable: !anyLocker,
			allow_fill_policy,
			duration_minutes,
		};
	});

	// Try to annotate with user_booked flag if authenticated
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user || !slots?.length) {
		return NextResponse.json({ slots: slots ?? [] });
	}

	const slotIds = (slots || []).map((s) => s.id);
	if (!slotIds.length) {
		return NextResponse.json({ slots: slots ?? [] });
	}

	const { data: myBookings, error: bookingsError } = await supabase
		.from("lesson_bookings")
		.select("slot_id,status")
		.eq("user_id", user.id)
		.in("slot_id", slotIds);
	if (bookingsError) {
		// Non-fatal: return slots without annotation
		console.warn("Could not annotate slots with user_booked:", bookingsError);
		return NextResponse.json({ slots: slots ?? [] });
	}

	const bookedSlotIds = new Set(
		(myBookings || [])
			.filter((b) => b.status !== "cancelled")
			.map((b) => b.slot_id)
	);

	const annotated = (slots || []).map((s) => ({
		...s,
		user_booked: bookedSlotIds.has(s.id),
	}));

	return NextResponse.json({ slots: annotated });
}
