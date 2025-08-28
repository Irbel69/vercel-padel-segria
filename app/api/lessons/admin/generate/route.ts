import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// POST /api/lessons/admin/generate { from: '2025-06-01', to: '2025-06-30' }
// Generates lesson_slots based on active rules and skips dates with explicit 'closed' overrides.
export async function POST(request: Request) {
	const supabase = createClient();
	const body = await request.json();
	const from = new Date(body.from);
	const to = new Date(body.to);
	if (
		!(from instanceof Date) ||
		isNaN(from.getTime()) ||
		!(to instanceof Date) ||
		isNaN(to.getTime())
	) {
		return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
	}

	// Load rules
	const { data: rules, error: rulesErr } = await supabase
		.from("lesson_availability_rules")
		.select("*")
		.eq("active", true);
	if (rulesErr)
		return NextResponse.json({ error: rulesErr.message }, { status: 500 });

	// Load overrides in range
	const { data: overrides, error: ovErr } = await supabase
		.from("lesson_availability_overrides")
		.select("*")
		.gte("date", from.toISOString().slice(0, 10))
		.lte("date", to.toISOString().slice(0, 10));
	if (ovErr)
		return NextResponse.json({ error: ovErr.message }, { status: 500 });
	const closedByDay = new Set(
		(overrides || [])
			.filter((o: any) => o.kind === "closed")
			.map((o: any) => o.date)
	);

	const created: any[] = [];
	const tasks: any[] = [];

	const dayMs = 24 * 60 * 60 * 1000;
	for (let ts = from.getTime(); ts <= to.getTime(); ts += dayMs) {
		const day = new Date(ts);
		const dayStr = day.toISOString().slice(0, 10);
		if (closedByDay.has(dayStr)) continue;
		const dow = day.getUTCDay(); // 0..6

		for (const r of rules || []) {
			// Check date window
			if (r.valid_from && dayStr < r.valid_from) continue;
			if (r.valid_to && dayStr > r.valid_to) continue;

			// Check DOW
			const dows: number[] = r.days_of_week || [];
			if (!dows.includes(dow)) continue;

			// Build times
			const [sh, sm] = String(r.time_start)
				.split(":")
				.map((x: string) => parseInt(x, 10));
			const start = new Date(day);
			start.setUTCHours(sh, sm || 0, 0, 0);
			const duration = r.duration_minutes as number;
			let cursor = new Date(start);

			const [eh, em] = String(r.time_end)
				.split(":")
				.map((x: string) => parseInt(x, 10));
			const endLimit = new Date(day);
			endLimit.setUTCHours(eh, em || 0, 0, 0);

			while (cursor < endLimit) {
				const slotStart = new Date(cursor);
				const slotEnd = new Date(cursor.getTime() + duration * 60 * 1000);
				if (slotEnd > endLimit) break;

				tasks.push(
					supabase
						.from("lesson_slots")
						.insert({
							start_at: slotStart.toISOString(),
							end_at: slotEnd.toISOString(),
							max_capacity: 4,
							location: r.location || "Soses",
							status: "open",
							joinable: true,
							created_from_rule_id: r.id,
						})
						.select("*")
						.single()
						.then(({ data, error }) => {
							if (!error && data) created.push(data);
						})
				);

				cursor = slotEnd;
			}
		}
	}

	await Promise.all(tasks);
	return NextResponse.json({ createdCount: created.length, created });
}
