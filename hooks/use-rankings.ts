"use client";

import { useQuery } from "@tanstack/react-query";
import type { RankingsResponse } from "@/types/rankings";

export interface RankingPlayer {
	id: string;
	name: string | null;
	surname: string | null;
	avatar_url: string | null;
	recent_form: ("W" | "L" | "N")[];
	total_points: number;
	ranking_position: number;
	// optional fields for dashboard view
	matches_played?: number;
	matches_won?: number;
}

export interface RankingsPagination {
	currentPage: number;
	totalPages: number;
	totalPlayers: number;
	hasMore: boolean;
	limit: number;
}

export interface RankingsResponseLocal extends RankingsResponse {}

async function fetchRankings(
	page = 1,
	limit = 10,
	userId?: string
): Promise<RankingsResponseLocal> {
	const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
	if (userId) qs.set("userId", userId);
	const res = await fetch(`/api/rankings?${qs.toString()}`, {
		cache: "no-store",
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data?.error || "Error al carregar rànking");
	return data;
}

export function useRankings(page = 1, limit = 10, userId?: string) {
	return useQuery({
		queryKey: ["rankings", page, limit, userId ?? null],
		queryFn: () => fetchRankings(page, limit, userId),
		placeholderData: (prev) => prev,
		staleTime: 60_000,
		gcTime: 5 * 60_000,
		refetchOnWindowFocus: false,
		meta: { onError: (e: unknown) => console.error("Rankings error", e) },
	});
}
