"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ClaimPrizeRequest {
	prize_id: number;
}

interface ClaimPrizeResponse {
	success: boolean;
	message: string;
	prize: {
		id: number;
		title: string;
		description: string | null;
		points_required: number;
		image_url: string | null;
	};
}

async function claimPrize(data: ClaimPrizeRequest): Promise<ClaimPrizeResponse> {
	const response = await fetch("/api/battle-pass/claim", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to claim prize");
	}

	return response.json();
}

export function useClaimPrize() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: claimPrize,
		onSuccess: (response) => {
			// Show success toast
			toast.success(response.message, {
				description: `You've claimed "${response.prize.title}"!`,
				duration: 4000,
			});

			// Invalidate and refetch battle pass progress
			queryClient.invalidateQueries({ queryKey: ["battle-pass-progress"] });
		},
		onError: (error: Error) => {
			// Show error toast
			toast.error("Failed to claim prize", {
				description: error.message,
				duration: 4000,
			});
		},
	});
}