"use client";

import { useQuery } from "@tanstack/react-query";

export interface BattlePassPrizeProgress {
	id: number;
	title: string;
	description: string | null;
	points_required: number;
	image_url: string | null;
	display_order: number;
	can_claim: boolean;
	progress_percentage: number;
	is_claimed: boolean;
}

export interface BattlePassProgressResponse {
	user_points: number;
	prizes: BattlePassPrizeProgress[];
	total_prizes: number;
	completed_prizes?: number;
}

async function fetchBattlePassProgress(): Promise<BattlePassProgressResponse> {
	const response = await fetch("/api/battle-pass/progress");
	
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch battle pass progress");
	}

	return response.json();
}

export function useBattlePassProgress() {
	return useQuery<BattlePassProgressResponse, Error>({
		queryKey: ["battle-pass-progress"],
		queryFn: fetchBattlePassProgress,
		staleTime: 1000 * 60 * 2, // 2 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes  
		refetchOnWindowFocus: false,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}