"use client";

import { useQuery } from "@tanstack/react-query";

export interface TopPlayerQuality {
  id: number;
  name: string;
}

export interface TopPlayer {
  id: string;
  name: string | null;
  surname: string | null;
  score: number;
  avatar_url: string | null;
  rank: number;
  isChampion: boolean;
  qualities: TopPlayerQuality[];
}

export interface TopPlayersResponse {
  players: TopPlayer[];
  totalPlayers: number;
}

async function fetchTopPlayers(): Promise<TopPlayersResponse> {
  const res = await fetch("/api/players/top", {
    cache: "no-store",
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data?.error || "Error al carregar top players");
  }
  
  return data;
}

export function useTopPlayers() {
  return useQuery({
    queryKey: ["top-players"],
    queryFn: fetchTopPlayers,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    meta: { 
      onError: (e: unknown) => console.error("Top players error", e) 
    },
  });
}