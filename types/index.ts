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
	score: number;
	matches_played: number;
	skill_level: number;
	trend: "up" | "down" | "same";
	image_rights_accepted: boolean;
	privacy_policy_accepted: boolean;
	created_at: string;
	updated_at: string;
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

// API Response types
export interface ApiResponse<T = any> {
	data?: T;
	error?: string;
	message?: string;
}
