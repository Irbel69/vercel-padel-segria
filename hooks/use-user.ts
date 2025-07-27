import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserProfile {
	id: string;
	email: string;
	name: string | null;
	surname: string | null;
	phone: string | null;
	avatar_url: string | null;
	is_admin: boolean;
	score: number;
	matches_played: number;
	skill_level: number;
	trend: "up" | "down" | "same";
	created_at: string;
	updated_at: string;
}

interface UseUserReturn {
	user: User | null;
	profile: UserProfile | null;
	isLoading: boolean;
	error: string | null;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

export function useUser(): UseUserReturn {
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const supabase = createClient();

	const fetchProfile = async (userId: string) => {
		try {
			const response = await fetch("/api/auth/profile");
			const data = await response.json();

			if (response.ok && data.user?.profile) {
				setProfile(data.user.profile);
			} else {
				setProfile(null);
			}
		} catch (err) {
			console.error("Error fetching profile:", err);
			setError("Error carregant el perfil");
		}
	};

	const refreshProfile = async () => {
		if (user) {
			await fetchProfile(user.id);
		}
	};

	const signOut = async () => {
		try {
			await supabase.auth.signOut();
			setUser(null);
			setProfile(null);
		} catch (err) {
			console.error("Error signing out:", err);
			setError("Error tancant sessió");
		}
	};

	useEffect(() => {
		// Get initial session
		const getSession = async () => {
			try {
				const {
					data: { user: currentUser },
				} = await supabase.auth.getUser();
				setUser(currentUser);

				if (currentUser) {
					await fetchProfile(currentUser.id);
				}
			} catch (err) {
				console.error("Error getting session:", err);
				setError("Error obtenint la sessió");
			} finally {
				setIsLoading(false);
			}
		};

		getSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			const currentUser = session?.user ?? null;
			setUser(currentUser);

			if (currentUser) {
				await fetchProfile(currentUser.id);
			} else {
				setProfile(null);
			}

			setIsLoading(false);
		});

		return () => subscription.unsubscribe();
	}, [supabase.auth]);

	return {
		user,
		profile,
		isLoading,
		error,
		signOut,
		refreshProfile,
	};
}
