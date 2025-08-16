import { useQuery } from "@tanstack/react-query";

interface UserStats {
	matchesPlayed: number;
	matchesWon: number;
	winPercentage: number;
	userScore: number;
}

async function fetchUserStats(): Promise<UserStats> {
	const res = await fetch("/api/user/stats", { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to fetch user stats");
	return res.json();
}

export function useUserStats() {
	const query = useQuery({
		queryKey: ["user", "stats"],
		queryFn: fetchUserStats,
		staleTime: 60_000,
		gcTime: 5 * 60_000,
		refetchOnWindowFocus: false,
		meta: { onError: (err: unknown) => console.error("User stats error", err) },
	});

	return { stats: query.data ?? null, loading: query.isLoading, error: query.error ? String(query.error) : null };
}
