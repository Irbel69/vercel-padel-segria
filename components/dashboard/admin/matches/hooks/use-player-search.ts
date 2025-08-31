import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MatchPlayer } from '../types';

// Hook personalizado para debouncing
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

// Función para fetch de jugadores
async function fetchPlayers(search: string = ""): Promise<MatchPlayer[]> {
	// Validación básica del lado cliente
	if (search.length > 100) {
		throw new Error("Terme de cerca massa llarg");
	}

	// Solo permitir letras, espacios y caracteres catalanes/españoles
	if (search && !/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]*$/.test(search)) {
		throw new Error("Només es permeten lletres i espais");
	}

	const params = new URLSearchParams();
	if (search.trim()) {
		params.append("search", search.trim());
	}

	const response = await fetch(`/api/admin/users/search?${params}`);
	const data = await response.json();

	if (!response.ok) {
		// Manejar errores específicos de validación
		if (response.status === 400) {
			throw new Error(data?.details || data?.error || "Paràmetres de cerca invàlids");
		}
		if (response.status === 429) {
			throw new Error("Massa peticions. Espera uns segons i torna-ho a intentar.");
		}
		throw new Error(data?.error || "Error carregant els jugadors");
	}

	return data.users || [];
}

// Fetch participants for a specific event (registrations -> users mapping)
async function fetchEventParticipants(eventId: number, search: string = ""): Promise<MatchPlayer[]> {
	const params = new URLSearchParams();
	if (search.trim()) params.append('search', search.trim());

	const response = await fetch(`/api/admin/events/${eventId}?${params.toString()}`);
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data?.error || 'Error cargando participantes');
	}

	const regs = data.participants || [];
	return regs.map((r: any) => ({
		id: r.users?.id || String(r.user_id),
		name: r.users?.name || r.name || '',
		surname: r.users?.surname || '',
		avatar_url: r.users?.avatar_url || '',
		score: r.users?.score ?? undefined,
	}));
}


export function usePlayerSearch({ eventId, onlyInscritos }:{ eventId?: number, onlyInscritos?: boolean } = {}) {
	const [searchTerm, setSearchTerm] = useState("");
	
	// Debounce search term para evitar peticiones excesivas
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	
	// Usar React Query para caché automático y gestión de estado
	const {
		data: players = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: onlyInscritos && eventId ? ['admin-event-participants', eventId, debouncedSearchTerm] : ['admin-players', debouncedSearchTerm],
		queryFn: () => (onlyInscritos && eventId ? fetchEventParticipants(eventId, debouncedSearchTerm) : fetchPlayers(debouncedSearchTerm)),
		staleTime: 2 * 60 * 1000, // 2 minutos - los datos se consideran frescos
		gcTime: 5 * 60 * 1000, // 5 minutos - tiempo antes de limpiar caché
		refetchOnWindowFocus: false,
		placeholderData: (prev) => prev, // Mantener datos previos mientras carga
		meta: {
			onError: (error: unknown) => {
				console.error("Error fetching players:", error);
			},
		},
	});

	const getFilteredPlayers = useMemo(() => {
		return (selectedPlayerIds: string[]) => {
			return players.filter(
				(player) => !selectedPlayerIds.includes(player.id)
			);
		};
	}, [players]);

	// Función legacy para compatibilidad
	const fetchPlayersLegacy = () => {
		// Ya no es necesaria, React Query maneja automáticamente las peticiones
	};

	return {
		players,
		searchTerm,
		isLoading,
		error,
		setSearchTerm,
		fetchPlayers: fetchPlayersLegacy,
		getFilteredPlayers,
	};
}