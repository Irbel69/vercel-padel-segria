import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { ScheduleTemplate } from "@/types/lessons";

interface ApplyBody {
	title?: string;
	valid_from: string;
	valid_to: string;
	days_of_week: number[];
	base_time_start: string; // HH:mm
	location?: string;
	timezone?: string;
	template: ScheduleTemplate;
	options?: {
		policy?: "skip" | "protect" | "replace";
		overwrite_day?: boolean;
	};
	force?: boolean; // allow replacing conflicting slots without bookings
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body = (await request.json()) as ApplyBody;

	// Validate: allow empty blocks when overwriting a single day explicitly
	if (
		!body.valid_from ||
		!body.valid_to ||
		!Array.isArray(body.days_of_week) ||
		!body.base_time_start
	) {
		return NextResponse.json({ error: "Paràmetres invàlids" }, { status: 400 });
	}

	const singleDay = body.valid_from === body.valid_to;
	const overwriteDay = !!body.options?.overwrite_day && singleDay;
	if (!overwriteDay && !body.template?.blocks?.length) {
		return NextResponse.json({ error: "Paràmetres invàlids" }, { status: 400 });
	}

	const location = body.location || "Soses";
	const timezone = body.timezone || "Europe/Madrid";

	// Create batch record
	const { data: batch, error: batchErr } = await supabase
		.from("lesson_slot_batches")
		.insert({
			title: body.title || null,
			valid_from: body.valid_from,
			valid_to: body.valid_to,
			days_of_week: body.days_of_week,
			base_time_start: body.base_time_start,
			location,
			timezone,
			template: body.template,
			options: body.options || null,
		})
		.select("*")
		.single();

	if (batchErr)
		return NextResponse.json({ error: batchErr.message }, { status: 400 });

	// Generate slots using the batch template
	const from = new Date(body.valid_from + "T00:00:00Z");
	const to = new Date(body.valid_to + "T00:00:00Z");
	const dayMs = 24 * 60 * 60 * 1000;

	// If overwriteDay: delete all slots for that day/location first and ignore conflicts
	if (overwriteDay) {
		const dayStart = new Date(from);
		const dayEnd = new Date(from.getTime() + dayMs);
		const { error: delErr } = await supabase
			.from("lesson_slots")
			.delete()
			.gte("start_at", dayStart.toISOString())
			.lt("start_at", dayEnd.toISOString())
			.eq("location", location);
		if (delErr)
			return NextResponse.json({ error: delErr.message }, { status: 500 });
		// If template is empty, we've effectively cleared the day; return summary
		if (!body.template?.blocks || body.template.blocks.length === 0) {
			return NextResponse.json({
				batch_id: batch.id,
				created_count: 0,
				skipped_count: 0,
				replaced_count: 0,
				message: "Dia esborrat",
			});
		}
	}

	// Preload existing slots for quick checks unless we are overwriting the day entirely
	let existingSlots: {
		id: number;
		start_at: string;
		end_at: string;
		location: string;
		locked_by_booking_id?: number | null;
	}[] = [];
	if (!overwriteDay) {
		const { data, error: exErr } = await supabase
			.from("lesson_slots")
			.select("id,start_at,end_at,location,locked_by_booking_id")
			.gte("start_at", from.toISOString())
			.lte("end_at", new Date(to.getTime() + dayMs).toISOString())
			.eq("location", location);
		if (exErr)
			return NextResponse.json({ error: exErr.message }, { status: 500 });
		existingSlots = data || [];
	}

	let created_count = 0,
		skipped_count = 0,
		replaced_count = 0;

	const inserts: any[] = [];
	const deletions: number[] = [];

	// Helper to compute the UTC start Date for a local (timeZone) HH:mm on a specific day
	const getUtcStartForLocalTime = (
		day: Date,
		hour: number,
		minute: number,
		timeZone: string
	) => {
		// Compute the timezone offset (in ms) for this calendar day in the given timeZone
		const dtf = new Intl.DateTimeFormat("en-US", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
		const parts = dtf.formatToParts(day);
		const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
		// This represents the same 'instant' as `day`, expressed in the timeZone
		const asUTC = Date.UTC(
			Number(map.year),
			Number(map.month) - 1,
			Number(map.day),
			Number(map.hour),
			Number(map.minute),
			Number(map.second)
		);
		const offsetMs = asUTC - day.getTime();
		const offsetHours = offsetMs / 3600000;
		// Local hour -> UTC hour by subtracting the offset
		const utc = new Date(day);
		utc.setUTCHours(hour - offsetHours, minute || 0, 0, 0);
		return utc;
	};

	for (let ts = from.getTime(); ts <= to.getTime(); ts += dayMs) {
		const day = new Date(ts);
		const dow = day.getUTCDay();
		// If overwriting a specific day, ignore weekday mask to ensure application
		if (!overwriteDay && !body.days_of_week.includes(dow)) continue;

		const [bh, bm] = body.base_time_start.split(":").map(Number);
		// Interpret base_time_start as local time in `timezone` and convert to UTC
		const cursorStart = getUtcStartForLocalTime(day, bh, bm || 0, timezone);
		let cursor = new Date(cursorStart);

		for (const block of body.template.blocks) {
			if (block.kind === "lesson") {
				const start = new Date(cursor);
				const end = new Date(
					start.getTime() + block.duration_minutes * 60 * 1000
				);

				if (overwriteDay) {
					// Conflicts ignored, we already purged the day
					inserts.push({
						start_at: start.toISOString(),
						end_at: end.toISOString(),
						max_capacity:
							block.max_capacity ?? body.template.defaults?.max_capacity ?? 4,
						location,
						status: "open",
						created_from_batch_id: batch.id,
					});
					created_count++;
				} else {
					// Check overlap with existingSlots
					const overlap = (existingSlots || []).find((s) => {
						const sStart = new Date(s.start_at).getTime();
						const sEnd = new Date(s.end_at).getTime();
						return start.getTime() < sEnd && end.getTime() > sStart;
					});

					if (overlap) {
						if (
							body.options?.policy === "replace" &&
							!overlap.locked_by_booking_id &&
							body.force
						) {
							deletions.push(overlap.id);
							inserts.push({
								start_at: start.toISOString(),
								end_at: end.toISOString(),
								max_capacity:
									block.max_capacity ??
									body.template.defaults?.max_capacity ??
									4,
								location,
								status: "open",
								created_from_batch_id: batch.id,
							});
							replaced_count++;
						} else {
							skipped_count++;
						}
					} else {
						inserts.push({
							start_at: start.toISOString(),
							end_at: end.toISOString(),
							max_capacity:
								block.max_capacity ?? body.template.defaults?.max_capacity ?? 4,
							location,
							status: "open",
							created_from_batch_id: batch.id,
						});
						created_count++;
					}
				}
				cursor = end;
			} else {
				// break
				cursor = new Date(
					cursor.getTime() + block.duration_minutes * 60 * 1000
				);
			}
		}
	}

	// Execute deletions then inserts
	if (!overwriteDay && deletions.length > 0) {
		await supabase.from("lesson_slots").delete().in("id", deletions);
	}

	// Insert in chunks to avoid payload limits
	const chunkSize = 200;
	for (let i = 0; i < inserts.length; i += chunkSize) {
		const chunk = inserts.slice(i, i + chunkSize);
		const { error } = await supabase.from("lesson_slots").insert(chunk);
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
	}

	return NextResponse.json({
		batch_id: batch.id,
		created_count,
		skipped_count,
		replaced_count,
	});
}
