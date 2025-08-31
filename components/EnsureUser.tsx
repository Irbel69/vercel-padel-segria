"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import type { JSX } from "react";

// Small client component that ensures the user/profile is fetched as soon
// as the page hydrates so child client components (like BookingDialog)
// already have profile data available. It also caches a minimal profile
// in localStorage so other client hook instances can read it synchronously
// to prefill UI fields.
export default function EnsureUser(): JSX.Element | null {
	const { refreshProfile, profile } = useUser();

	// Trigger a profile refresh once on mount to make sure profile is in memory
	useEffect(() => {
		void refreshProfile();
	}, [refreshProfile]);

	// Cache minimal profile fields for synchronous client-side read
	useEffect(() => {
		try {
			if (profile) {
				const minimal = { name: profile.name, surname: profile.surname };
				localStorage.setItem("ps_profile_cache", JSON.stringify(minimal));
			}
		} catch (e) {
			// noop
		}
	}, [profile]);

	return null;
}
