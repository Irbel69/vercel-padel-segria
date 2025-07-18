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
import {
	Trophy,
	Medal,
	TrendingUp,
	Users,
	Target,
	Crown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

// Mock data for rankings with creative scoring system
const playersData = [
	{
		id: 1,
		name: "Marc Rodriguez",
		avatar: "MR",
		rank: 1,
		matchesPlayed: 45,
		winRate: 87.5,
		skillLevel: 94,
		points: 2850,
		trend: "up",
		isCurrentUser: false,
	},
	{
		id: 2,
		name: "Anna Martínez",
		avatar: "AM",
		rank: 2,
		matchesPlayed: 42,
		winRate: 85.2,
		skillLevel: 91,
		points: 2720,
		trend: "up",
		isCurrentUser: false,
	},
	{
		id: 3,
		name: "David López",
		avatar: "DL",
		rank: 3,
		matchesPlayed: 38,
		winRate: 82.1,
		skillLevel: 88,
		points: 2650,
		trend: "down",
		isCurrentUser: true,
	},
	{
		id: 4,
		name: "Laura García",
		avatar: "LG",
		rank: 4,
		matchesPlayed: 35,
		winRate: 79.8,
		skillLevel: 85,
		points: 2580,
		trend: "up",
		isCurrentUser: false,
	},
	{
		id: 5,
		name: "Jordi Ferrer",
		avatar: "JF",
		rank: 5,
		matchesPlayed: 40,
		winRate: 77.5,
		skillLevel: 83,
		points: 2510,
		trend: "same",
		isCurrentUser: false,
	},
	{
		id: 6,
		name: "Sofia Vidal",
		avatar: "SV",
		rank: 6,
		matchesPlayed: 33,
		winRate: 75.8,
		skillLevel: 80,
		points: 2440,
		trend: "up",
		isCurrentUser: false,
	},
	{
		id: 7,
		name: "Pablo Sánchez",
		avatar: "PS",
		rank: 7,
		matchesPlayed: 29,
		winRate: 72.4,
		skillLevel: 78,
		points: 2370,
		trend: "down",
		isCurrentUser: false,
	},
	{
		id: 8,
		name: "Carmen Ruiz",
		avatar: "CR",
		rank: 8,
		matchesPlayed: 31,
		winRate: 71.0,
		skillLevel: 76,
		points: 2300,
		trend: "up",
		isCurrentUser: false,
	},
];

const ITEMS_PER_PAGE = 5;

export function RankingsSection() {
	const [currentPage, setCurrentPage] = useState(1);
	const totalPages = Math.ceil(playersData.length / ITEMS_PER_PAGE);

	const paginatedData = playersData.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	);

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return <Crown className="w-5 h-5 text-yellow-400" />;
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
				return (
					<div className="w-4 h-4 bg-gray-400 rounded-full opacity-50"></div>
				);
		}
	};

	const getSkillLevelColor = (level: number) => {
		if (level >= 90) return "text-padel-primary";
		if (level >= 80) return "text-green-400";
		if (level >= 70) return "text-blue-400";
		return "text-gray-400";
	};

	const getSkillLevelBadge = (level: number) => {
		if (level >= 90)
			return {
				text: "Expert",
				color: "bg-padel-primary/20 text-padel-primary",
			};
		if (level >= 80)
			return { text: "Advanced", color: "bg-green-400/20 text-green-400" };
		if (level >= 70)
			return { text: "Intermediate", color: "bg-blue-400/20 text-blue-400" };
		return { text: "Beginner", color: "bg-gray-400/20 text-gray-400" };
	};

	return (
		<section className="py-24 bg-dotted-pattern relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -left-40 w-80 h-80 bg-padel-primary/10 rounded-full blur-3xl" />
				<div className="absolute top-1/2 -right-40 w-96 h-96 bg-padel-primary/5 rounded-full blur-3xl" />
				<div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-padel-primary/8 rounded-full blur-3xl" />
			</div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="flex items-center justify-center gap-3 mb-6">
						<Trophy className="w-8 h-8 text-padel-primary" />
						<h2 className="text-4xl md:text-5xl font-bold text-white">
							Classificació Global
						</h2>
						<Trophy className="w-8 h-8 text-padel-primary" />
					</div>
					<p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
						Descobreix els millors jugadors de pàdel de Segrià. El nostre
						sistema de puntuació avalua el rendiment global basant-se en partits
						jugats, percentatge de victòries i nivell tècnic.
					</p>
				</div>

				{/* Statistics Cards - Compact layout for mobile, card layout for larger screens */}
				<div className="mb-12">
					{/* Mobile version - Compact horizontal layout */}
					<div className="md:hidden">
						<Card
							className="border-0"
							style={{
								background: "rgba(255, 255, 255, 0.1)",
								borderRadius: "16px",
								boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
								backdropFilter: "blur(5px)",
								WebkitBackdropFilter: "blur(5px)",
								border: "1px solid rgba(255, 255, 255, 0.2)",
							}}>
							<CardContent className="p-4">
								<div className="grid grid-cols-3 gap-2">
									{/* Jugadors actius */}
									<div className="flex flex-col items-center justify-center text-center">
										<div className="w-10 h-10 bg-padel-primary/20 rounded-lg flex items-center justify-center mb-1">
											<Users className="w-5 h-5 text-padel-primary" />
										</div>
										<p className="text-xl font-bold text-padel-primary">
											2,847
										</p>
										<p className="text-xs text-gray-300 mt-0.5">
											Jugadors actius
										</p>
									</div>

									{/* Partits aquest mes */}
									<div className="flex flex-col items-center justify-center text-center">
										<div className="w-10 h-10 bg-padel-primary/20 rounded-lg flex items-center justify-center mb-1">
											<Target className="w-5 h-5 text-padel-primary" />
										</div>
										<p className="text-xl font-bold text-padel-primary">
											15,692
										</p>
										<p className="text-xs text-gray-300 mt-0.5">
											Partits aquest mes
										</p>
									</div>

									{/* Tornejos actius */}
									<div className="flex flex-col items-center justify-center text-center">
										<div className="w-10 h-10 bg-padel-primary/20 rounded-lg flex items-center justify-center mb-1">
											<Trophy className="w-5 h-5 text-padel-primary" />
										</div>
										<p className="text-xl font-bold text-padel-primary">127</p>
										<p className="text-xs text-gray-300 mt-0.5">
											Tornejos actius
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Desktop version - Original card layout */}
					<div className="hidden md:grid md:grid-cols-3 gap-6">
						<Card
							className="text-center p-6 border-0"
							style={{
								background: "rgba(255, 255, 255, 0.1)",
								borderRadius: "16px",
								boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
								backdropFilter: "blur(5px)",
								WebkitBackdropFilter: "blur(5px)",
								border: "1px solid rgba(255, 255, 255, 0.2)",
							}}>
							<CardContent className="space-y-3">
								<div className="w-12 h-12 bg-padel-primary/20 rounded-xl flex items-center justify-center mx-auto">
									<Users className="w-6 h-6 text-padel-primary" />
								</div>
								<h3 className="text-2xl font-bold text-padel-primary">2,847</h3>
								<p className="text-gray-300">Jugadors actius</p>
							</CardContent>
						</Card>

						<Card
							className="text-center p-6 border-0"
							style={{
								background: "rgba(255, 255, 255, 0.1)",
								borderRadius: "16px",
								boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
								backdropFilter: "blur(5px)",
								WebkitBackdropFilter: "blur(5px)",
								border: "1px solid rgba(255, 255, 255, 0.2)",
							}}>
							<CardContent className="space-y-3">
								<div className="w-12 h-12 bg-padel-primary/20 rounded-xl flex items-center justify-center mx-auto">
									<Target className="w-6 h-6 text-padel-primary" />
								</div>
								<h3 className="text-2xl font-bold text-padel-primary">
									15,692
								</h3>
								<p className="text-gray-300">Partits aquest mes</p>
							</CardContent>
						</Card>

						<Card
							className="text-center p-6 border-0"
							style={{
								background: "rgba(255, 255, 255, 0.1)",
								borderRadius: "16px",
								boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
								backdropFilter: "blur(5px)",
								WebkitBackdropFilter: "blur(5px)",
								border: "1px solid rgba(255, 255, 255, 0.2)",
							}}>
							<CardContent className="space-y-3">
								<div className="w-12 h-12 bg-padel-primary/20 rounded-xl flex items-center justify-center mx-auto">
									<Trophy className="w-6 h-6 text-padel-primary" />
								</div>
								<h3 className="text-2xl font-bold text-padel-primary">127</h3>
								<p className="text-gray-300">Tornejos actius</p>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Rankings Table */}
				<Card
					className="mb-8 border-0"
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
											Partits
										</TableHead>
										<TableHead className="text-gray-300 font-semibold py-4 text-center">
											% Victòries
										</TableHead>
										<TableHead className="text-gray-300 font-semibold py-4 text-center">
											Nivell
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
									{paginatedData.map((player) => (
										<TableRow
											key={player.id}
											className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
												player.isCurrentUser
													? "bg-padel-primary/10 hover:bg-padel-primary/15"
													: ""
											}`}>
											<TableCell className="py-4 px-6">
												<div className="flex items-center gap-2">
													{getRankIcon(player.rank)}
												</div>
											</TableCell>
											<TableCell className="py-4">
												<div className="flex items-center gap-3">
													<div
														className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
															player.isCurrentUser
																? "bg-padel-primary text-padel-secondary"
																: "bg-gray-600 text-white"
														}`}>
														{player.avatar}
													</div>
													<div>
														<p
															className={`font-semibold ${
																player.isCurrentUser
																	? "text-padel-primary"
																	: "text-white"
															}`}>
															{player.name}
															{player.isCurrentUser && (
																<Badge className="ml-2 bg-padel-primary/20 text-padel-primary border-padel-primary/30">
																	Tu
																</Badge>
															)}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-center py-4">
												<span className="text-white font-medium">
													{player.matchesPlayed}
												</span>
											</TableCell>
											<TableCell className="text-center py-4">
												<span className="text-white font-medium">
													{player.winRate}%
												</span>
											</TableCell>
											<TableCell className="text-center py-4">
												<div className="flex items-center justify-center gap-2">
													<span
														className={`font-bold ${getSkillLevelColor(
															player.skillLevel
														)}`}>
														{player.skillLevel}
													</span>
													<Badge
														className={`text-xs ${
															getSkillLevelBadge(player.skillLevel).color
														}`}>
														{getSkillLevelBadge(player.skillLevel).text}
													</Badge>
												</div>
											</TableCell>
											<TableCell className="text-center py-4">
												<span className="text-padel-primary font-bold">
													{player.points.toLocaleString()}
												</span>
											</TableCell>
											<TableCell className="text-center py-4">
												{getTrendIcon(player.trend)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{/* Pagination */}
				<div className="flex items-center justify-center gap-4 mb-12">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
						className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50">
						<ChevronLeft className="w-4 h-4" />
					</Button>

					<div className="flex items-center gap-2">
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<Button
								key={page}
								variant={currentPage === page ? "default" : "outline"}
								size="sm"
								onClick={() => setCurrentPage(page)}
								className={
									currentPage === page
										? "bg-padel-primary text-padel-secondary hover:bg-padel-primary/90"
										: "bg-white/10 border-white/20 text-white hover:bg-white/20"
								}>
								{page}
							</Button>
						))}
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setCurrentPage(Math.min(totalPages, currentPage + 1))
						}
						disabled={currentPage === totalPages}
						className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50">
						<ChevronRight className="w-4 h-4" />
					</Button>
				</div>

				{/* Call to Action */}
				<div className="text-center">
					<Card
						className="inline-block p-8 border-0"
						style={{
							background: "rgba(255, 255, 255, 0.1)",
							borderRadius: "16px",
							boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
							backdropFilter: "blur(5px)",
							WebkitBackdropFilter: "blur(5px)",
							border: "1px solid rgba(255, 255, 255, 0.2)",
						}}>
						<CardContent className="space-y-6">
							<div className="space-y-3">
								<h3 className="text-2xl font-bold text-white">
									Vols aparèixer en el rànquing?
								</h3>
								<p className="text-gray-300 max-w-md">
									Uneix-te als nostres tornejos oficials i comença a escalar
									posicions. Cada partit compte per al teu rànquing!
								</p>
							</div>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Button
									size="lg"
									className="bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 font-semibold px-8 py-3 transform hover:scale-105 transition-all duration-300">
									<Trophy className="w-5 h-5 mr-2" />
									Uneix-te ara
								</Button>

								<Button
									variant="outline"
									size="lg"
									className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold px-8 py-3">
									Veure tornejos
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
