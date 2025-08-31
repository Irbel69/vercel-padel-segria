import type { Event, Match, MatchPlayer, CreateMatchData, MatchesListResponse } from "@/types";

export type { Event, Match, MatchPlayer, CreateMatchData, MatchesListResponse };

export interface PadelCourtProps {
	players: (MatchPlayer | null)[];
	onPlayerChange: (position: number, player: MatchPlayer | null) => void;
	winnerPair: 1 | 2 | null;
	onWinnerChange: (pair: 1 | 2 | null) => void;
	disabled?: boolean;
}

export interface PlayerSlotProps {
	player: MatchPlayer | null;
	position: number;
	isWinningPair: boolean;
	playerCount: number;
	disabled?: boolean;
	onPlayerChange: (position: number, player: MatchPlayer | null) => void;
}

export interface PlayerSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPlayerSelect: (player: MatchPlayer) => void;
	selectedPlayers: (MatchPlayer | null)[];
	eventId?: number;
}

export interface MatchCardProps {
	match: Match;
	onDelete: (matchId: number) => void;
	onUpdated?: () => void;
	eventId?: number;
}

export interface MatchPairProps {
	players: any[];
	isWinner: boolean;
	pairNumber: 1 | 2;
	showCrown?: boolean;
}

export interface MatchesListProps {
	matches: Match[];
	isLoading: boolean;
	onDeleteMatch: (matchId: number) => void;
	onUpdated?: () => void;
	eventId?: number;
}

export interface CreateMatchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventId: number;
	onMatchCreated: () => void;
}