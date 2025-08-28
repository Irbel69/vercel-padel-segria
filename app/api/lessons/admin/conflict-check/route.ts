import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface ConflictRule {
	id: number;
	title: string;
	valid_from: string | null;
	valid_to: string | null;
	days_of_week: number[];
	time_start: string;
	time_end: string;
}

interface ConflictCheckRequest {
	title?: string;
	valid_from?: string;
	valid_to?: string;
	days_of_week: number[];
	time_start: string;
	time_end: string;
	exclude_rule_id?: number; // For when editing existing rules
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body: ConflictCheckRequest = await request.json();

	try {
		// Get all active rules
		const { data: rules, error: rulesError } = await supabase
			.from("lesson_availability_rules")
			.select("*")
			.eq("active", true);

		if (rulesError) {
			return NextResponse.json({ error: rulesError.message }, { status: 500 });
		}

		const conflicts: Array<{
			rule: ConflictRule;
			conflictDates: string[];
			conflictReasons: string[];
		}> = [];

		const newRuleStart = parseTime(body.time_start);
		const newRuleEnd = parseTime(body.time_end);

		for (const rule of rules || []) {
			// Skip if this is the same rule being edited
			if (body.exclude_rule_id && rule.id === body.exclude_rule_id) {
				continue;
			}

			const existingStart = parseTime(rule.time_start);
			const existingEnd = parseTime(rule.time_end);

			// Check for day overlap
			const dayOverlap = body.days_of_week.some(day => 
				(rule.days_of_week || []).includes(day)
			);

			if (!dayOverlap) continue;

			// Check for time overlap
			const timeOverlap = timesOverlap(
				newRuleStart, newRuleEnd,
				existingStart, existingEnd
			);

			if (!timeOverlap) continue;

			// Check for date range overlap
			const dateOverlap = dateRangesOverlap(
				body.valid_from, body.valid_to,
				rule.valid_from, rule.valid_to
			);

			if (!dateOverlap.overlaps) continue;

			// We have a conflict
			const conflictReasons: string[] = [];
			const overlappingDays = body.days_of_week.filter(day => 
				(rule.days_of_week || []).includes(day)
			);
			
			conflictReasons.push(
				`Dies coincidents: ${overlappingDays.map(d => getDayName(d)).join(", ")}`
			);
			
			conflictReasons.push(
				`Horari coincident: ${formatTimeOverlap(newRuleStart, newRuleEnd, existingStart, existingEnd)}`
			);

			if (dateOverlap.conflictDates.length > 0) {
				conflictReasons.push(
					`Dates coincidents: ${dateOverlap.conflictDates.join(" - ")}`
				);
			}

			conflicts.push({
				rule,
				conflictDates: dateOverlap.conflictDates,
				conflictReasons
			});
		}

		// Check if there are existing bookings that would be affected
		const affectedBookings = await checkAffectedBookings(supabase, body);

		return NextResponse.json({
			hasConflicts: conflicts.length > 0,
			conflicts,
			affectedBookings,
			canProceed: conflicts.length === 0 && affectedBookings.length === 0
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