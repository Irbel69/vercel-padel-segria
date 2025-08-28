import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface BookingProtectionRequest {
	rule_id?: number;
	slot_ids?: number[];
	date_range?: {
		from: string;
		to: string;
	};
	days_of_week?: number[];
	time_range?: {
		start: string;
		end: string;
	};
	location?: string;
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body: BookingProtectionRequest = await request.json();

	try {
		// Build query to find affected bookings
		let query = supabase
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

		// Filter by specific slots if provided
		if (body.slot_ids && body.slot_ids.length > 0) {
			query = query.in("slot_id", body.slot_ids);
		}

		// Filter by rule if provided
		if (body.rule_id) {
			query = query.eq("lesson_slots.created_from_rule_id", body.rule_id);
		}

		const { data: bookings, error } = await query;

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Filter bookings based on additional criteria
		const filteredBookings = (bookings || []).filter(booking => {
			const slot = booking.lesson_slots;
			const slotStart = new Date(slot.start_at);
			const slotDate = slotStart.toISOString().slice(0, 10);
			
			// Date range filter
			if (body.date_range) {
				if (slotDate < body.date_range.from || slotDate > body.date_range.to) {
					return false;
				}
			}

			// Day of week filter
			if (body.days_of_week && body.days_of_week.length > 0) {
				const dayOfWeek = slotStart.getUTCDay();
				if (!body.days_of_week.includes(dayOfWeek)) {
					return false;
				}
			}

			// Time range filter
			if (body.time_range) {
				const slotTime = slotStart.toLocaleTimeString('en-GB', { 
					hour: '2-digit', 
					minute: '2-digit',
					timeZone: 'UTC'
				});
				
				if (slotTime < body.time_range.start || slotTime >= body.time_range.end) {
					return false;
				}
			}

			// Location filter
			if (body.location && slot.location !== body.location) {
				return false;
			}

			return true;
		});

		// Categorize bookings by protection level
		const protectedBookings = filteredBookings.filter(
			booking => booking.status === 'confirmed' || booking.status === 'paid'
		);
		
		const modifiableBookings = filteredBookings.filter(
			booking => booking.status === 'pending'
		);

		// Calculate protection summary
		const protectionSummary = {
			total_affected_bookings: filteredBookings.length,
			protected_bookings: protectedBookings.length,
			modifiable_bookings: modifiableBookings.length,
			total_affected_participants: filteredBookings.reduce(
				(sum, booking) => sum + (booking.group_size || 0), 
				0
			),
			can_proceed_safely: protectedBookings.length === 0,
			requires_notification: modifiableBookings.length > 0,
		};

		// Group bookings by date for easier understanding
		const bookingsByDate = filteredBookings.reduce((acc, booking) => {
			const date = new Date(booking.lesson_slots.start_at).toISOString().slice(0, 10);
			if (!acc[date]) {
				acc[date] = [];
			}
			acc[date].push(booking);
			return acc;
		}, {} as Record<string, any[]>);

		return NextResponse.json({
			protection_summary: protectionSummary,
			protected_bookings: protectedBookings,
			modifiable_bookings: modifiableBookings,
			bookings_by_date: bookingsByDate,
			recommendations: generateRecommendations(protectionSummary, filteredBookings)
		});

	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

function generateRecommendations(summary: any, bookings: any[]): string[] {
	const recommendations: string[] = [];

	if (summary.protected_bookings > 0) {
		recommendations.push(
			`⚠️ Hi ha ${summary.protected_bookings} reserves confirmades que no es poden modificar automàticament.`
		);
		
		recommendations.push(
			"Es recomana contactar amb els usuaris afectats abans de fer canvis."
		);
	}

	if (summary.modifiable_bookings > 0) {
		recommendations.push(
			`ℹ️ Hi ha ${summary.modifiable_bookings} reserves pendents que es poden modificar.`
		);
		
		recommendations.push(
			"Aquestes reserves es mouran automàticament si és possible."
		);
	}

	if (summary.total_affected_bookings === 0) {
		recommendations.push(
			"✅ No hi ha reserves afectades. Es pot procedir amb seguretat."
		);
	}

	// Add specific recommendations based on booking patterns
	const upcomingBookings = bookings.filter(booking => {
		const slotDate = new Date(booking.lesson_slots.start_at);
		const now = new Date();
		const daysDifference = Math.ceil((slotDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		return daysDifference <= 7; // Within next week
	});

	if (upcomingBookings.length > 0) {
		recommendations.push(
			`⏰ ${upcomingBookings.length} reserves són per la setmana vinent. Prioritza contactar aquests usuaris.`
		);
	}

	return recommendations;
}