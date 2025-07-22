"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Calendar,
	MapPin,
	Trophy,
	Users,
	Clock,
	Star,
	Target,
} from "lucide-react";

interface Event {
	id: number;
	title: string;
	date: string;
	location: string;
	status: "open" | "closed" | "soon";
	prizes: string;
	categories: string[];
	participants: number;
	maxParticipants: number;
	registrationDeadline: string;
}

const mockEvents: Event[] = [
	{
		id: 1,
		title: "Torneig d'Estiu",
		date: "15 de Juliol",
		location: "Club Tennis Lleida",
		status: "open",
		prizes: "1.500€ en premis",
		categories: ["Masculí", "Femení", "Mixt"],
		participants: 24,
		maxParticipants: 32,
		registrationDeadline: "10 de Juliol",
	},
	{
		id: 2,
		title: "Copa Segrià",
		date: "2 d'Agost",
		location: "Pàdel Center Mollerussa",
		status: "open",
		prizes: "2.000€ en premis",
		categories: ["Open", "Intermedi", "Principiant"],
		participants: 18,
		maxParticipants: 24,
		registrationDeadline: "28 de Juliol",
	},
	{
		id: 3,
		title: "Master Finals",
		date: "20 d'Agost",
		location: "Poliesportiu Municipal",
		status: "soon",
		prizes: "3.500€ en premis",
		categories: ["Elite", "Professional"],
		participants: 0,
		maxParticipants: 16,
		registrationDeadline: "15 d'Agost",
	},
	{
		id: 4,
		title: "Torneig de Tardor",
		date: "10 de Setembre",
		location: "Club Natació Lleida",
		status: "closed",
		prizes: "1.200€ en premis",
		categories: ["Masculí", "Femení"],
		participants: 32,
		maxParticipants: 32,
		registrationDeadline: "5 de Setembre",
	},
];

const getStatusBadge = (status: Event["status"]) => {
	switch (status) {
		case "open":
			return (
				<Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
					Inscripcions Obertes
				</Badge>
			);
		case "soon":
			return (
				<Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
					Properament
				</Badge>
			);
		case "closed":
			return (
				<Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
					Inscripcions Tancades
				</Badge>
			);
	}
};

export function EventsSection() {
	const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Trigger animation when component mounts
		const timer = setTimeout(() => setIsVisible(true), 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<section className="py-24 relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -left-40 w-96 h-96 bg-padel-primary/5 rounded-full blur-3xl" />
				<div className="absolute -bottom-40 -right-40 w-96 h-96 bg-padel-primary/10 rounded-full blur-3xl" />
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
					<div className="absolute inset-0 bg-gradient-to-br from-transparent via-padel-primary/5 to-transparent" />
				</div>
			</div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Header */}
				<div
					className={`text-center mb-20 transition-all duration-700 ${
						isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
					}`}>
					<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
						Propers Tornejos
					</h2>
					<p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
						Descobreix els tornejos més emocionants que estan per venir.
						Uneix-te a la competició i demostra el teu talent en les millors
						pistes de Segrià.
					</p>
				</div>

				{/* Timeline */}
				<div className="relative mb-16">
					{/* Timeline line - Horizontal on desktop, vertical on mobile */}
					<div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent transform -translate-y-1/2" />
					<div className="lg:hidden absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gray-600 to-transparent" />

					{/* Events */}
					<div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-12 lg:space-y-0 lg:space-x-4">
						{mockEvents.map((event, index) => (
							<TooltipProvider key={event.id}>
								<Tooltip>
									<TooltipTrigger asChild>
										<div
											className={`relative flex flex-col lg:items-center text-left lg:text-center group cursor-pointer transition-all duration-500 hover:z-10 ${
												hoveredEvent === event.id ? "lg:scale-110" : ""
											} ${
												isVisible
													? "translate-y-0 opacity-100"
													: "translate-y-8 opacity-0"
											}`}
											style={{
												transitionDelay: `${index * 150}ms`,
											}}
											onMouseEnter={() => setHoveredEvent(event.id)}
											onMouseLeave={() => setHoveredEvent(null)}>
											{/* Timeline point */}
											<div className="relative flex lg:flex-col items-center lg:items-center">
												{/* Mobile timeline connector */}
												<div className="lg:hidden w-16 h-16 bg-gradient-to-r from-padel-primary/30 to-padel-primary rounded-full flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
													<div className="w-8 h-8 bg-padel-primary rounded-full flex items-center justify-center">
														<span className="text-sm font-bold text-padel-secondary">
															{index + 1}
														</span>
													</div>
												</div>

												{/* Desktop timeline point */}
												<div className="hidden lg:flex w-16 h-16 bg-gradient-to-r from-padel-primary/30 to-padel-primary rounded-full items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-lg">
													<div className="w-8 h-8 bg-padel-primary rounded-full flex items-center justify-center">
														<span className="text-sm font-bold text-padel-secondary">
															{index + 1}
														</span>
													</div>
												</div>

												{/* Event card */}
												<div
													className={`flex-1 lg:w-80 xl:w-72 p-6 rounded-2xl transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-padel-primary/20 ${
														hoveredEvent === event.id
															? "bg-white/15 border-padel-primary/50"
															: ""
													}`}
													style={{
														background:
															hoveredEvent === event.id
																? "rgba(255, 255, 255, 0.15)"
																: "rgba(255, 255, 255, 0.08)",
														backdropFilter: "blur(12px)",
														WebkitBackdropFilter: "blur(12px)",
														border:
															hoveredEvent === event.id
																? "1px solid rgba(229, 240, 0, 0.5)"
																: "1px solid rgba(255, 255, 255, 0.1)",
													}}>
													<div className="space-y-4">
														<div className="flex flex-col space-y-2">
															<h3 className="text-lg lg:text-xl font-bold text-white group-hover:text-padel-primary transition-colors duration-300">
																{event.title}
															</h3>
															<div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-2 text-sm text-gray-300">
																<div className="flex items-center gap-1">
																	<Calendar className="w-4 h-4 text-padel-primary/70" />
																	<span>{event.date}</span>
																</div>
																<div className="flex items-center gap-1">
																	<MapPin className="w-4 h-4 text-padel-primary/70" />
																	<span className="truncate text-xs lg:text-sm">
																		{event.location}
																	</span>
																</div>
															</div>
														</div>

														<div className="flex flex-col items-start lg:items-center space-y-3">
															{getStatusBadge(event.status)}
															<div className="flex items-center gap-1 text-sm text-gray-400">
																<Users className="w-4 h-4" />
																<span>
																	{event.participants}/{event.maxParticipants}{" "}
																	participants
																</span>
															</div>
														</div>

														{event.status === "open" && (
															<Button
																size="sm"
																className="w-full bg-padel-primary/20 text-padel-primary border border-padel-primary/30 hover:bg-padel-primary hover:text-padel-secondary transition-all duration-300 hover:scale-105">
																Inscriure's
															</Button>
														)}
													</div>
												</div>
											</div>
										</div>
									</TooltipTrigger>
									<TooltipContent
										side={index % 2 === 0 ? "top" : "bottom"}
										className="max-w-xs p-4 bg-black/95 text-white border border-gray-600 shadow-xl">
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<Trophy className="w-4 h-4 text-padel-primary" />
												<span className="font-semibold text-padel-primary">
													{event.prizes}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Target className="w-4 h-4 text-blue-400" />
												<span className="text-sm">
													Categories: {event.categories.join(", ")}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Clock className="w-4 h-4 text-orange-400" />
												<span className="text-sm">
													Límit inscripció: {event.registrationDeadline}
												</span>
											</div>
											{event.status === "open" && (
												<div className="flex items-center gap-2">
													<Star className="w-4 h-4 text-yellow-400" />
													<span className="text-sm font-medium">
														Places disponibles:{" "}
														{event.maxParticipants - event.participants}
													</span>
												</div>
											)}
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						))}
					</div>
				</div>

				{/* Call to Action */}
				<div
					className={`text-center transition-all duration-700 ${
						isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
					}`}
					style={{ transitionDelay: "600ms" }}>
					<div className="space-y-4">
						<p className="text-gray-300 text-lg">
							Vols veure tots els nostres tornejos i esdeveniments?
						</p>
						<Button
							size="lg"
							className="bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 hover:text-white transition-all duration-300 px-12 py-6 text-xl font-semibold rounded-2xl transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-padel-primary/30">
							Veure tots els tornejos
						</Button>
					</div>
				</div>
			</div>

			{/* Bottom decorative fade */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
		</section>
	);
}
