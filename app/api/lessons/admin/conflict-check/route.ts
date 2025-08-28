import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface ConflictCheckRequest {
	title?: string;
	valid_from?: string;
	valid_to?: string;
	days_of_week: number[];
	base_time_start: string; // HH:mm
	template: any; // ScheduleTemplate
	exclude_batch_id?: number;
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body: ConflictCheckRequest = await request.json();

	try {
		// Build proposed slots for the preview based on template
		const proposedSlots: Array<{start_at: string; end_at: string; date: string}> = [];
		const tmpl = body.template;
		if (!tmpl || !Array.isArray(tmpl.blocks)) {
			return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
		}

		// iterate days in date range and create proposed lesson blocks
		const from = body.valid_from ? new Date(body.valid_from) : new Date('1970-01-01');
		const to = body.valid_to ? new Date(body.valid_to) : new Date('2100-12-31');
		const dayMs = 24 * 60 * 60 * 1000;
		for (let ts = from.getTime(); ts <= to.getTime(); ts += dayMs) {
			const day = new Date(ts);
			const dow = day.getUTCDay();
			if (!body.days_of_week.includes(dow)) continue;

			const [bh, bm] = String(body.base_time_start || '00:00').split(':').map(Number);
			let cursor = new Date(day);
			cursor.setUTCHours(bh, bm || 0, 0, 0);

			for (const block of tmpl.blocks) {
				if (block.kind !== 'lesson') {
					cursor = new Date(cursor.getTime() + (block.duration_minutes || 0) * 60000);
					continue;
				}
				const start = new Date(cursor);
				const end = new Date(cursor.getTime() + (block.duration_minutes || 0) * 60000);
				proposedSlots.push({ start_at: start.toISOString(), end_at: end.toISOString(), date: start.toISOString().slice(0,10) });
				cursor = end;
			}
		}

		// Check proposed slots against existing lesson_slots for overlaps
		const conflicts: any[] = [];
		for (const ps of proposedSlots) {
			const { data: existing, error } = await supabase
				.from('lesson_slots')
				.select('id,start_at,end_at,location')
				.gte('start_at', new Date(ps.date + 'T00:00:00Z').toISOString())
				.lte('start_at', new Date(ps.date + 'T23:59:59Z').toISOString());
			if (error) continue;
			for (const ex of existing || []) {
				const exStart = new Date(ex.start_at).getTime();
				const exEnd = new Date(ex.end_at).getTime();
				const psStart = new Date(ps.start_at).getTime();
				const psEnd = new Date(ps.end_at).getTime();
				if (psStart < exEnd && psEnd > exStart) {
					conflicts.push({ date: ps.date, proposed_start_at: ps.start_at, proposed_end_at: ps.end_at, existing_slot: ex });
				}
			}
		}

		const affectedBookings = await checkAffectedBookings(supabase, body);

		return NextResponse.json({
			hasConflicts: conflicts.length > 0,
			slotConflicts: conflicts,
			affectedBookings,
			canProceed: conflicts.length === 0 && (affectedBookings?.protected_bookings?.length || 0) === 0
		});

	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

function parseTime(timeStr: string): number {
	const [hours, minutes] = timeStr.split(':').map(Number);
	return hours * 60 + (minutes || 0);
}

function timesOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
	return start1 < end2 && end1 > start2;
}

function dateRangesOverlap(
	from1?: string | null, to1?: string | null,
	from2?: string | null, to2?: string | null
): { overlaps: boolean; conflictDates: string[] } {
	// If either range is unlimited, they overlap
	const start1 = from1 ? new Date(from1) : new Date('1900-01-01');
	const end1 = to1 ? new Date(to1) : new Date('2100-12-31');
	const start2 = from2 ? new Date(from2) : new Date('1900-01-01');
	const end2 = to2 ? new Date(to2) : new Date('2100-12-31');

	const overlaps = start1 <= end2 && end1 >= start2;
	
	const conflictDates: string[] = [];
	if (overlaps) {
		const conflictStart = new Date(Math.max(start1.getTime(), start2.getTime()));
		const conflictEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
		
		if (from1 || from2) conflictDates.push(conflictStart.toISOString().slice(0, 10));
		if (to1 || to2) conflictDates.push(conflictEnd.toISOString().slice(0, 10));
	}

	return { overlaps, conflictDates };
}

async function checkAffectedBookings(supabase: any, ruleData: ConflictCheckRequest) {
	try {
		// Check for affected bookings directly instead of using external fetch
		const { data: bookings, error } = await supabase
			.from("lesson_bookings")
			.select(`
				id,
				slot_id,
				group_size,
				status,
				created_at,
				lesson_slots!inner (
					id,
					start_at,
					end_at,
					location,
					created_from_rule_id
				),
				users!inner (
					id,
					name,
					email
				)
			`)
			.neq("status", "cancelled");

		if (error || !bookings) {
			return {
				protected_bookings: [],
				modifiable_bookings: [],
				protection_summary: {
					total_affected_bookings: 0,
					protected_bookings: 0,
					modifiable_bookings: 0,
					total_affected_participants: 0,
					can_proceed_safely: true,
					requires_notification: false,
				},
				recommendations: []
			};
		}

		// Filter bookings that might be affected
		const filteredBookings = bookings.filter((booking: any) => {
			const slot = booking.lesson_slots;
			const slotStart = new Date(slot.start_at);
			const slotDate = slotStart.toISOString().slice(0, 10);
			const dow = slotStart.getUTCDay();
			
			// Check if this slot would conflict with the new rule
			if (ruleData.days_of_week.includes(dow)) {
				return true;
			}
			
			return false;
		});

		const protectedBookings = filteredBookings.filter(
			(booking: any) => booking.status === 'confirmed' || booking.status === 'paid'
		);
		
		const modifiableBookings = filteredBookings.filter(
			(booking: any) => booking.status === 'pending'
		);

		return {
			protected_bookings: protectedBookings,
			modifiable_bookings: modifiableBookings,
			protection_summary: {
				total_affected_bookings: filteredBookings.length,
				protected_bookings: protectedBookings.length,
				modifiable_bookings: modifiableBookings.length,
				total_affected_participants: filteredBookings.reduce(
					(sum: number, booking: any) => sum + (booking.group_size || 0), 
					0
				),
				can_proceed_safely: protectedBookings.length === 0,
				requires_notification: modifiableBookings.length > 0,
			},
			recommendations: protectedBookings.length > 0 
				? [`Hi ha ${protectedBookings.length} reserves confirmades que podrien veure's afectades.`]
				: ["No hi ha reserves confirmades afectades."]
		};

	} catch (error) {
		console.warn('Error checking affected bookings:', error);
		return {
			protected_bookings: [],
			modifiable_bookings: [],
			protection_summary: {
				total_affected_bookings: 0,
				protected_bookings: 0,
				modifiable_bookings: 0,
				total_affected_participants: 0,
				can_proceed_safely: true,
				requires_notification: false,
			},
			recommendations: []
		};
	}
}

function getDayName(dayNumber: number): string {
	const days = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];
	return days[dayNumber] || `Dia ${dayNumber}`;
}

function formatTimeOverlap(start1: number, end1: number, start2: number, end2: number): string {
	const overlapStart = Math.max(start1, start2);
	const overlapEnd = Math.min(end1, end2);
	
	const formatMinutes = (minutes: number) => {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
	};

	return `${formatMinutes(overlapStart)} - ${formatMinutes(overlapEnd)}`;
}