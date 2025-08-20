"use client";

import React, { useState, useEffect } from "react";
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
	ExternalLink,
} from "lucide-react";
import { openInMaps, getMapServiceName } from "@/lib/maps";
import type { Event as EventType } from "@/types";

interface LegacyEvent {
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

const mockEvents: LegacyEvent[] = [
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

const getStatusBadge = (status: EventType["status"]) => {
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
	const [isLoaded, setIsLoaded] = useState(false);
	const [events, setEvents] = useState<EventType[]>([]);
	const [isLoadingEvents, setIsLoadingEvents] = useState(true);

	// Fetch real events data (no React Query here)
	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const response = await fetch("/api/events/public?limit=4");
				if (!response.ok) {
					console.warn("API call failed, using mock data");
					setEvents([]);
					return;
				}

				const data = await response.json();
				setEvents(data.events || []);
			} catch (error) {
				console.error("Error fetching events:", error);
				setEvents([]);
			} finally {
				setIsLoadingEvents(false);
			}
		};

		fetchEvents();
	}, []);

	useEffect(() => {
		// Ensure the component is considered loaded first
		setIsLoaded(true);

		// Then trigger animation when component is fully loaded
		const animationFrame = window.requestAnimationFrame(() => {
			setIsVisible(true);
		});
		return () => window.cancelAnimationFrame(animationFrame);
	}, []);

	// Function to handle maps redirection
	const handleViewInMaps = (event: EventType, e: React.MouseEvent) => {
		e.stopPropagation();
		if (event.latitude && event.longitude) {
			openInMaps(event.latitude, event.longitude, event.title);
		}
	};

	// Convert EventType to display format for rendering
	const displayEvents =
		events.length > 0
			? events
			: mockEvents.map(
					(mockEvent): EventType => ({
						id: mockEvent.id,
						title: mockEvent.title,
						date: mockEvent.date,
						location: mockEvent.location,
						latitude: null, // Mock events don't have real coordinates
						longitude: null,
						status: mockEvent.status as "open" | "closed" | "soon",
						prizes: mockEvent.prizes,
						max_participants: mockEvent.maxParticipants,
						registration_deadline: mockEvent.registrationDeadline,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						current_participants: mockEvent.participants,
					})
				);

	// Show a simple loading state if the component hasn't loaded yet
	if (!isLoaded) {
		return (
			<section className="py-24 relative overflow-visible">
				<div className="container mx-auto px-4 relative z-10">
					<div className="text-center mb-20">
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
							Propers Tornejos
						</h2>
						<div className="w-16 h-16 mx-auto mt-8 border-t-4 border-padel-primary border-solid rounded-full animate-spin"></div>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section id="events" className="py-12 md:py-24 relative overflow-visible">
			{/* Background decorative elements */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute -top-40 -left-20 w-96 h-96 bg-padel-primary/5 rounded-full blur-3xl" />
				<div className="absolute -bottom-40 -right-20 w-96 h-96 bg-padel-primary/10 rounded-full blur-3xl" />
			
			</div>

			<div className="container mx-auto px-4 relative z-10">
				{/* Header */}
				<div
					className={`text-center mb-8 md:mb-20 transition-all duration-700 ${
						isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
					}`}>
					<h2 className="text-2xl leading-tight md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6">
						Propers Tornejos
					</h2>
					<p className="text-sm md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed px-1 md:px-2">
						Descobreix els tornejos més emocionants que estan per venir.
						Uneix-te a la competició i demostra el teu talent en les millors
						pistes de Segrià.
					</p>
				</div>

				{/* Events Grid */}
				<div className="relative mb-8 md:mb-16">
					{isLoadingEvents ? (
						<div className="flex justify-center">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl w-full">
								{Array.from({ length: 4 }).map((_, index) => (
									<div
										key={index}
										className="animate-pulse bg-white/10 rounded-2xl p-6 space-y-4">
										<div className="h-4 bg-white/20 rounded w-3/4"></div>
										<div className="h-3 bg-white/20 rounded w-1/2"></div>
										<div className="h-3 bg-white/20 rounded w-full"></div>
										<div className="h-8 bg-white/20 rounded"></div>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="flex justify-center">
							<div
								className={`grid gap-3 md:gap-6 max-w-7xl w-full ${
									displayEvents.length === 1
										? "grid-cols-1 max-w-md"
										: displayEvents.length === 2
										? "grid-cols-1 md:grid-cols-2 max-w-2xl"
										: displayEvents.length === 3
										? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl"
										: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
								}`}>
								{displayEvents.slice(0, 4).map((event, index) => (
									<TooltipProvider key={event.id}>
										<Tooltip>
											<TooltipTrigger asChild>
												<div
													className={`group cursor-pointer transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02] ${
														isVisible
															? "translate-y-0 opacity-100"
															: "translate-y-6 md:translate-y-8 opacity-0"
													}`}
													style={{ transitionDelay: `${index * 120}ms` }}
													onMouseEnter={() => setHoveredEvent(event.id)}
													onMouseLeave={() => setHoveredEvent(null)}>
													{/* Event card */}
													<div
														className={`h-full p-4 md:p-6 rounded-2xl transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-padel-primary/20 border min-h-[0] md:min-h-[440px] flex flex-col ${
															hoveredEvent === event.id
																? "border-padel-primary/50 shadow-xl shadow-padel-primary/30"
																: "hover:shadow-lg"
														}`}
														style={{
															background: "rgba(255, 255, 255, 0.1)",
															borderRadius: "16px",
															boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
															backdropFilter: "blur(5px)",
															WebkitBackdropFilter: "blur(5px)",
															border: "1px solid rgba(255, 255, 255, 0.2)",
														}}>
														{/* Header with event number and status */}
														<div className="flex justify-between items-start mb-4 md:mb-6">
															<div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-padel-primary to-yellow-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg">
																<span className="text-sm md:text-base font-bold text-black">
																	{index + 1}
																</span>
															</div>
															<div className="scale-90 md:scale-100">
																{getStatusBadge(event.status)}
															</div>
														</div>

														{/* Event title */}
														<h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white group-hover:text-padel-primary transition-colors duration-300 mb-4 md:mb-6 line-clamp-2 leading-tight">
															{event.title}
														</h3>

														{/* Event details */}
														<div className="space-y-4 md:space-y-5 mb-4 md:mb-6 flex-grow">
															{/* Date - highlighted as primary info */}
															<div className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-padel-primary/90 font-medium leading-tight">
																<Calendar className="w-5 h-5 text-padel-primary flex-shrink-0" />
																<span>
																	{new Date(event.date).toLocaleDateString(
																		"ca-ES",
																		{
																			day: "numeric",
																			month: "long",
																			year: "numeric",
																		}
																	)}
																</span>
															</div>

															{/* Location and participants in same row for better grouping */}
															<div className="flex items-start justify-between gap-3 text-xs md:text-sm text-gray-300 leading-tight">
																{/* Simplified location */}
																<div className="flex items-center gap-2 flex-1 min-w-0">
																	<MapPin className="w-4 h-4 md:w-5 md:h-5 text-padel-primary/70 flex-shrink-0" />
																	<span className="truncate">
																		{event.location 
																			? (() => {
																				// Extract meaningful location info - try to get city name
																				const parts = event.location.split(',').map(p => p.trim());
																				// Look for common city names or return first meaningful part
																				const cityPart = parts.find(part => 
																					part.includes('Lleida') || 
																					part.includes('Barcelona') || 
																					part.includes('Mollerussa') ||
																					part.includes('Girona') ||
																					part.length > 3
																				);
																				return cityPart || parts[0] || "Ubicació per determinar";
																			})()
																			: "Ubicació per determinar"}
																	</span>
																	{event.latitude && event.longitude && (
																		<Tooltip>
																			<TooltipTrigger asChild>
																				<button
																					onClick={(e) =>
																						handleViewInMaps(event, e)
																					}
																					className="text-padel-primary hover:text-padel-primary/80 transition-colors duration-200 p-1 rounded hover:bg-white/10"
																					aria-label={`Veure ${
																						event.title
																					} a ${getMapServiceName()}`}>
																					<ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
																				</button>
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Veure a {getMapServiceName()}</p>
																			</TooltipContent>
																		</Tooltip>
																	)}
																</div>

																{/* Participants on the right */}
																<div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
																	<Users className="w-4 h-4 md:w-5 md:h-5 text-padel-primary/70" />
																	<span className="font-medium">
																		{event.current_participants || 0}/{event.max_participants}
																	</span>
																</div>
															</div>

															{/* Prizes - if available */}
															{event.prizes && (
																<div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-yellow-400 leading-tight">
																	<Trophy className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
																	<span className="truncate font-medium">
																		{event.prizes}
																	</span>
																</div>
															)}
														</div>

														{/* Action button */}
														<div className="mt-auto pt-2 md:pt-4">
															{event.status === "open" ? (
																<Button
																	size="sm"
																	className="w-full bg-padel-primary text-black border border-padel-primary hover:bg-padel-primary/90 hover:shadow-lg hover:shadow-padel-primary/30 transition-all duration-200 hover:scale-[1.01] font-semibold text-sm md:text-base py-2.5 md:py-3 rounded-xl">
																	Inscriure&apos;s
																</Button>
															) : (
																<Button
																	size="sm"
																	variant="outline"
																	disabled
																	className="w-full border-white/30 text-white/60 bg-white/5 text-sm md:text-base py-2.5 md:py-3 rounded-xl cursor-not-allowed">
																	{event.status === "soon"
																		? "Properament"
																		: "Tancat"}
																</Button>
															)}
														</div>
													</div>
												</div>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="max-w-xs p-4 bg-black/95 text-white border border-gray-600 shadow-xl rounded-xl">
												<div className="space-y-3">
													<div className="flex items-center gap-2">
														<Clock className="w-4 h-4 text-orange-400" />
														<span className="text-sm">
															Límit inscripció:{" "}
															{new Date(
																event.registration_deadline
															).toLocaleDateString("ca-ES")}
														</span>
													</div>
													{event.status === "open" && (
														<div className="flex items-center gap-2">
															<Star className="w-4 h-4 text-yellow-400" />
															<span className="text-sm font-medium">
																Places disponibles:{" "}
																{event.max_participants -
																	(event.current_participants || 0)}
															</span>
														</div>
													)}
													{event.latitude && event.longitude && (
														<div className="flex items-center gap-2 pt-2 border-t border-gray-700">
															<MapPin className="w-4 h-4 text-padel-primary" />
															<div className="flex flex-col gap-1">
																<span className="text-xs text-gray-400">Direcció completa:</span>
																<span className="text-sm">{event.location}</span>
																<button
																	onClick={(e) => handleViewInMaps(event, e)}
																	className="text-sm text-padel-primary hover:text-padel-primary/80 transition-colors duration-200 underline text-left">
																	Veure ubicació a {getMapServiceName()}
																</button>
															</div>
														</div>
													)}
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								))}
							</div>
						</div>
					)}

					{/* Show message if no events */}
					{!isLoadingEvents && displayEvents.length === 0 && (
						<div className="text-center py-12">
							<div className="w-16 h-16 bg-padel-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<Calendar className="w-8 h-8 text-padel-primary" />
							</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								No hi ha tornejos disponibles
							</h3>
							<p className="text-gray-400">
								Estem preparant nous tornejos emocionants. Torna aviat!
							</p>
						</div>
					)}
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

			{/* Removed bottom black fade to avoid masking the global dotted background */}
		</section>
	);
}
