"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "lucide-react";
import {
	UpcomingTournamentsTimeline,
	type UpcomingTournament,
} from "./UpcomingTournamentsTimeline";
import type { Event as EventType } from "@/types";

// Legacy grid UI removed in favor of timeline.

export function EventsSection() {
	const [isVisible, setIsVisible] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [events, setEvents] = useState<EventType[]>([]);
	const [isLoadingEvents, setIsLoadingEvents] = useState(true);

	// Fetch real events data
	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const response = await fetch("/api/events/public?limit=4");
				if (!response.ok) {
					// If API call fails, use mock data as fallback
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

	// Map fetched events to timeline props
	const timelineTournaments: UpcomingTournament[] = useMemo(() => {
		const toStatus = (ev: EventType): "upcoming" | "finished" => {
			// Consider 'open' and 'soon' as upcoming; 'closed' => finished
			return ev.status === "closed" ? "finished" : "upcoming";
		};
		return events.map((ev) => ({
			id: String(ev.id),
			name: ev.title,
			location: ev.location ?? "Ubicació per determinar",
			// available slots estimate: remaining places; ensure non-negative
			slots: Math.max(
				0,
				(ev.max_participants ?? 0) - (ev.current_participants ?? 0)
			),
			date: ev.date,
			status: toStatus(ev),
			latitude: ev.latitude,
			longitude: ev.longitude,
		}));
	}, [events]);

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

				{/* Timeline */}
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
						<UpcomingTournamentsTimeline tournaments={timelineTournaments} />
					)}

					{/* Show message if no events */}
					{!isLoadingEvents && timelineTournaments.length === 0 && (
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
