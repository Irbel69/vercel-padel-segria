export type LessonSlotStatus = "open" | "full" | "cancelled" | "closed";
export type PaymentType = "direct_debit" | "bizum" | "cash";

export interface LessonSlot {
	id: number;
	start_at: string; // ISO
	end_at: string; // ISO
	max_capacity: number; // 1-4
	location: string; // default Soses
	status: LessonSlotStatus;
	joinable: boolean;
}

export interface LessonBookingParticipant {
	id?: number;
	booking_id?: number;
	name: string;
	is_primary?: boolean;
}

export interface DirectDebitDetails {
	iban?: string;
	holder_name?: string;
	holder_address?: string;
	holder_dni?: string;
	is_authorized?: boolean;
}

export interface CreateBookingPayload {
	slot_id: number;
	user_id?: string; // server will derive from auth if omitted
	group_size: 1 | 2 | 3 | 4;
	allow_fill: boolean;
	payment_type: PaymentType;
	observations?: string;
	primary_name?: string;
	participants?: string[]; // additional names
	direct_debit?: DirectDebitDetails; // if payment_type = direct_debit
}

export interface BookLessonResponse {
	booking_id: number;
	final_total_cents: number;
}

export interface LessonAvailabilityRule {
	id: number;
	title?: string;
	valid_from?: string;
	valid_to?: string;
	days_of_week: number[];
	time_start: string;
	time_end: string;
	duration_minutes: number;
	location: string;
	active: boolean;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export interface LessonAvailabilityOverride {
	id: number;
	date: string;
	time_start?: string;
	time_end?: string;
	kind: "closed" | "open";
	reason?: string;
	location: string;
	created_at: string;
}

export interface ConflictCheck {
	hasConflicts: boolean;
	conflicts: RuleConflict[];
	affectedBookings: BookingProtection;
	canProceed: boolean;
}

export interface RuleConflict {
	rule: LessonAvailabilityRule;
	conflictDates: string[];
	conflictReasons: string[];
}

export interface BookingProtection {
	protected_bookings: any[];
	modifiable_bookings: any[];
	protection_summary: {
		total_affected_bookings: number;
		protected_bookings: number;
		modifiable_bookings: number;
		total_affected_participants: number;
		can_proceed_safely: boolean;
		requires_notification: boolean;
	};
	recommendations: string[];
}

// New modular schedule (batch) system
export type ScheduleBlockKind = "lesson" | "break";

export interface ScheduleBlock {
	kind: ScheduleBlockKind;
	duration_minutes: number;
	label?: string;
	max_capacity?: number;
	joinable?: boolean;
}

export interface ScheduleTemplateDefaults {
	max_capacity?: number;
	joinable?: boolean;
}

export interface ScheduleTemplate {
	blocks: ScheduleBlock[];
	defaults?: ScheduleTemplateDefaults;
}

export interface LessonSlotBatchOptions {
	policy?: "skip" | "protect" | "replace";
}

export interface LessonSlotBatch {
	id: number;
	title?: string;
	valid_from: string; // YYYY-MM-DD
	valid_to: string; // YYYY-MM-DD
	days_of_week: number[]; // 0..6
	base_time_start: string; // HH:mm
	location: string; // default Soses
	timezone: string; // IANA, e.g. Europe/Madrid
	template: ScheduleTemplate;
	options?: LessonSlotBatchOptions;
	created_by?: string;
	created_at: string;
	updated_at: string;
}

export interface ScheduleCheckPreview {
	total_days: number;
	total_lesson_blocks: number;
	total_slots: number;
}

export interface SlotConflict {
	date: string; // YYYY-MM-DD
	proposed_start_at: string; // ISO
	proposed_end_at: string; // ISO
	existing_slot?: {
		id: number;
		start_at: string;
		end_at: string;
		location: string;
		participants_count?: number;
	};
}

export interface ScheduleConflictResult {
	preview: ScheduleCheckPreview;
	slot_conflicts: SlotConflict[];
	affected_bookings_count: number;
	can_proceed: boolean;
}
