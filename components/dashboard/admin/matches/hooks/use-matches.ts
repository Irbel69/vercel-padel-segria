import { useState, useEffect } from 'react';
import type { Event, Match, MatchesListResponse } from '../types';

export function useMatches(eventId: number, isAdmin: boolean) {
	const [event, setEvent] = useState<Event | null>(null);
	const [matches, setMatches] = useState<Match[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchMatches = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch(`/api/admin/events/${eventId}/matches`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error carregant els partits");
			}

			const typedData = data as MatchesListResponse;
			setEvent(typedData.event as Event);
			setMatches(typedData.matches);
		} catch (err) {
			console.error("Error fetching matches:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setIsLoading(false);
		}
	};

	const deleteMatch = async (matchId: number) => {
		if (!confirm("Estàs segur que vols eliminar aquest partit?")) {
			return;
		}

		try {
			const response = await fetch(
				`/api/admin/events/${eventId}/matches/${matchId}`,
				{
					method: "DELETE",
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error eliminant el partit");
			}

			fetchMatches();
		} catch (err) {
			console.error("Error deleting match:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		}
	};

	useEffect(() => {
		if (isAdmin && !isNaN(eventId)) {
			fetchMatches();
		}
	}, [isAdmin, eventId]);

	return {
		event,
		matches,
		isLoading,
		error,
		setError,
		fetchMatches,
		deleteMatch,
	};
}