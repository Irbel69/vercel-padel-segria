import { useMemo, useState } from 'react';
import type { Match, MatchPlayer } from '../types';

interface UseEditMatchOptions {
  eventId: number;
  match: Match;
}

export function useEditMatch({ eventId, match }: UseEditMatchOptions) {
  const initialPlayers = useMemo<(MatchPlayer | null)[]>(() => {
    // Map positions 1..4 to array indexes 0..3
    const arr: (MatchPlayer | null)[] = [null, null, null, null];
    (match.user_matches || [])
      .sort((a, b) => a.position - b.position)
      .forEach((um) => {
        const idx = Math.max(0, Math.min(3, um.position - 1));
        arr[idx] = {
          id: um.users.id,
          name: um.users.name,
          surname: um.users.surname,
          avatar_url: um.users.avatar_url,
        };
      });
    return arr;
  }, [match.user_matches]);

  const [selectedPlayers, setSelectedPlayers] = useState<(MatchPlayer | null)[]>(initialPlayers);
  const [winnerPair, setWinnerPair] = useState<1 | 2 | null>(match.winner_pair);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlayerChange = (position: number, player: MatchPlayer | null) => {
    if (player === null) {
      const newPlayers = [...selectedPlayers];
      newPlayers[position - 1] = null;
      setSelectedPlayers(newPlayers);
    } else if ((player as any).id === '') {
      setSelectedPosition(position - 1);
      return { shouldOpenSelector: true } as const;
    }
    return { shouldOpenSelector: false } as const;
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
    setSelectedPlayers(initialPlayers);
    setWinnerPair(match.winner_pair);
    setSelectedPosition(null);
  };

  const updateMatch = async (
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    try {
      setIsSubmitting(true);

      // Build payload only with fields to update
      const playerIds = selectedPlayers.map((p) => p?.id).filter(Boolean) as string[];
      if (playerIds.length < 1) {
        throw new Error("Cal seleccionar almenys un jugador");
      }

      const body: any = {
        players: playerIds,
      };
      // Allow null to clear winner, undefined to keep
      body.winner_pair = winnerPair === null ? null : winnerPair;

      const res = await fetch(`/api/admin/events/${eventId}/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Error actualitzant el partit');
      }
      onSuccess();
    } catch (err) {
      console.error('Error updating match:', err);
      onError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedPlayers,
    winnerPair,
    selectedPosition,
    isSubmitting,
    setWinnerPair,
    handlePlayerChange,
    handlePlayerSelect,
    resetForm,
    updateMatch,
  };
}
