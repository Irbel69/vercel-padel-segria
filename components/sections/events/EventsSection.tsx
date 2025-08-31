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
import EventList from "@/components/tournaments/EventList";
import { useBadges } from "@/components/tournaments/hooks/useBadges";
import type { Event as EventType } from "@/types";
import Link from "next/link";

// Legacy grid UI removed in favor of timeline.

export function EventsSection() {
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

	// Minimal helpers to satisfy EventList / EventCard props
	const formatDate = (s: string) => {
		try {
			return new Date(s).toLocaleDateString();
		} catch {
			return s;
		}
	};

	const formatDateTime = (s: string) => {
		try {
			return new Date(s).toLocaleString();
		} catch {
			return s;
		}
	};

	// Use centralized badge helpers so landing matches dashboard styling
	const { getStatusBadge, getRegistrationStatusBadge } = useBadges();

	const canRegister = (e: EventType) => e.status !== "closed";
	const canUnregister = (e: EventType) => e.status !== "closed";

	const isRegistrationUrgent = (deadline: string) => {
		try {
			const d = new Date(deadline);
			const diff = d.getTime() - Date.now();
			return diff < 1000 * 60 * 60 * 24 * 2; // less than 48h
		} catch {
			return false;
		}
	};

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
					<p className="text-lg md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed px-1 md:px-2">
						Descobreix els tornejos més emocionants que estan per venir.
						Uneix-te a la competició i demostra el teu talent en les millors
						pistes de Segrià.
					</p>
				</div>

				{/* Timeline */}
				<div className="relative mb-8 md:mb-16">
					{isLoadingEvents ? (
						<div className="space-y-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="w-full">
									{/* Card-like skeleton matching EventCard structure: hero + content + progress/actions */}
									<div className="bg-white/3 border border-white/6 rounded-lg overflow-hidden">
										<div className="grid grid-cols-1 md:grid-cols-[minmax(220px,33%)_1fr] gap-0">
											<div className="p-4 md:p-0">
												<div className="h-40 md:h-full w-full rounded-md bg-white/6 animate-pulse" />
											</div>
											<div className="p-4 md:p-5">
												<div className="space-y-3">
													<div className="h-6 w-3/4 rounded-md bg-white/6 animate-pulse" />
													<div className="h-4 w-2/3 rounded-md bg-white/6 animate-pulse" />
													<div className="flex items-center gap-3">
														<div className="h-6 w-24 rounded-full bg-white/6 animate-pulse" />
														<div className="h-6 w-20 rounded-full bg-white/6 animate-pulse" />
													</div>
													<div className="h-3 w-full rounded-md bg-white/6 animate-pulse" />
													<div className="flex items-center justify-between pt-2">
														<div className="w-2/3">
															<div className="h-8 w-full rounded-md bg-white/6 animate-pulse" />
														</div>
														<div className="w-1/3 md:w-auto">
															<div className="h-8 w-28 rounded-md ml-4 bg-white/6 animate-pulse" />
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						// Replace the timeline with the EventList (cards) on the landing
						<div className="max-w-7xl w-full mx-auto">
							{events.length === 0 ? (
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
							) : (
								// Show EventCards with a landing CTA that redirects to tournaments dashboard
								<div>
									{/* Sort events by start date (closest first) and show only the 2 first fully. */}
									{(() => {
										const sorted = [...events].sort((a, b) => {
											const ta = a.date ? new Date(a.date).getTime() : 0;
											const tb = b.date ? new Date(b.date).getTime() : 0;
											return ta - tb;
										});

										// Filter out events that are effectively closed/full or whose registration deadline passed.
										// Criteria: status === 'closed' OR (current_participants >= max_participants) OR registration_deadline < now
										const now = Date.now();
										const filtered = sorted.filter((ev) => {
											if (ev.status === "closed") return false;
											if (typeof ev.current_participants === "number" && typeof ev.max_participants === "number") {
												if (ev.current_participants >= ev.max_participants) return false;
											}
											try {
												if (ev.registration_deadline && new Date(ev.registration_deadline).getTime() < now) return false;
											} catch (e) {
												// If parsing fails, keep the event
											}
											return true;
										});

										const visible = filtered.slice(0, 3);
										const next = sorted[3];

										return (
											<div className="space-y-6 md:space-y-4">
												{visible.map((ev) => (
													<div key={ev.id}>
														<EventList
															events={[ev]}
															processingEvents={new Set<number>()}
															onInvite={() => {}}
															onUnregister={() => {}}
															formatDate={formatDate}
															formatDateTime={formatDateTime}
															getStatusBadge={getStatusBadge}
															getRegistrationStatusBadge={
																getRegistrationStatusBadge
															}
															canRegister={canRegister}
															canUnregister={canUnregister}
															isRegistrationUrgent={isRegistrationUrgent}
															onShowCode={() => {}}
															hideActions={true}
															hideProgress={true}
															landingHref="/dashboard/tournaments"
														/>
													</div>
												))}
											</div>
										);
									})()}
								</div>
							)}
						</div>
					)}

					{/* Show message if no events */}
					{!isLoadingEvents && events.length === 0 && (
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
