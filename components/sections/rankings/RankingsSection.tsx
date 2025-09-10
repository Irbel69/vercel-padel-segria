"use client";

import { useState } from "react";
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
import { Trophy, Medal, ChevronLeft, ChevronRight } from "lucide-react";
import { useRankings } from "@/hooks/use-rankings";
import type { RankingPlayer } from "@/hooks/use-rankings";
import { useUser } from "@/hooks/use-user";

const DEFAULT_LIMIT = 10;

type RankingsSectionProps = {
	/** Hide the Prev/Next buttons when false (landing page) */
	showNavButtons?: boolean;
	/** Hide the internal section header when the parent page provides its own header */
	showHeader?: boolean;
};

export function RankingsSection({ showNavButtons = true, showHeader = true }: RankingsSectionProps) {
	const [page, setPage] = useState(1);
	const { user } = useUser();
	const userId = user?.id;
	const { data, isLoading, error } = useRankings(page, DEFAULT_LIMIT, userId);
	// Ensure we only render the top DEFAULT_LIMIT players for the page
	const players = (data?.players ?? []).slice(0, DEFAULT_LIMIT);
	const pagination = data?.pagination ?? null;
	const contextRows = data?.contextRows ?? [];

	const userInPage = userId ? players.some((p) => p.id === userId) : false;

	// If the user is not in the current page and we have contextRows (user's row),
	// only keep the single row that corresponds to the current user so we can show
	// a highlighted "your position" row below the top list.
	const extraRows: RankingPlayer[] = [];
	if (userId && !userInPage && contextRows.length > 0) {
		const userRow = contextRows.find((r) => r.id === userId);
		if (userRow && !players.some((p) => p.id === userRow.id)) {
			extraRows.push(userRow);
		}
	}

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return (
					<span className="inline-flex items-center justify-center w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-padel-primary text-black font-bold text-xs sm:text-sm">
						1
					</span>
				);
			case 2:
				return <Medal className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />;
			case 3:
				return <Medal className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" />;
			default:
				return (
					<span className="text-gray-400 font-bold text-xs sm:text-sm">
						#{rank}
					</span>
				);
		}
	};

	const renderRecentForm = (form: ("W" | "L" | "N")[]) => {
		const max = 5;
		const items = form.slice(0, max);
		const placeholdersCount = Math.max(0, max - items.length);
		const reversed = [...items].reverse(); // oldest on the left, newest on the right
		return (
			<div className="flex items-center gap-1 justify-center">
				{Array.from({ length: placeholdersCount }).map((_, idx) => (
					<span
						key={`p-${idx}`}
						className="w-2.5 h-2.5 rounded-sm bg-white/20"
					/>
				))}
				{reversed.map((r, idx) => (
					<span
						key={idx}
						aria-label={
							r === "W" ? "Victòria" : r === "L" ? "Derrota" : "Sense resultat"
						}
						className={`w-2.5 h-2.5 rounded-sm ${
							r === "W"
								? "bg-green-500"
								: r === "L"
								? "bg-red-500"
								: "bg-gray-400"
						}`}
					/>
				))}
			</div>
		);
	};

	const handlePrev = () => {
		if (!pagination) return;
		const newPage = Math.max(1, page - 1);
		if (newPage !== page) setPage(newPage);
	};

	const handleNext = () => {
		if (!pagination) return;
		const newPage = page + 1;
		if (pagination.hasMore) setPage(newPage);
	};

	return (
		<section id="rankings">
			<div className="container mx-auto px-3 sm:px-4 relative z-10">
				{/* Header (rendered only when showHeader=true) */}
				{showHeader && (
					<div className="text-left sm:text-center mb-6 md:mb-12">
						<div className="flex items-center justify-center gap-3 mb-4">
							<Trophy className="w-7 h-7 text-padel-primary" />
							<h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
								Rankings
							</h2>
							<Trophy className="w-7 h-7 text-padel-primary" />
						</div>
						{pagination && (
							<p className="text-center text-lg sm:text-sm text-gray-300">
								<Badge className="bg-padel-primary/20 text-padel-primary border border-padel-primary/20 text-xs sm:text-sm">
									{pagination.totalPlayers} jugadors
								</Badge>
							</p>
							)}
					</div>
				)}

				{/* Rankings */}
				<Card
					className="mb-4 sm:mb-6 border-0 rounded-xl sm:rounded-2xl"
					style={{
						background: "rgba(255, 255, 255, 0.1)",
						boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
						backdropFilter: "blur(5px)",
						WebkitBackdropFilter: "blur(5px)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
					}}>
					<CardContent className="p-0">
						<div
							key={page}
							className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
							{isLoading ? (
								<div className="p-4 sm:p-6 text-center text-white/70 text-sm sm:text-base">
									Carregant...
								</div>
							) : error ? (
								<div className="p-4 sm:p-6 text-center text-red-400 text-sm sm:text-base">
									{String(error)}
								</div>
							) : (
								<>
									{/* Mobile card list (<480px) */}
									<div className="xs:hidden divide-y divide-white/10">
										{players.map((player: RankingPlayer) => (
											<div
												key={player.id}
												className={`flex items-center justify-between p-3 hover:bg-white/5 ${
													userId && player.id === userId
														? "bg-padel-primary/10 border-l-2 border-padel-primary"
														: ""
												}`}>
												<div className="flex items-center gap-3 min-w-0">
													{getRankIcon(player.ranking_position)}
													<div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gray-600 text-white flex-shrink-0">
														{`${player.name?.[0] ?? ""}${
															player.surname?.[0] ?? ""
														}`}
													</div>
													<div className="min-w-0">
														<p className="font-semibold text-white text-sm truncate">
															{player.name} {player.surname}
														</p>
														<div className="text-xs text-white/60 flex items-center gap-1">
															<span className="sr-only">Darrers 5</span>
															{renderRecentForm(player.recent_form)}
														</div>
													</div>
												</div>
												<div className="text-right">
													<span className="text-padel-primary font-bold text-base">
														{player.total_points}
													</span>
													<div className="text-[10px] text-white/50">Punts</div>
												</div>
											</div>
										))}

										{/* If user is outside the top list, show a single highlighted row for them */}
										{extraRows.length > 0 && extraRows.map((player) => (
											<div
												key={player.id}
												className={`flex items-center justify-between p-3 mt-2 border-t border-white/10 bg-padel-primary/10 border-l-2 border-padel-primary`}>
												<div className="flex items-center gap-3 min-w-0">
													<span className="text-gray-200 font-bold text-xs sm:text-sm">#{player.ranking_position}</span>
													<div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gray-600 text-white flex-shrink-0">
														{`${player.name?.[0] ?? ""}${player.surname?.[0] ?? ""}`}
													</div>
													<div className="min-w-0">
														<p className="font-semibold text-white text-sm truncate">
															{player.name} {player.surname}
														</p>
													</div>
												</div>
												<div className="text-right">
													<span className="text-padel-primary font-bold text-base">{player.total_points}</span>
													<div className="text-[10px] text-white/50">Punts</div>
												</div>
											</div>
										))}
									</div>

									{/* Table for >= xs (>=480px) */}
									<div className="hidden xs:block">
										<Table>
											<TableHeader>
												<TableRow className="border-b border-white/10 hover:bg-transparent">
													<TableHead className="text-gray-300 font-semibold py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm">
														Pos
													</TableHead>
													<TableHead className="text-gray-300 font-semibold py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">
														Jugador
													</TableHead>
													<TableHead className="text-gray-300 font-semibold py-3 sm:py-4 text-center text-xs sm:text-sm">
														Punts
													</TableHead>
													<TableHead className="text-gray-300 font-semibold py-3 sm:py-4 text-center text-xs sm:text-sm hidden xs:table-cell">
														Últims 5
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{players.map((player: RankingPlayer) => (
													<TableRow
														key={player.id}
														className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
															userId && player.id === userId
																? "bg-padel-primary/10"
																: ""
														}`}>
														<TableCell className="py-3 sm:py-4 px-3 sm:px-6">
															<div className="flex items-center gap-1 sm:gap-2">
																{getRankIcon(player.ranking_position)}
															</div>
														</TableCell>
														<TableCell className="py-3 sm:py-4 px-2 sm:px-4">
															<div className="flex items-center gap-2 sm:gap-3">
																<div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold bg-gray-600 text-white flex-shrink-0">
																	{`${player.name?.[0] ?? ""}${
																		player.surname?.[0] ?? ""
																	}`}
																</div>
																<div className="min-w-0">
																	<p className="font-semibold text-white text-xs sm:text-sm truncate">
																		{player.name} {player.surname}
																	</p>
																</div>
															</div>
														</TableCell>
														<TableCell className="py-3 sm:py-4 text-center">
															<span className="text-padel-primary font-bold text-xs sm:text-sm">
																{player.total_points}
															</span>
														</TableCell>
														<TableCell className="py-3 sm:py-4 text-center hidden xs:table-cell">
															{renderRecentForm(player.recent_form)}
														</TableCell>
													</TableRow>
												))}

												{/* If user is outside the top list, show single highlighted row */}
												{extraRows.length > 0 && extraRows.map((player) => (
													<TableRow
														key={player.id}
														className={`border-b border-white/10 bg-padel-primary/10`}>
														<TableCell className="py-3 sm:py-4 px-3 sm:px-6">
															<div className="flex items-center gap-1 sm:gap-2">
																<span className="text-gray-200 font-bold text-xs sm:text-sm">#{player.ranking_position}</span>
															</div>
														</TableCell>
														<TableCell className="py-3 sm:py-4 px-2 sm:px-4">
															<div className="flex items-center gap-2 sm:gap-3">
																<div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold bg-gray-600 text-white flex-shrink-0">
																	{`${player.name?.[0] ?? ""}${player.surname?.[0] ?? ""}`}
																</div>
																<div className="min-w-0">
																	<p className="font-semibold text-white text-xs sm:text-sm truncate">
																		{player.name} {player.surname}
																	</p>
																</div>
															</div>
														</TableCell>
														<TableCell className="py-3 sm:py-4 text-center">
															<span className="text-padel-primary font-bold text-xs sm:text-sm">
																{player.total_points}
															</span>
														</TableCell>
														<TableCell className="py-3 sm:py-4 text-center hidden xs:table-cell">
															{renderRecentForm(player.recent_form)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Pagination */}
				{pagination && pagination.totalPages > 1 && (
					// Layout: on mobile show only icon buttons at left/right of the page info;
					// on sm+ screens show full buttons with labels.
					<div className="flex items-center justify-between gap-3 w-full">
						{/* Prev button: icon-only on mobile, label+icon on sm+ */}
						{showNavButtons ? (
							<Button
								variant="outline"
								size="sm"
								onClick={handlePrev}
								disabled={pagination.currentPage === 1}
								className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center justify-center w-10 h-8 sm:w-auto sm:h-auto">
								<ChevronLeft className="w-4 h-4" />
								<span className="hidden sm:inline ml-2">Anterior</span>
							</Button>
						) : (
							<div className="w-10 h-8" />
						)}

						{/* Page info centered (hidden on landing when showNavButtons=false) */}
						{showNavButtons ? (
							<p className="flex-1 text-white/70 text-xs sm:text-sm text-center mx-2">
								Pàgina {pagination.currentPage} de {pagination.totalPages}
							</p>
						) : (
							<div className="flex-1" />
						)}

						{/* Next button: icon-only on mobile, label+icon on sm+ */}
						{showNavButtons ? (
							<Button
								variant="outline"
								size="sm"
								onClick={handleNext}
								disabled={!pagination.hasMore}
								className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center justify-center w-10 h-8 sm:w-auto sm:h-auto">
								<span className="hidden sm:inline mr-2">Següent</span>
								<ChevronRight className="w-4 h-4" />
							</Button>
						) : (
							<div className="w-10 h-8" />
						)}
					</div>
				)}
			</div>
		</section>
	);
}
