export * from "./config";

// User related types
export interface UserProfile {
	id: string;
	email: string;
	name: string | null;
	surname: string | null;
	phone: string | null;
	observations: string | null;
	avatar_url: string | null;
	is_admin: boolean;
	trend: "up" | "down" | "same";
	image_rights_accepted: boolean;
	privacy_policy_accepted: boolean;
	created_at: string;
	updated_at: string;
}

export interface RankingPlayer {
	id: string;
	name: string | null;
	surname: string | null;
	avatar_url: string | null;
	points: number;
	matches_played: number;
	wins: number;
	losses: number;
	win_percentage: number;
	rank: number;
}

export interface UsersListResponse {
	users: UserProfile[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalUsers: number;
		hasMore: boolean;
		limit: number;
	};
}

// Events/Tournaments related types
export interface Event {
	id: number;
	title: string;
	date: string;
	location: string | null;
	latitude: number | null;
	longitude: number | null;
	status: "open" | "soon" | "closed";
	prizes: string | null;
	max_participants: number;
	registration_deadline: string;
	created_at: string;
	updated_at: string;
	current_participants?: number;
	user_registration_status?: "pending" | "confirmed" | "cancelled" | null;
}

export interface EventsListResponse {
	events: Event[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalEvents: number;
		hasMore: boolean;
		limit: number;
	};
}

export interface Registration {
	id: number;
	user_id: string;
	event_id: number;
	status: "pending" | "confirmed" | "cancelled";
	registered_at: string;
	// Optional group identifier when registered as a pair
	pair_id?: string | null;
	event?: Event;
	user?: UserProfile;
}

export interface CreateEventData {
	title: string;
	date: string;
	location?: string;
	latitude?: number;
	longitude?: number;
	prizes?: string;
	max_participants: number;
	registration_deadline: string;
}

// API Response types
export interface ApiResponse<T = any> {
	data?: T;
	error?: string;
	message?: string;
}

// Matches related types
export interface Match {
	id: number;
	event_id: number;
	winner_pair: 1 | 2 | null;
	match_date: string;
	created_at: string;
	updated_at: string;
	user_matches?: UserMatch[];
}

export interface UserMatch {
	position: number;
	users: {
		id: string;
		name: string | null;
		surname: string | null;
		avatar_url: string | null;
	};
}

export interface MatchPlayer {
	id: string;
	name: string | null;
	surname: string | null;
	avatar_url: string | null;
	score?: number;
}

export interface CreateMatchData {
	players: string[]; // Array of 1-4 user IDs
	winner_pair?: 1 | 2;
}

export interface MatchesListResponse {
	event: {
		id: number;
		title: string;
	};
	matches: Match[];
}

// Pair Invites related types
export type PairInviteStatus = "sent" | "accepted" | "declined" | "revoked" | "expired";

export interface PairInvite {
	id: number;
	event_id: number;
	inviter_id: string;
	invitee_id: string | null;
	invitee_email: string | null;
	status: PairInviteStatus;
	token: string; // secure random token for email links
	short_code: string | null; // optional 6-8 char human code for join by code
	created_at: string;
	expires_at: string | null;
	accepted_at?: string | null;
	declined_at?: string | null;
}
