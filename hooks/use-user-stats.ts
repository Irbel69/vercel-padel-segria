import { useEffect, useState } from "react";

interface UserStats {
	matchesPlayed: number;
	matchesWon: number;
	winPercentage: number;
	userScore: number;
}

export function useUserStats() {
	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchStats() {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch("/api/user/stats");

				if (!response.ok) {
					throw new Error("Failed to fetch user stats");
				}

				const data = await response.json();
				setStats(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		}

		fetchStats();
	}, []);

	return { stats, loading, error };
}
