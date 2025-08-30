import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET() {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("lesson_availability_rules")
		.select("*")
		.order("created_at", { ascending: false });
	if (error)
		return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body = await request.json();

	// Check for conflicts first - do this inline instead of external fetch
	// to avoid URL issues in server-side code
	const conflicts: any[] = [];
	const affectedBookings: any[] = [];

	// Get all active rules to check for conflicts
	const { data: existingRules } = await supabase
		.from("lesson_availability_rules")
		.select("*")
		.eq("active", true);

	// Simple conflict detection
	let hasConflicts = false;
	if (existingRules && existingRules.length > 0) {
		for (const rule of existingRules) {
			// Check for day overlap
			const dayOverlap = body.days_of_week?.some((day: number) =>
				(rule.days_of_week || []).includes(day)
			);

			if (dayOverlap) {
				hasConflicts = true;
				conflicts.push({
					rule,
					conflictDates: [],
					conflictReasons: [
						`Dies coincidents amb regla: ${rule.title || rule.id}`,
					],
				});
			}
		}
	}

	const conflictResult = {
		canProceed: !hasConflicts || body.force_create === true,
		conflicts,
		affectedBookings,
	};

	if (!conflictResult.canProceed && body.force_create !== true) {
		return NextResponse.json(
			{
				error: "Conflicts detected. Use force_create: true to override.",
				conflicts: conflictResult.conflicts,
				affectedBookings: conflictResult.affectedBookings,
			},
			{ status: 409 }
		);
	}

	// Create the rule
	// Sanitize incoming body to avoid inserting client-only fields (e.g. force_create)
	const allowedFields = [
		"title",
		"valid_from",
		"valid_to",
		"days_of_week",
		"time_start",
		"time_end",
		"duration_minutes",
		"location",
		"active",
		"notes",
	];

	const insertPayload: any = {};
	for (const k of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(body, k)) {
			insertPayload[k] = (body as any)[k];
		}
	}

	const { data, error } = await supabase
		.from("lesson_availability_rules")
		.insert(insertPayload)
		.select("*")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}

	// Auto-generate slots for the next 3 months if the rule is active
	if (data.active) {
		try {
			await generateSlotsForRule(supabase, data);
		} catch (genError) {
			console.warn("Failed to auto-generate slots:", genError);
		}
	}

	return NextResponse.json({ rule: data });
}

async function generateSlotsForRule(supabase: any, rule: any) {
	const today = new Date();
	const threeMonthsLater = new Date();
	threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

	// Use the existing generation logic
	const dayMs = 24 * 60 * 60 * 1000;
	const tasks: any[] = [];

	for (
		let ts = today.getTime();
		ts <= threeMonthsLater.getTime();
		ts += dayMs
	) {
		const day = new Date(ts);
		const dayStr = day.toISOString().slice(0, 10);
		const dow = day.getUTCDay();

		// Check date window
		if (rule.valid_from && dayStr < rule.valid_from) continue;
		if (rule.valid_to && dayStr > rule.valid_to) continue;

		// Check DOW
		const dows: number[] = rule.days_of_week || [];
		if (!dows.includes(dow)) continue;

		// Check if there are overrides for this day
		const { data: overrides } = await supabase
			.from("lesson_availability_overrides")
			.select("*")
			.eq("date", dayStr)
			.eq("kind", "closed");

		if (overrides && overrides.length > 0) continue;

		// Build times and create slots
		const [sh, sm] = String(rule.time_start)
			.split(":")
			.map((x: string) => parseInt(x, 10));
		const start = new Date(day);
		start.setUTCHours(sh, sm || 0, 0, 0);
		const duration = rule.duration_minutes as number;
		let cursor = new Date(start);

		const [eh, em] = String(rule.time_end)
			.split(":")
			.map((x: string) => parseInt(x, 10));
		const endLimit = new Date(day);
		endLimit.setUTCHours(eh, em || 0, 0, 0);

		while (cursor < endLimit) {
			const slotStart = new Date(cursor);
			const slotEnd = new Date(cursor.getTime() + duration * 60 * 1000);
			if (slotEnd > endLimit) break;

			// Check if slot already exists
			const { data: existing } = await supabase
				.from("lesson_slots")
				.select("id")
				.eq("start_at", slotStart.toISOString())
				.eq("location", rule.location || "Soses")
				.single();

			if (!existing) {
				tasks.push(
					supabase.from("lesson_slots").insert({
						start_at: slotStart.toISOString(),
						end_at: slotEnd.toISOString(),
						max_capacity: 4,
						location: rule.location || "Soses",
						status: "open",
						created_from_rule_id: rule.id,
					})
				);
			}

			cursor = slotEnd;
		}
	}

	await Promise.all(tasks);
}
