"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Trophy,
	Medal,
	TrendingUp,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

interface RankingPlayer {
	id: string;
	name: string | null;
	surname: string | null;
	avatar_url: string | null;
	trend: "up" | "down" | "same";
	total_points: number;
	ranking_position: number;
}

interface RankingsResponse {
	players: RankingPlayer[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalPlayers: number;
		hasMore: boolean;
		limit: number;
	};
}

const DEFAULT_LIMIT = 10;

export function RankingsSection() {
	const [players, setPlayers] = useState<RankingPlayer[]>([]);
	const [pagination, setPagination] = useState<
		RankingsResponse["pagination"] | null
	>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRankings = async (
		page: number = 1,
		limit: number = DEFAULT_LIMIT
	) => {
		try {
			setIsLoading(true);
			setError(null);
			const res = await fetch(`/api/rankings?page=${page}&limit=${limit}`, {
				cache: "no-store",
			});
			const data: RankingsResponse | { error: string } = await res.json();
			if (!res.ok)
				throw new Error((data as any).error || "Error al obtenir el rànking");
			const r = data as RankingsResponse;
			setPlayers(r.players);
			setPagination(r.pagination);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error desconegut");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchRankings(1, DEFAULT_LIMIT);
	}, []);

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return (
					<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-padel-primary text-black font-bold">
						1
					</span>
				);
			case 2:
				return <Medal className="w-5 h-5 text-gray-400" />;
			case 3:
				return <Medal className="w-5 h-5 text-amber-600" />;
			default:
				return <span className="text-gray-400 font-bold">#{rank}</span>;
		}
	};

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case "up":
				return <TrendingUp className="w-4 h-4 text-green-400" />;
			case "down":
				return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
			default:
				return <div className="w-4 h-4 bg-gray-400 rounded-full opacity-50" />;
		}
	};

	const handlePrev = () => {
		if (!pagination) return;
		const newPage = Math.max(1, pagination.currentPage - 1);
		if (newPage !== pagination.currentPage)
			fetchRankings(newPage, pagination.limit);
	};

	const handleNext = () => {
		if (!pagination) return;
		const newPage = pagination.currentPage + 1;
		if (pagination.hasMore) fetchRankings(newPage, pagination.limit);
	};

	return (
		<section id="rankings" className="py-24 relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -left-40 w-80 h-80 bg-padel-primary/10 rounded-full blur-3xl" />
				<div className="absolute top-1/2 -right-40 w-96 h-96 bg-padel-primary/5 rounded-full blur-3xl" />
				<div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-padel-primary/8 rounded-full blur-3xl" />
			</div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Header */}
				<div className="text-center mb-8 md:mb-12">
					<div className="flex items-center justify-center gap-3 mb-4">
						<Trophy className="w-8 h-8 text-padel-primary" />
						<h2 className="text-4xl md:text-5xl font-bold text-white">
							Classificació Global
						</h2>
						<Trophy className="w-8 h-8 text-padel-primary" />
					</div>
					{pagination && (
						<p className="text-sm text-gray-300">
							<Badge className="bg-padel-primary/20 text-padel-primary border border-padel-primary/20">
								{pagination.totalPlayers} jugadors
							</Badge>
						</p>
					)}
				</div>

				{/* Rankings Table */}
				<Card
					className="mb-6 border-0"
					style={{
						background: "rgba(255, 255, 255, 0.1)",
						borderRadius: "16px",
						boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
						backdropFilter: "blur(5px)",
						WebkitBackdropFilter: "blur(5px)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
					}}>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							{isLoading ? (
								<div className="p-6 text-center text-white/70">
									Carregant...
								</div>
							) : error ? (
								<div className="p-6 text-center text-red-400">{error}</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow className="border-b border-white/10 hover:bg-transparent">
											<TableHead className="text-gray-300 font-semibold py-4 px-6">
												Posició
											</TableHead>
											<TableHead className="text-gray-300 font-semibold py-4">
												Jugador
											</TableHead>
											<TableHead className="text-gray-300 font-semibold py-4 text-center">
												Punts
											</TableHead>
											<TableHead className="text-gray-300 font-semibold py-4 text-center">
												Tendència
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{players.map((player) => (
											<TableRow
												key={player.id}
												className="border-b border-white/5 hover:bg-white/5 transition-colors">
												<TableCell className="py-4 px-6">
													<div className="flex items-center gap-2">
														{getRankIcon(player.ranking_position)}
													</div>
												</TableCell>
												<TableCell className="py-4">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gray-600 text-white">
															{((player.name || "")[0] || "") +
																((player.surname || "")[0] || "")}
														</div>
														<div>
															<p className="font-semibold text-white">
																{player.name} {player.surname}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell className="py-4 text-center">
													<span className="text-padel-primary font-bold">
														{player.total_points}
													</span>
												</TableCell>
												<TableCell className="py-4 text-center">
													{getTrendIcon(player.trend)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Pagination */}
				{pagination && pagination.totalPages > 1 && (
					<div className="flex items-center justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={handlePrev}
							disabled={pagination.currentPage === 1}
							className="bg-white/10 border-white/20 text-white hover:bg-white/20">
							<ChevronLeft className="w-4 h-4" />
						</Button>
						<p className="text-white/70 text-sm">
							Pàgina {pagination.currentPage} de {pagination.totalPages}
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={handleNext}
							disabled={!pagination.hasMore}
							className="bg-white/10 border-white/20 text-white hover:bg-white/20">
							<ChevronRight className="w-4 h-4" />
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}
