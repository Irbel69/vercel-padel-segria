"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { redirect, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	AlertCircle,
	Search,
	Plus,
	ArrowLeft,
	Swords,
	Crown,
	X,
	ChevronDown,
	Check,
	Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
	Event,
	Match,
	MatchPlayer,
	CreateMatchData,
	MatchesListResponse,
} from "@/types";

interface PadelCourtProps {
	players: (MatchPlayer | null)[];
	onPlayerChange: (position: number, player: MatchPlayer | null) => void;
	winnerPair: 1 | 2 | null;
	onWinnerChange: (pair: 1 | 2 | null) => void;
	disabled?: boolean;
}

const PadelCourt = ({
	players,
	onPlayerChange,
	winnerPair,
	onWinnerChange,
	disabled = false,
}: PadelCourtProps) => {
	const playerCount = players.filter((p) => p !== null).length;

	const getPlayerPosition = (index: number) => {
		const positions = [
			"top-2 left-2", // Position 1 - Parella 1 (izquierda arriba)
			"top-2 right-2", // Position 2 - Parella 2 (derecha arriba)
			"bottom-2 left-2", // Position 3 - Parella 1 (izquierda abajo)
			"bottom-2 right-2", // Position 4 - Parella 2 (derecha abajo)
		];
		return positions[index];
	};

	const getPlayerSlot = (player: MatchPlayer | null, position: number) => {
		// Los slots de la izquierda (1 y 3) son parella 1
		// Los slots de la derecha (2 y 4) son parella 2
		const isPair1 = position === 1 || position === 3;
		const isPair2 = position === 2 || position === 4;
		const isWinningPair =
			(isPair1 && winnerPair === 1) || (isPair2 && winnerPair === 2);

		return (
			<div
				className={`w-20 h-16 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-xs relative ${
					player
						? isWinningPair
							? "bg-padel-primary/30 border-padel-primary text-black"
							: "bg-white/10 border-white/30 text-white"
						: "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
				} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
				onClick={() => {
					if (!disabled) {
						if (player) {
							// Remove player
							onPlayerChange(position, null);
						} else {
							// Add player - pass a dummy player to trigger selector
							onPlayerChange(position, {
								id: "",
								name: "",
								surname: "",
								avatar_url: null,
							});
						}
					}
				}}>
				{player ? (
					<>
						<Avatar className="w-8 h-8">
							<AvatarImage src={player.avatar_url || ""} />
							<AvatarFallback className="text-xs">
								{((player.name || "")[0] || "") +
									((player.surname || "")[0] || "")}
							</AvatarFallback>
						</Avatar>
						<span className="text-[10px] text-center mt-1 leading-none">
							{player.name} {player.surname}
						</span>
						{!disabled && (
							<X className="w-3 h-3 absolute -top-1 -right-1 bg-red-500 rounded-full text-white" />
						)}
					</>
				) : (
					<>
						<Plus className="w-6 h-6 text-white/40" />
						<span className="text-white/40">
							{playerCount === 0 ? "Jugador" : "Opcional"}
						</span>
					</>
				)}
			</div>
		);
	};

	return (
		<div className="relative">
			{/* Court */}
			<div className="w-80 h-60 bg-green-900/20 border-2 border-white/30 rounded-lg relative">
				{/* Net - Vertical line (thick) representing the net */}
				<div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/70 transform -translate-x-0.5"></div>

				{/* Service lines - Horizontal lines (thinner) */}
				<div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 transform -translate-y-0.5"></div>

				{/* Player positions */}
				{players.map((player, index) => (
					<div key={index} className={`absolute ${getPlayerPosition(index)}`}>
						{getPlayerSlot(player, index + 1)}
					</div>
				))}
			</div>

			{/* Winner crowns */}
			{!disabled && (
				<>
					{/* Pair 1 crown (left side) */}
					<div
						className={`absolute -top-8 left-16 cursor-pointer transition-all duration-200 ${
							winnerPair === 1
								? "text-padel-primary scale-110"
								: "text-white/30 hover:text-white/60"
						}`}
						onClick={() => onWinnerChange(winnerPair === 1 ? null : 1)}>
						<Crown className="w-6 h-6" />
					</div>

					{/* Pair 2 crown (right side) */}
					<div
						className={`absolute -top-8 right-16 cursor-pointer transition-all duration-200 ${
							winnerPair === 2
								? "text-padel-primary scale-110"
								: "text-white/30 hover:text-white/60"
						}`}
						onClick={() => onWinnerChange(winnerPair === 2 ? null : 2)}>
						<Crown className="w-6 h-6" />
					</div>
				</>
			)}

			{/* Labels */}
			<div className="flex justify-between mt-4 text-sm text-white/60">
				<span>
					Parella 1 {playerCount < 4 && playerCount > 0 ? "(pos. 1,3)" : ""}
				</span>
				<span>
					Parella 2 {playerCount < 4 && playerCount > 0 ? "(pos. 2,4)" : ""}
				</span>
			</div>
		</div>
	);
};

interface PlayerSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPlayerSelect: (player: MatchPlayer) => void;
	selectedPlayers: (MatchPlayer | null)[];
}

const PlayerSelector = ({
	open,
	onOpenChange,
	onPlayerSelect,
	selectedPlayers,
}: PlayerSelectorProps) => {
	const [players, setPlayers] = useState<MatchPlayer[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const selectedPlayerIds = selectedPlayers
		.filter((p) => p !== null)
		.map((p) => p!.id);

	const fetchPlayers = async (search: string = "") => {
		try {
			setIsLoading(true);
			const params = new URLSearchParams();
			if (search) params.append("search", search);

			const response = await fetch(`/api/admin/users/search?${params}`);
			const data = await response.json();

			if (response.ok) {
				setPlayers(data.users || []);
			}
		} catch (error) {
			console.error("Error fetching players:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			fetchPlayers(searchTerm);
		}
	}, [open, searchTerm]);

	const filteredPlayers = players.filter(
		(player) => !selectedPlayerIds.includes(player.id)
	);

	return (
		<Command>
			<CommandInput
				placeholder="Buscar jugador..."
				value={searchTerm}
				onValueChange={setSearchTerm}
			/>
			<CommandList>
				<CommandEmpty>
					{isLoading ? "Carregant..." : "No s'han trobat jugadors"}
				</CommandEmpty>
				<CommandGroup>
					{filteredPlayers.map((player) => (
						<CommandItem
							key={player.id}
							onSelect={() => {
								onPlayerSelect(player);
								onOpenChange(false);
							}}
							className="flex items-center gap-2">
							<Avatar className="w-8 h-8">
								<AvatarImage src={player.avatar_url || ""} />
								<AvatarFallback>
									{((player.name || "")[0] || "") +
										((player.surname || "")[0] || "")}
								</AvatarFallback>
							</Avatar>
							<div>
								<div className="font-medium">
									{player.name} {player.surname}
								</div>
								{player.score !== undefined && (
									<div className="text-sm text-muted-foreground">
										Puntuació: {player.score}
									</div>
								)}
							</div>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
};

export default function EventMatchesPage({
	params,
}: {
	params: { id: string };
}) {
	const { user, profile, isLoading: userLoading } = useUser();
	const router = useRouter();
	const eventId = parseInt(params.id);

	const [event, setEvent] = useState<Event | null>(null);
	const [matches, setMatches] = useState<Match[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Create match modal
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedPlayers, setSelectedPlayers] = useState<
		(MatchPlayer | null)[]
	>([null, null, null, null]);
	const [winnerPair, setWinnerPair] = useState<1 | 2 | null>(null);
	const [playerSelectorOpen, setPlayerSelectorOpen] = useState(false);
	const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

	// Redirect if not admin
	useEffect(() => {
		if (!userLoading && (!profile || !profile.is_admin)) {
			redirect("/dashboard");
		}
	}, [profile, userLoading]);

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

	useEffect(() => {
		if (profile?.is_admin && !isNaN(eventId)) {
			fetchMatches();
		}
	}, [profile?.is_admin, eventId]);

	const handlePlayerChange = (position: number, player: MatchPlayer | null) => {
		if (player === null) {
			// Remove player
			const newPlayers = [...selectedPlayers];
			newPlayers[position - 1] = null;
			setSelectedPlayers(newPlayers);
		} else if (player.id === "") {
			// Dummy player - open selector for adding player
			setSelectedPosition(position - 1);
			setPlayerSelectorOpen(true);
		}
	};

	const handlePlayerSelect = (player: MatchPlayer) => {
		if (selectedPosition !== null) {
			const newPlayers = [...selectedPlayers];
			newPlayers[selectedPosition] = player;
			setSelectedPlayers(newPlayers);
			setSelectedPosition(null);
			setPlayerSelectorOpen(false);
		}
	};

	const resetCreateForm = () => {
		setSelectedPlayers([null, null, null, null]);
		setWinnerPair(null);
		setSelectedPosition(null);
		setPlayerSelectorOpen(false);
	};

	const handleCreateMatch = async () => {
		try {
			setIsSubmitting(true);
			setError(null);

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

			setIsCreateModalOpen(false);
			resetCreateForm();
			fetchMatches();
		} catch (err) {
			console.error("Error creating match:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteMatch = async (matchId: number) => {
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ca-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getPlayerName = (userMatch: any) => {
		const user = userMatch.users;
		return `${user.name || ""} ${user.surname || ""}`.trim() || "Sense nom";
	};

	const getPlayerAvatar = (userMatch: any) => {
		return userMatch.users.avatar_url;
	};

	// Show loading while checking user permissions
	if (userLoading || (!profile?.is_admin && !error)) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-6 px-4 md:px-0">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.back()}
						className="bg-white/10 border-white/20 text-white hover:bg-white/20">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex flex-col sm:flex-row sm:items-center gap-3">
						<div className="p-2 bg-padel-primary/20 rounded-lg">
							<Swords className="h-6 w-6 text-padel-primary" />
						</div>
						<div>
							<h1 className="text-2xl md:text-3xl font-bold text-white">
								Partits - {event?.title || "Carregant..."}
							</h1>
							<p className="text-white/60 text-sm md:text-base">
								Gestiona els partits del torneig
							</p>
						</div>
					</div>
				</div>
				<Button
					onClick={() => setIsCreateModalOpen(true)}
					className="bg-padel-primary text-black hover:bg-padel-primary/90 w-full sm:w-auto">
					<Plus className="h-4 w-4 mr-2" />
					<span className="sm:hidden">Nou Partit</span>
					<span className="hidden sm:inline">Crear Partit</span>
				</Button>
			</div>

			{/* Error Message */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Matches List */}
			<Card className="bg-white/5 border-white/10">
				<CardHeader>
					<CardTitle className="text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<span className="text-lg md:text-xl">Partits</span>
						{matches.length > 0 && (
							<Badge
								variant="secondary"
								className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto">
								{matches.length} {matches.length === 1 ? "partit" : "partits"}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-32 w-full" />
							))}
						</div>
					) : matches.length === 0 ? (
						<div className="text-center py-8">
							<Swords className="h-12 w-12 text-white/40 mx-auto mb-4" />
							<p className="text-white/60">
								No hi ha partits creats per aquest torneig
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{matches.map((match) => {
								// Get all players in the match
								const allPlayers = match.user_matches || [];
								const totalPlayers = allPlayers.length;

								// Traditional pair logic for 4 players
								const pair1 =
									allPlayers.filter(
										(um) => um.position === 1 || um.position === 3
									) || [];
								const pair2 =
									allPlayers.filter(
										(um) => um.position === 2 || um.position === 4
									) || [];

								// For less than 4 players, show them all in a single list
								const showAsPairs = totalPlayers === 4;

								return (
									<div
										key={match.id}
										className="p-4 rounded-lg bg-white/5 border border-white/10">
										<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-3">
													<h3 className="text-white font-semibold">
														Partit #{match.id}
													</h3>
													{match.winner_pair && (
														<Badge className="bg-padel-primary/20 text-padel-primary">
															Guanyadora: Parella {match.winner_pair}
														</Badge>
													)}
													{totalPlayers < 4 && (
														<Badge
															variant="outline"
															className="border-orange-500/30 text-orange-400">
															{totalPlayers} jugador
															{totalPlayers !== 1 ? "s" : ""}
														</Badge>
													)}
												</div>

												{showAsPairs ? (
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														{/* Pair 1 */}
														<div
															className={`p-3 rounded-lg border ${
																match.winner_pair === 1
																	? "bg-padel-primary/10 border-padel-primary/30"
																	: "bg-white/5 border-white/10"
															}`}>
															<div className="flex items-center gap-2 mb-2">
																<span className="text-sm font-medium text-white/80">
																	Parella 1
																</span>
																{match.winner_pair === 1 && (
																	<Crown className="w-4 h-4 text-padel-primary" />
																)}
															</div>
															<div className="space-y-2">
																{pair1.map((userMatch) => (
																	<div
																		key={userMatch.users.id}
																		className="flex items-center gap-2">
																		<Avatar className="w-6 h-6">
																			<AvatarImage
																				src={getPlayerAvatar(userMatch)}
																			/>
																			<AvatarFallback className="text-xs">
																				{((userMatch.users.name || "")[0] ||
																					"") +
																					((userMatch.users.surname || "")[0] ||
																						"")}
																			</AvatarFallback>
																		</Avatar>
																		<span className="text-sm text-white">
																			{getPlayerName(userMatch)}
																		</span>
																	</div>
																))}
															</div>
														</div>

														{/* Pair 2 */}
														<div
															className={`p-3 rounded-lg border ${
																match.winner_pair === 2
																	? "bg-padel-primary/10 border-padel-primary/30"
																	: "bg-white/5 border-white/10"
															}`}>
															<div className="flex items-center gap-2 mb-2">
																<span className="text-sm font-medium text-white/80">
																	Parella 2
																</span>
																{match.winner_pair === 2 && (
																	<Crown className="w-4 h-4 text-padel-primary" />
																)}
															</div>
															<div className="space-y-2">
																{pair2.map((userMatch) => (
																	<div
																		key={userMatch.users.id}
																		className="flex items-center gap-2">
																		<Avatar className="w-6 h-6">
																			<AvatarImage
																				src={getPlayerAvatar(userMatch)}
																			/>
																			<AvatarFallback className="text-xs">
																				{((userMatch.users.name || "")[0] ||
																					"") +
																					((userMatch.users.surname || "")[0] ||
																						"")}
																			</AvatarFallback>
																		</Avatar>
																		<span className="text-sm text-white">
																			{getPlayerName(userMatch)}
																		</span>
																	</div>
																))}
															</div>
														</div>
													</div>
												) : (
													<div className="p-3 rounded-lg bg-white/5 border border-white/10">
														<div className="flex items-center gap-2 mb-2">
															<span className="text-sm font-medium text-white/80">
																Jugadors
															</span>
														</div>
														<div className="space-y-2">
															{allPlayers
																.sort((a, b) => a.position - b.position)
																.map((userMatch) => (
																	<div
																		key={userMatch.users.id}
																		className="flex items-center gap-2">
																		<Avatar className="w-6 h-6">
																			<AvatarImage
																				src={getPlayerAvatar(userMatch)}
																			/>
																			<AvatarFallback className="text-xs">
																				{((userMatch.users.name || "")[0] ||
																					"") +
																					((userMatch.users.surname || "")[0] ||
																						"")}
																			</AvatarFallback>
																		</Avatar>
																		<span className="text-sm text-white">
																			{getPlayerName(userMatch)}
																		</span>
																		<span className="text-xs text-white/40 ml-auto">
																			Pos. {userMatch.position}
																		</span>
																	</div>
																))}
														</div>
													</div>
												)}

												<div className="mt-3 text-xs text-white/50">
													{formatDate(match.match_date)}
												</div>
											</div>

											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeleteMatch(match.id)}
												className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30">
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Match Modal */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className="bg-black/90 border-white/20 text-white max-w-2xl">
					<DialogHeader>
						<DialogTitle>Crear Nou Partit</DialogTitle>
						<DialogDescription className="text-white/60">
							Selecciona entre 1 i 4 jugadors. Pots escollir la parella
							guanyadora per atorgar punts (només aplicable amb 4 jugadors
							registrats).
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col items-center space-y-6 py-6">
						<PadelCourt
							players={selectedPlayers}
							onPlayerChange={handlePlayerChange}
							winnerPair={winnerPair}
							onWinnerChange={setWinnerPair}
						/>

						<p className="text-sm text-white/60 text-center">
							Fes clic en una posició buida per afegir un jugador.
							<br />
							Utilitza les corones per seleccionar la parella guanyadora.
						</p>

						<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
							<p className="font-medium mb-1">ℹ️ Nota sobre puntuació:</p>
							<p>• Els jugadors en posicions 1 i 3 formen la Parella 1</p>
							<p>• Els jugadors en posicions 2 i 4 formen la Parella 2</p>
							<p>• Els guanyadors reben +10 punts, els perdedors +3 punts</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsCreateModalOpen(false);
								resetCreateForm();
							}}
							className="bg-white/10 border-white/20 text-white hover:bg-white/20">
							Cancel·lar
						</Button>
						<Button
							onClick={handleCreateMatch}
							disabled={
								isSubmitting ||
								selectedPlayers.filter((p) => p !== null).length < 1
							}
							className="bg-padel-primary text-black hover:bg-padel-primary/90">
							{isSubmitting ? "Creant..." : "Crear Partit"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Player Selector Dialog */}
			<Dialog open={playerSelectorOpen} onOpenChange={setPlayerSelectorOpen}>
				<DialogContent className="bg-black/90 border-white/20 text-white max-w-md">
					<DialogHeader>
						<DialogTitle>Seleccionar Jugador</DialogTitle>
						<DialogDescription className="text-white/60">
							Tria un jugador per a la posició{" "}
							{selectedPosition !== null ? selectedPosition + 1 : ""}.
							{selectedPosition !== null &&
								selectedPosition + 1 > 4 &&
								" (opcional)"}
						</DialogDescription>
					</DialogHeader>
					<PlayerSelector
						open={playerSelectorOpen}
						onOpenChange={setPlayerSelectorOpen}
						onPlayerSelect={handlePlayerSelect}
						selectedPlayers={selectedPlayers}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
