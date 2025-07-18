"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Trophy,
	Users,
	Zap,
	Target,
	Shield,
	Swords,
	Activity,
	Eye,
	Wind,
	Heart,
	ArrowUpRight,
	Star,
	Crown,
	Medal,
	Award,
	Flame,
	BrainCircuit,
	Gamepad2,
	ChevronRight,
} from "lucide-react";

// Lista de cualidades con sus iconos correspondientes
const qualitiesPool = [
	{ name: "Lideratge", icon: Crown },
	{ name: "Anticipació", icon: Eye },
	{ name: "Potència", icon: Flame },
	{ name: "Velocitat", icon: Zap },
	{ name: "Resistència", icon: Heart },
	{ name: "Reflexos", icon: Activity },
	{ name: "Flexibilitat", icon: Wind },
	{ name: "Equilibri", icon: Target },
	{ name: "Mobilitat", icon: ArrowUpRight },
	{ name: "Defensa", icon: Shield },
	{ name: "Atac", icon: Swords },
	{ name: "Control", icon: BrainCircuit },
	{ name: "Col·locació", icon: Target },
	{ name: "Volea", icon: Award },
	{ name: "Globo", icon: Trophy },
	{ name: "Rematada", icon: Flame },
	{ name: "Vibora", icon: Zap },
	{ name: "Servei", icon: Star },
	{ name: "Sortida", icon: ArrowUpRight },
	{ name: "Contraatac", icon: Activity },
	{ name: "Baixada de pared", icon: Shield },
	{ name: "Bandeja", icon: Medal },
	{ name: "Comunicació", icon: Users },
	{ name: "Adaptació", icon: Wind },
	{ name: "X3", icon: Gamepad2 },
];

// Función para generar cualidades aleatorias
const getRandomQualities = () => {
	const shuffled = [...qualitiesPool].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, 3);
};

// Datos ficticios de jugadores
const topPlayers = [
	{
		id: 1,
		name: "Joan Pérez",
		score: 1200,
		avatar: "/avatars/joan.png",
		qualities: getRandomQualities(),
		rank: 1,
		isChampion: true,
	},
	{
		id: 2,
		name: "Maria López",
		score: 1150,
		avatar: "/avatars/maria.png",
		qualities: getRandomQualities(),
		rank: 2,
		isChampion: false,
	},
	{
		id: 3,
		name: "Carlos García",
		score: 1100,
		avatar: "/avatars/carlos.png",
		qualities: getRandomQualities(),
		rank: 3,
		isChampion: false,
	},
];

const getRankIcon = (rank: number) => {
	switch (rank) {
		case 1:
			return <Crown className="w-5 h-5 text-yellow-400" />;
		case 2:
			return <Medal className="w-5 h-5 text-gray-400" />;
		case 3:
			return <Medal className="w-5 h-5 text-amber-600" />;
		default:
			return <Trophy className="w-5 h-5 text-gray-400" />;
	}
};

const getRankGradient = (rank: number) => {
	switch (rank) {
		case 1:
			return "from-yellow-400/20 to-yellow-600/20 border-yellow-400/30";
		case 2:
			return "from-gray-400/20 to-gray-600/20 border-gray-400/30";
		case 3:
			return "from-amber-400/20 to-amber-600/20 border-amber-400/30";
		default:
			return "from-gray-400/20 to-gray-600/20 border-gray-400/30";
	}
};

export function TopPlayersSection() {
	const [hoveredCard, setHoveredCard] = useState<number | null>(null);

	return (
		<section className="py-24 bg-dotted-pattern relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-padel-primary/10 rounded-full blur-3xl" />
				<div className="absolute top-1/2 -left-40 w-96 h-96 bg-padel-primary/5 rounded-full blur-3xl" />
				<div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-padel-primary/8 rounded-full blur-3xl" />
			</div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="flex items-center justify-center gap-3 mb-6">
						<Trophy className="w-8 h-8 text-padel-primary" />
						<h2 className="text-4xl md:text-5xl font-bold text-white">
							Top Players
						</h2>
						<Trophy className="w-8 h-8 text-padel-primary" />
					</div>
					<p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
						Descobreix els jugadors més destacats de Padel Segrià. Aquests són
						els campions que dominen les pistes amb el seu talent excepcional.
					</p>
				</div>

				{/* Main Content Grid */}
				<div className="grid lg:grid-cols-4 gap-8 items-start">
					{/* Players Cards - Takes 3 columns on large screens */}
					<div className="lg:col-span-3">
						<div className="grid md:grid-cols-3 gap-6">
							{topPlayers.map((player, index) => {
								const IconComponent = getRankIcon(player.rank);
								return (
									<Card
										key={player.id}
										className={`relative overflow-hidden border-0 transition-all duration-500 transform hover:scale-105 cursor-pointer group ${
											hoveredCard === player.id
												? "shadow-2xl shadow-padel-primary/20"
												: "shadow-lg"
										}`}
										style={{
											background: "rgba(255, 255, 255, 0.1)",
											borderRadius: "20px",
											boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
											backdropFilter: "blur(10px)",
											WebkitBackdropFilter: "blur(10px)",
											border: "1px solid rgba(255, 255, 255, 0.2)",
										}}
										onMouseEnter={() => setHoveredCard(player.id)}
										onMouseLeave={() => setHoveredCard(null)}>
										{/* Champion Badge */}
										{player.isChampion && (
											<div className="absolute top-4 right-4 z-10">
												<Badge className="bg-padel-primary/90 text-padel-secondary border-0 font-bold">
													<Crown className="w-3 h-3 mr-1" />
													Campió
												</Badge>
											</div>
										)}

										{/* Rank Position */}
										<div className="absolute top-4 left-4 z-10">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getRankGradient(
													player.rank
												)} border backdrop-blur-sm`}>
												{IconComponent}
											</div>
										</div>

										<CardContent className="p-6 pt-16">
											{/* Player Avatar and Info */}
											<div className="text-center mb-6">
												<Avatar className="w-20 h-20 mx-auto border-4 border-white/20 shadow-lg mb-4">
													<AvatarImage
														src={player.avatar}
														alt={player.name}
														className="object-cover"
													/>
													<AvatarFallback className="bg-padel-primary text-padel-secondary text-xl font-bold">
														{player.name
															.split(" ")
															.map((n) => n[0])
															.join("")}
													</AvatarFallback>
												</Avatar>

												<h3 className="text-xl font-bold text-white mb-2">
													{player.name}
												</h3>

												<div className="flex items-center justify-center gap-2 mb-4">
													<Star className="w-4 h-4 text-padel-primary" />
													<span className="text-2xl font-bold text-padel-primary">
														{player.score}
													</span>
													<span className="text-gray-300 text-sm">punts</span>
												</div>
											</div>

											{/* Player Qualities */}
											<div className="space-y-3">
												<h4 className="text-sm font-semibold text-gray-300 text-center mb-3">
													Qualitats destacades
												</h4>
												{player.qualities.map((quality, qualityIndex) => {
													const QualityIcon = quality.icon;
													return (
														<div
															key={qualityIndex}
															className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200">
															<div className="w-8 h-8 rounded-lg bg-padel-primary/20 flex items-center justify-center flex-shrink-0">
																<QualityIcon className="w-4 h-4 text-padel-primary" />
															</div>
															<span className="text-white text-sm font-medium">
																{quality.name}
															</span>
														</div>
													);
												})}
											</div>

											{/* Hover effect overlay */}
											<div className="absolute inset-0 bg-gradient-to-t from-padel-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[20px]"></div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</div>

					{/* Floating Info Panel - Takes 1 column on large screens */}
					<div className="lg:col-span-1">
						<div className="lg:sticky lg:top-8">
							<Card
								className="border-0 text-center"
								style={{
									background: "rgba(255, 255, 255, 0.1)",
									borderRadius: "20px",
									boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
									backdropFilter: "blur(10px)",
									WebkitBackdropFilter: "blur(10px)",
									border: "1px solid rgba(255, 255, 255, 0.2)",
								}}>
								<CardContent className="p-8">
									<div className="space-y-6">
										{/* Icon */}
										<div className="w-16 h-16 bg-padel-primary/20 rounded-2xl flex items-center justify-center mx-auto">
											<Users className="w-8 h-8 text-padel-primary" />
										</div>

										{/* Title */}
										<h3 className="text-2xl font-bold text-white">
											Descobreix tots els jugadors
										</h3>

										{/* Description */}
										<p className="text-gray-300 leading-relaxed">
											Explora la classificació completa i troba els millors
											jugadors de cada categoria. Cada jugador té el seu estil
											únic!
										</p>

										{/* Stats */}
										<div className="grid grid-cols-2 gap-4 py-4">
											<div className="text-center">
												<p className="text-2xl font-bold text-padel-primary">
													2,847
												</p>
												<p className="text-xs text-gray-400">Jugadors actius</p>
											</div>
											<div className="text-center">
												<p className="text-2xl font-bold text-padel-primary">
													127
												</p>
												<p className="text-xs text-gray-400">Tornejos</p>
											</div>
										</div>

										{/* CTA Button */}
										<Button
											size="lg"
											className="w-full bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 font-semibold py-4 transform hover:scale-105 transition-all duration-300 group">
											<span className="mr-2">Veure tots els jugadors</span>
											<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
										</Button>

										{/* Secondary Button */}
										<Button
											variant="outline"
											size="lg"
											className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold py-4">
											<Trophy className="w-5 h-5 mr-2" />
											Uneix-te ara
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>

				{/* Bottom Call to Action - Only visible on mobile/tablet */}
				<div className="lg:hidden mt-12 text-center">
					<Card
						className="inline-block border-0"
						style={{
							background: "rgba(255, 255, 255, 0.1)",
							borderRadius: "16px",
							boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
							backdropFilter: "blur(5px)",
							WebkitBackdropFilter: "blur(5px)",
							border: "1px solid rgba(255, 255, 255, 0.2)",
						}}>
						<CardContent className="p-6">
							<div className="space-y-4">
								<h3 className="text-xl font-bold text-white">
									Vols ser un top player?
								</h3>
								<p className="text-gray-300 text-sm">
									Uneix-te als nostres tornejos i demostra el teu talent!
								</p>
								<div className="flex flex-col sm:flex-row gap-3">
									<Button
										size="lg"
										className="bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 font-semibold flex-1">
										<Trophy className="w-4 h-4 mr-2" />
										Uneix-te
									</Button>
									<Button
										variant="outline"
										size="lg"
										className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold flex-1">
										<Users className="w-4 h-4 mr-2" />
										Veure tots
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
