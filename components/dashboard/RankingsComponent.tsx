"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, ArrowUp, ArrowDown, Minus, Users, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface RankingPlayer {
	id: string;
	name: string | null;
	surname: string | null;
	avatar_url: string | null;
	position: number;
	points: number;
	matches_played: number;
	matches_won: number;
	recent_form?: ("W"|"L")[];
}

export function RankingsComponent() {
	const [rankings, setRankings] = useState<RankingPlayer[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRankings = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const response = await fetch("/api/rankings");

				if (!response.ok) {
					throw new Error("Error al obtener rankings");
				}

				const data = await response.json();
				setRankings(data.rankings || []);
			} catch (err) {
				console.error("Error fetching rankings:", err);
				setError(err instanceof Error ? err.message : "Error desconocido");
			} finally {
				setIsLoading(false);
			}
		};

		fetchRankings();
	}, []);

	const renderRecentForm = (form: ("W"|"L")[] | undefined) => {
		const items = (form ?? []).slice(0,5);
		const placeholders = Array.from({ length: Math.max(0, 5 - items.length) });
		return (
			<div className="flex items-center justify-center gap-1">
				{items.map((r, i) => (
					<span key={i} className={`w-2.5 h-2.5 rounded-sm ${r === 'W' ? 'bg-green-500' : 'bg-red-500'}`} />
				))}
				{placeholders.map((_, i) => (
					<span key={`p-${i}`} className="w-2.5 h-2.5 rounded-sm bg-white/20" />
				))}
			</div>
		);
	};

	const getTopPlayers = () => {
		return rankings.slice(0, 3);
	};

	return (
		<Card className="bg-white/5 border-white/10">
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-padel-primary/20 rounded-lg">
							<Trophy className="h-6 w-6 text-padel-primary" />
						</div>
						<CardTitle className="text-lg md:text-xl text-white">
							Classificació Global
						</CardTitle>
					</div>
					<Badge
						variant="secondary"
						className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto mt-2 sm:mt-0">
						{rankings.length} jugadors
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center space-x-4">
								<Skeleton className="h-12 w-12 rounded-full" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-[250px]" />
									<Skeleton className="h-4 w-[200px]" />
								</div>
							</div>
						))}
					</div>
				) : error ? (
					<div className="text-center py-6 text-red-400">{error}</div>
				) : (
					<Tabs defaultValue="top" className="space-y-4">
						<TabsList className="bg-white/5 border-white/10">
							<TabsTrigger
								value="top"
								className="data-[state=active]:bg-padel-primary data-[state=active]:text-black">
								Top Jugadors
							</TabsTrigger>
							<TabsTrigger
								value="all"
								className="data-[state=active]:bg-padel-primary data-[state=active]:text-black">
								Classificació Completa
							</TabsTrigger>
						</TabsList>

						{/* Top Players Tab */}
						<TabsContent value="top" className="space-y-6 animate-in fade-in duration-300" forceMount>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{getTopPlayers().map((player, index) => (
									<Card
										key={player.id}
										className={`bg-white/10 border-white/20 overflow-hidden ${
											index === 0 ? "border-padel-primary/50" : ""
										}`}>
										<div
											className={`h-1 ${
												index === 0
													? "bg-padel-primary"
													: index === 1
													? "bg-gray-400"
													: "bg-amber-600"
											}`}></div>
										<CardContent className="pt-6">
											<div className="flex flex-col items-center text-center">
												<div className="relative">
													<Avatar className="w-24 h-24 border-2 border-white/20">
														<AvatarImage src={player.avatar_url || ""} />
														<AvatarFallback className="text-2xl bg-white/10">
															{((player.name || "")[0] || "") +
																((player.surname || "")[0] || "")}
														</AvatarFallback>
													</Avatar>
													<div className="absolute -top-2 -right-2 bg-black rounded-full p-1 border-2 border-padel-primary">
														<span className="text-padel-primary font-bold text-sm">
															{index + 1}
														</span>
													</div>
												</div>

												<h3 className="mt-4 font-semibold text-lg text-white">
													{player.name} {player.surname}
												</h3>

												<div className="mt-4 grid grid-cols-3 w-full gap-2 text-white/80">
													<div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
														<Trophy className="h-4 w-4 text-padel-primary mb-1" />
														<span className="font-bold">{player.points}</span>
														<span className="text-xs text-white/60">Punts</span>
													</div>
													<div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
														<Target className="h-4 w-4 text-padel-primary mb-1" />
														<span className="font-bold">
															{player.matches_played}
														</span>
														<span className="text-xs text-white/60">
															Partits
														</span>
													</div>
													<div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
														<Users className="h-4 w-4 text-padel-primary mb-1" />
														<span className="font-bold">
															{Math.round(
																(player.matches_won /
																	Math.max(1, player.matches_played)) *
																	100
															)}
															%
														</span>
														<span className="text-xs text-white/60">
															Victòries
														</span>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</TabsContent>

						{/* All Players Tab */}
						<TabsContent value="all" className="animate-in fade-in duration-300" forceMount>
							<div className="rounded-md border border-white/10 overflow-hidden">
								<Table>
									<TableHeader className="bg-white/5">
										<TableRow className="hover:bg-white/5">
											<TableHead className="text-white/70 w-12 text-center">
												Pos
											</TableHead>
											<TableHead className="text-white/70">Jugador</TableHead>
											<TableHead className="text-white/70 text-center">
												Partits
											</TableHead>
											<TableHead className="text-white/70 text-center">
												Victòries
											</TableHead>
											<TableHead className="text-white/70 text-center">
												Punts
											</TableHead>
											<TableHead className="text-white/70 text-center">
												Forma
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{rankings.map((player) => (
											<TableRow
												key={player.id}
												className="hover:bg-white/5 border-white/10">
												<TableCell className="text-center font-medium">
													{player.position <= 3 ? (
														<span
															className={`
                              inline-flex items-center justify-center w-6 h-6 rounded-full 
                              ${
																player.position === 1
																	? "bg-padel-primary text-black"
																	: player.position === 2
																	? "bg-gray-400 text-black"
																	: "bg-amber-600 text-black"
															}
                            `}>
															{player.position}
														</span>
													) : (
														player.position
													)}
												</TableCell>
												<TableCell>
													<div className="flex items-center">
														<Avatar className="h-8 w-8 mr-2">
															<AvatarImage src={player.avatar_url || ""} />
															<AvatarFallback className="text-xs">
																{((player.name || "")[0] || "") +
																	((player.surname || "")[0] || "")}
															</AvatarFallback>
														</Avatar>
														<span className="text-white">
															{player.name} {player.surname}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-center text-white/80">
													{player.matches_played}
												</TableCell>
												<TableCell className="text-center text-white/80">
													{player.matches_won}
												</TableCell>
												<TableCell className="text-center">
													<span className="text-padel-primary font-bold">
														{player.points}
													</span>
												</TableCell>
												<TableCell className="text-center">
													{renderRecentForm(player.recent_form)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</TabsContent>
					</Tabs>
				)}
			</CardContent>
		</Card>
	);
}
