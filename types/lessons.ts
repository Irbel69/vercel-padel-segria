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
