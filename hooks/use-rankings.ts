"use client";

import { useQuery } from "@tanstack/react-query";

export interface RankingPlayer {
  id: string;
  name: string | null;
  surname: string | null;
  avatar_url: string | null;
  trend: "up" | "down" | "same";
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

export interface RankingsResponse {
  players: RankingPlayer[];
  pagination: RankingsPagination;
}

async function fetchRankings(page = 1, limit = 10): Promise<RankingsResponse> {
  const res = await fetch(`/api/rankings?page=${page}&limit=${limit}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Error al carregar rànking");
  return data;
}

export function useRankings(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["rankings", page, limit],
    queryFn: () => fetchRankings(page, limit),
  placeholderData: (prev) => prev,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    meta: { onError: (e: unknown) => console.error("Rankings error", e) },
  });
}
