import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type {
	ScheduleTemplate,
	ScheduleBlock,
	ScheduleConflictResult,
	SlotConflict,
} from "@/types/lessons";

interface CheckBody {
	valid_from: string; // YYYY-MM-DD
	valid_to: string; // YYYY-MM-DD
	days_of_week: number[]; // 0..6
	base_time_start: string; // HH:mm
	location?: string;
	timezone?: string;
	template: ScheduleTemplate;
	options?: { overwrite_day?: boolean };
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body = (await request.json()) as CheckBody;

	// Basic validation: allow empty blocks only when explicitly overwriting a single day
	const singleDay = body.valid_from === body.valid_to;
	const overwriteDay = !!body.options?.overwrite_day && singleDay;
	if (
		!body.valid_from ||
		!body.valid_to ||
		!Array.isArray(body.days_of_week) ||
		!body.base_time_start
	) {
		return NextResponse.json({ error: "Paràmetres invàlids" }, { status: 400 });
	}

	if (!overwriteDay && !body.template?.blocks?.length) {
		return NextResponse.json({ error: "Paràmetres invàlids" }, { status: 400 });
	}

	const location = body.location || "Soses";
	const tz = body.timezone || "Europe/Madrid";
	const from = new Date(body.valid_from + "T00:00:00Z");
	const to = new Date(body.valid_to + "T00:00:00Z");
	if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
		return NextResponse.json(
			{ error: "Rang de dates invàlid" },
			{ status: 400 }
		);
	}

	// Build proposed slots in-memory and look for overlaps against existing lesson_slots
	const dayMs = 24 * 60 * 60 * 1000;
	const slot_conflicts: SlotConflict[] = [];
	let total_lesson_blocks = 0;
	let total_slots = 0;

	// Fetch existing slots in range for the location once
	const { data: existingSlots, error: exErr } = await supabase
		.from("lesson_slots")
		.select("id,start_at,end_at,location")
		.gte("start_at", new Date(from).toISOString())
		.lte("end_at", new Date(to.getTime() + dayMs).toISOString())
		.eq("location", location);
	if (exErr)
		return NextResponse.json({ error: exErr.message }, { status: 500 });

	for (let ts = from.getTime(); ts <= to.getTime(); ts += dayMs) {
		const day = new Date(ts);
		const dow = day.getUTCDay();
		if (!body.days_of_week.includes(dow)) continue;

		// Start of day per base_time_start
		const [bh, bm] = body.base_time_start.split(":").map(Number);
		const cursorStart = new Date(day);
		cursorStart.setUTCHours(bh, bm || 0, 0, 0);
		let cursor = new Date(cursorStart);

		// If overwriteDay and there are no blocks, preview zero slots for the day
		if (
			overwriteDay &&
			(!body.template?.blocks || body.template.blocks.length === 0)
		) {
			// nothing to add for this day
			continue;
		}

		for (const block of body.template.blocks) {
			if (block.kind === "lesson") {
				total_lesson_blocks++;
				const start = new Date(cursor);
				const end = new Date(
					start.getTime() + block.duration_minutes * 60 * 1000
				);
				total_slots++;

				// Check overlap with existingSlots
				const overlap = (existingSlots || []).find((s) => {
					const sStart = new Date(s.start_at).getTime();
					const sEnd = new Date(s.end_at).getTime();
					return start.getTime() < sEnd && end.getTime() > sStart;
				});
				if (overlap) {
					slot_conflicts.push({
						date: day.toISOString().slice(0, 10),
						proposed_start_at: start.toISOString(),
						proposed_end_at: end.toISOString(),
						existing_slot: {
							id: overlap.id,
							start_at: overlap.start_at,
							end_at: overlap.end_at,
							location: overlap.location,
						},
					});
				}
				cursor = end;
			} else {
				// break block
				const end = new Date(
					cursor.getTime() + block.duration_minutes * 60 * 1000
				);
				cursor = end;
			}
		}
	}

	const result: ScheduleConflictResult = {
		preview: {
			total_days: Math.ceil((to.getTime() - from.getTime()) / dayMs) + 1,
			total_lesson_blocks,
			total_slots,
		},
		slot_conflicts,
		affected_bookings_count: 0, // can be augmented by deeper checks if needed
		can_proceed: slot_conflicts.length === 0,
	};

	return NextResponse.json(result);
}
