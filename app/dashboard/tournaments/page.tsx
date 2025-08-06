"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertCircle,
	Calendar,
	MapPin,
	Users,
	Trophy,
	Clock,
	CheckCircle,
	XCircle,
	Target,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationMapButton } from "@/components/LocationMapButton";
import type { Event, EventsListResponse, Registration } from "@/types";

export default function TournamentsPage() {
	const { user, profile } = useUser();
	const [events, setEvents] = useState<Event[]>([]);
	const [userRegistrations, setUserRegistrations] = useState<Registration[]>(
		[]
	);
	const [pagination, setPagination] = useState<
		EventsListResponse["pagination"] | null
	>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [processingEvents, setProcessingEvents] = useState<Set<number>>(
		new Set()
	);

	const fetchEvents = async (page: number = 1, status: string = "") => {
		try {
			setIsLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: "10",
			});

			if (status) {
				params.append("status", status);
			}

			const response = await fetch(`/api/events?${params}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error carregant els esdeveniments");
			}

			const typedData = data as EventsListResponse;
			setEvents(typedData.events);
			setPagination(typedData.pagination);
		} catch (err) {
			console.error("Error fetching events:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchUserRegistrations = async () => {
		try {
			setIsRegistrationsLoading(true);

			const response = await fetch("/api/user/registrations");
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error carregant les inscripcions");
			}

			setUserRegistrations(data.registrations || []);
		} catch (err) {
			console.error("Error fetching user registrations:", err);
		} finally {
			setIsRegistrationsLoading(false);
		}
	};

	// Initial load
	useEffect(() => {
		if (user) {
			fetchEvents(currentPage);
			fetchUserRegistrations();
		}
	}, [user, currentPage]);

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
		fetchEvents(newPage);
	};

	const handleRegister = async (eventId: number) => {
		if (processingEvents.has(eventId)) return;

		setProcessingEvents((prev) => new Set(prev).add(eventId));
		setError(null);

		try {
			const response = await fetch(`/api/events/${eventId}/register`, {
				method: "POST",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error processant la inscripció");
			}

			// Actualizar la lista de eventos y registraciones
			fetchEvents(currentPage);
			fetchUserRegistrations();
		} catch (err) {
			console.error("Error registering:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setProcessingEvents((prev) => {
				const newSet = new Set(prev);
				newSet.delete(eventId);
				return newSet;
			});
		}
	};

	const handleUnregister = async (eventId: number) => {
		if (processingEvents.has(eventId)) return;
		if (!confirm("Estàs segur que vols cancel·lar la inscripció?")) return;

		setProcessingEvents((prev) => new Set(prev).add(eventId));
		setError(null);

		try {
			const response = await fetch(`/api/events/${eventId}/register`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error cancel·lant la inscripció");
			}

			// Actualizar la lista de eventos y registraciones
			fetchEvents(currentPage);
			fetchUserRegistrations();
		} catch (err) {
			console.error("Error unregistering:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setProcessingEvents((prev) => {
				const newSet = new Set(prev);
				newSet.delete(eventId);
				return newSet;
			});
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ca-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ca-ES", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "open":
				return (
					<Badge variant="secondary" className="bg-green-500/20 text-green-400">
						Obert
					</Badge>
				);
			case "soon":
				return (
					<Badge
						variant="secondary"
						className="bg-yellow-500/20 text-yellow-400">
						Aviat
					</Badge>
				);
			case "closed":
				return (
					<Badge variant="secondary" className="bg-red-500/20 text-red-400">
						Tancat
					</Badge>
				);
			default:
				return (
					<Badge variant="secondary" className="bg-white/10 text-white/70">
						{status}
					</Badge>
				);
		}
	};

	const getRegistrationStatusBadge = (status: string) => {
		switch (status) {
			case "confirmed":
				return (
					<Badge variant="secondary" className="bg-green-500/20 text-green-400">
						<CheckCircle className="h-3 w-3 mr-1" />
						Confirmat
					</Badge>
				);
			case "pending":
				return (
					<Badge
						variant="secondary"
						className="bg-yellow-500/20 text-yellow-400">
						<Clock className="h-3 w-3 mr-1" />
						Pendent
					</Badge>
				);
			case "cancelled":
				return (
					<Badge variant="secondary" className="bg-red-500/20 text-red-400">
						<XCircle className="h-3 w-3 mr-1" />
						Cancel·lat
					</Badge>
				);
			default:
				return null;
		}
	};

	const canRegister = (event: Event) => {
		const registrationDeadline = new Date(event.registration_deadline);
		const now = new Date();

		return (
			event.status === "open" &&
			registrationDeadline > now &&
			(event.current_participants || 0) < event.max_participants &&
			!event.user_registration_status
		);
	};

	const canUnregister = (event: Event) => {
		const eventDate = new Date(event.date);
		const now = new Date();
		const hoursUntilEvent =
			(eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

		return (
			event.user_registration_status === "confirmed" && hoursUntilEvent >= 24
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2 bg-padel-primary/20 rounded-lg">
					<Target className="h-6 w-6 text-padel-primary" />
				</div>
				<div>
					<h1 className="text-3xl font-bold text-white">Tornejos</h1>
					<p className="text-white/60">
						Participa en competicions i esdeveniments
					</p>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Tabs defaultValue="available" className="space-y-6">
				<TabsList className="bg-white/5 border-white/10">
					<TabsTrigger
						value="available"
						className="data-[state=active]:bg-padel-primary data-[state=active]:text-black">
						Esdeveniments Disponibles
					</TabsTrigger>
					<TabsTrigger
						value="my-registrations"
						className="data-[state=active]:bg-padel-primary data-[state=active]:text-black">
						Les Meves Inscripcions
					</TabsTrigger>
				</TabsList>

				{/* Available Events */}
				<TabsContent value="available">
					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-white flex items-center justify-between">
								<span>Esdeveniments Disponibles</span>
								{pagination && (
									<Badge
										variant="secondary"
										className="bg-padel-primary/20 text-padel-primary">
										{pagination.totalEvents} esdeveniments
									</Badge>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-4">
									{Array.from({ length: 5 }).map((_, i) => (
										<div key={i} className="flex items-center space-x-4">
											<Skeleton className="h-24 w-full" />
										</div>
									))}
								</div>
							) : events.length === 0 ? (
								<div className="text-center py-8">
									<Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
									<p className="text-white/60">
										No hi ha esdeveniments disponibles
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{events.map((event) => (
										<div
											key={event.id}
											className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<h3 className="text-white font-semibold text-lg">
															{event.title}
														</h3>
														{getStatusBadge(event.status)}
														{event.user_registration_status &&
															getRegistrationStatusBadge(
																event.user_registration_status
															)}
													</div>

													<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
														<div className="flex items-center gap-2">
															<Calendar className="h-4 w-4" />
															<span>{formatDate(event.date)}</span>
														</div>
														{event.location && (
															<div className="flex items-center gap-2 justify-between">
																<div className="flex items-center gap-2">
																	<MapPin className="h-4 w-4" />
																	<span>{event.location}</span>
																</div>
																{event.latitude && event.longitude && (
																	<LocationMapButton
																		latitude={event.latitude}
																		longitude={event.longitude}
																		location={event.location}
																	/>
																)}
															</div>
														)}
														<div className="flex items-center gap-2">
															<Users className="h-4 w-4" />
															<span>
																{event.current_participants || 0}/
																{event.max_participants} participants
															</span>
														</div>
													</div>

													<div className="mt-2 text-xs text-white/50">
														<div className="flex items-center gap-2">
															<Clock className="h-3 w-3" />
															<span>
																Límit inscripció:{" "}
																{formatDateTime(event.registration_deadline)}
															</span>
														</div>
													</div>

													{event.prizes && (
														<div className="mt-2">
															<div className="flex items-center gap-2 text-sm text-white/60">
																<Trophy className="h-4 w-4" />
																<span>{event.prizes}</span>
															</div>
														</div>
													)}
												</div>

												<div className="flex gap-2 ml-4">
													{canRegister(event) && (
														<Button
															onClick={() => handleRegister(event.id)}
															disabled={processingEvents.has(event.id)}
															className="bg-padel-primary text-black hover:bg-padel-primary/90">
															{processingEvents.has(event.id)
																? "Inscrivint..."
																: "Inscriure's"}
														</Button>
													)}
													{canUnregister(event) && (
														<Button
															variant="outline"
															onClick={() => handleUnregister(event.id)}
															disabled={processingEvents.has(event.id)}
															className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30">
															{processingEvents.has(event.id)
																? "Cancel·lant..."
																: "Cancel·lar"}
														</Button>
													)}
													{event.user_registration_status &&
														!canUnregister(event) && (
															<Button
																variant="outline"
																disabled
																className="bg-white/10 border-white/20 text-white/50">
																Inscrit
															</Button>
														)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}

							{/* Pagination */}
							{pagination && pagination.totalPages > 1 && (
								<div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
									<p className="text-white/60 text-sm">
										Pàgina {pagination.currentPage} de {pagination.totalPages}
									</p>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handlePageChange(pagination.currentPage - 1)
											}
											disabled={pagination.currentPage === 1}
											className="bg-white/10 border-white/20 text-white hover:bg-white/20">
											<ChevronLeft className="h-4 w-4" />
											Anterior
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handlePageChange(pagination.currentPage + 1)
											}
											disabled={!pagination.hasMore}
											className="bg-white/10 border-white/20 text-white hover:bg-white/20">
											Següent
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* User Registrations */}
				<TabsContent value="my-registrations">
					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-white flex items-center justify-between">
								<span>Les Meves Inscripcions</span>
								<Badge
									variant="secondary"
									className="bg-padel-primary/20 text-padel-primary">
									{userRegistrations.length} inscripcions
								</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isRegistrationsLoading ? (
								<div className="space-y-4">
									{Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="flex items-center space-x-4">
											<Skeleton className="h-20 w-full" />
										</div>
									))}
								</div>
							) : userRegistrations.length === 0 ? (
								<div className="text-center py-8">
									<Target className="h-12 w-12 text-white/40 mx-auto mb-4" />
									<p className="text-white/60">No tens cap inscripció activa</p>
									<p className="text-white/40 text-sm mt-2">
										Explora els esdeveniments disponibles per participar en
										tornejos
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{userRegistrations.map((registration) => (
										<div
											key={registration.id}
											className="p-4 rounded-lg bg-white/5 border border-white/10">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<h3 className="text-white font-semibold text-lg">
															{registration.event?.title}
														</h3>
														{getRegistrationStatusBadge(registration.status)}
													</div>

													<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
														<div className="flex items-center gap-2">
															<Calendar className="h-4 w-4" />
															<span>
																{formatDate(registration.event?.date || "")}
															</span>
														</div>
														{registration.event?.location && (
															<div className="flex items-center gap-2 justify-between">
																<div className="flex items-center gap-2">
																	<MapPin className="h-4 w-4" />
																	<span>{registration.event.location}</span>
																</div>
																{registration.event.latitude &&
																	registration.event.longitude && (
																		<LocationMapButton
																			latitude={registration.event.latitude}
																			longitude={registration.event.longitude}
																			location={registration.event.location}
																		/>
																	)}
															</div>
														)}
														<div className="flex items-center gap-2">
															<Users className="h-4 w-4" />
															<span>
																{registration.event?.current_participants || 0}/
																{registration.event?.max_participants}{" "}
																participants
															</span>
														</div>
													</div>

													<div className="mt-2 text-xs text-white/50">
														<span>
															Inscrit el:{" "}
															{formatDateTime(registration.registered_at)}
														</span>
													</div>

													{registration.event?.prizes && (
														<div className="mt-2">
															<div className="flex items-center gap-2 text-sm text-white/60">
																<Trophy className="h-4 w-4" />
																<span>{registration.event.prizes}</span>
															</div>
														</div>
													)}
												</div>

												{registration.status === "confirmed" &&
													registration.event &&
													canUnregister({
														...registration.event,
														user_registration_status: registration.status,
													}) && (
														<div className="ml-4">
															<Button
																variant="outline"
																onClick={() =>
																	handleUnregister(registration.event_id)
																}
																disabled={processingEvents.has(
																	registration.event_id
																)}
																className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30">
																{processingEvents.has(registration.event_id)
																	? "Cancel·lant..."
																	: "Cancel·lar"}
															</Button>
														</div>
													)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
