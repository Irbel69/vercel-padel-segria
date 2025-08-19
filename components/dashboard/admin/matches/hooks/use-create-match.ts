import { useState } from 'react';
import type { MatchPlayer, CreateMatchData } from '../types';

export function useCreateMatch(eventId: number) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedPlayers, setSelectedPlayers] = useState<(MatchPlayer | null)[]>([null, null, null, null]);
	const [winnerPair, setWinnerPair] = useState<1 | 2 | null>(null);
	const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

	const handlePlayerChange = (position: number, player: MatchPlayer | null) => {
		if (player === null) {
			// Remove player
			const newPlayers = [...selectedPlayers];
			newPlayers[position - 1] = null;
			setSelectedPlayers(newPlayers);
		} else if (player.id === "") {
			// Dummy player - open selector for adding player
			setSelectedPosition(position - 1);
			return { shouldOpenSelector: true };
		}
		return { shouldOpenSelector: false };
	};

	const handlePlayerSelect = (player: MatchPlayer) => {
		if (selectedPosition !== null) {
			const newPlayers = [...selectedPlayers];
			newPlayers[selectedPosition] = player;
			setSelectedPlayers(newPlayers);
			setSelectedPosition(null);
			return true;
		}
		return false;
	};

	const resetForm = () => {
		setSelectedPlayers([null, null, null, null]);
		setWinnerPair(null);
		setSelectedPosition(null);
	};

	const createMatch = async (onSuccess: () => void, onError: (error: string) => void) => {
		try {
			setIsSubmitting(true);

			// Validate at least one player is selected
			const playerIds = selectedPlayers.map((p) => p?.id).filter(Boolean);
			if (playerIds.length < 1) {
				throw new Error("Cal seleccionar almenys un jugador");
			}

			const matchData: CreateMatchData = {
				players: playerIds as string[],
				winner_pair: winnerPair || undefined,
			};

			const response = await fetch(`/api/admin/events/${eventId}/matches`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(matchData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error creant el partit");
			}

			resetForm();
			onSuccess();
		} catch (err) {
			console.error("Error creating match:", err);
			onError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		selectedPlayers,
		winnerPair,
		selectedPosition,
		isSubmitting,
		setSelectedPlayers,
		setWinnerPair,
		setSelectedPosition,
		handlePlayerChange,
		handlePlayerSelect,
		resetForm,
		createMatch,
	};
}