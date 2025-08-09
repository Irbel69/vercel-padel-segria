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
			month: "2-digit",
			day: "2-digit",
		});
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString("ca-ES", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
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
		<div className="space-y-4 md:space-y-6 px-4 md:px-0">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center gap-3">
				<div className="p-2 bg-padel-primary/20 rounded-lg">
					<Target className="h-6 w-6 text-padel-primary" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-white">
						Tornejos
					</h1>
					<p className="text-white/60 text-sm md:text-base">
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

			<Tabs defaultValue="available" className="space-y-4 md:space-y-6">
				<TabsList className="bg-white/5 border-white/10 w-full sm:w-auto">
					<TabsTrigger
						value="available"
						className="data-[state=active]:bg-padel-primary data-[state=active]:text-black text-xs sm:text-sm flex-1 sm:flex-initial">
						<span className="sm:hidden">Disponibles</span>
						<span className="hidden sm:inline">Esdeveniments Disponibles</span>
					</TabsTrigger>
					<TabsTrigger
						value="my-registrations"
						className="data-[state=active]:bg-padel-primary data-[state=active]:text-black text-xs sm:text-sm flex-1 sm:flex-initial">
						<span className="sm:hidden">Meves</span>
						<span className="hidden sm:inline">Les Meves Inscripcions</span>
					</TabsTrigger>
				</TabsList>

				{/* Available Events */}
				<TabsContent value="available">
					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<span className="text-lg md:text-xl">
									Esdeveniments Disponibles
								</span>
								{pagination && (
									<Badge
										variant="secondary"
										className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto">
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
								<div className="space-y-3 md:space-y-4">
									{events.map((event) => (
										<div
											key={event.id}
											className="p-3 md:p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
											<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
												<div className="flex-1">
													<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
														<h3 className="text-white font-semibold text-base md:text-lg">
															{event.title}
														</h3>
														<div className="flex gap-2">
															{getStatusBadge(event.status)}
															{event.user_registration_status &&
																getRegistrationStatusBadge(
																	event.user_registration_status
																)}
														</div>
													</div>

													<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 text-sm text-white/70">
														<div className="flex items-center gap-2">
															<Calendar className="h-4 w-4 flex-shrink-0" />
															<span className="truncate">
																{formatDate(event.date)}
															</span>
														</div>
														{event.location && (
															<div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
																<div className="flex items-center gap-2 min-w-0 flex-1">
																	<MapPin className="h-4 w-4 flex-shrink-0" />
																	<span className="truncate">
																		{event.location}
																	</span>
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
															<Users className="h-4 w-4 flex-shrink-0" />
															<span className="truncate">
																{event.current_participants || 0}/
																{event.max_participants} participants
															</span>
														</div>
													</div>

													<div className="mt-2 text-xs text-white/50">
														<div className="flex items-center gap-2">
															<Clock className="h-3 w-3 flex-shrink-0" />
															<span className="truncate">
																Límit inscripció:{" "}
																{formatDateTime(event.registration_deadline)}
															</span>
														</div>
													</div>

													{event.prizes && (
														<div className="mt-2">
															<div className="flex items-center gap-2 text-sm text-white/60">
																<Trophy className="h-4 w-4 flex-shrink-0" />
																<span className="break-words">
																	{event.prizes}
																</span>
															</div>
														</div>
													)}
												</div>

												<div className="flex flex-row lg:flex-col gap-2 justify-end lg:ml-4">
													{canRegister(event) && (
														<Button
															onClick={() => handleRegister(event.id)}
															disabled={processingEvents.has(event.id)}
															className="bg-padel-primary text-black hover:bg-padel-primary/90 text-sm flex-1 lg:flex-initial">
															<span className="sm:hidden">
																{processingEvents.has(event.id)
																	? "..."
																	: "Inscriure's"}
															</span>
															<span className="hidden sm:inline">
																{processingEvents.has(event.id)
																	? "Inscrivint..."
																	: "Inscriure's"}
															</span>
														</Button>
													)}
													{canUnregister(event) && (
														<Button
															variant="outline"
															onClick={() => handleUnregister(event.id)}
															disabled={processingEvents.has(event.id)}
															className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm flex-1 lg:flex-initial">
															<span className="sm:hidden">
																{processingEvents.has(event.id)
																	? "..."
																	: "Cancel·lar"}
															</span>
															<span className="hidden sm:inline">
																{processingEvents.has(event.id)
																	? "Cancel·lant..."
																	: "Cancel·lar"}
															</span>
														</Button>
													)}
													{event.user_registration_status &&
														!canUnregister(event) && (
															<Button
																variant="outline"
																disabled
																className="bg-white/10 border-white/20 text-white/50 text-sm flex-1 lg:flex-initial">
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
								<div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-white/10 gap-4">
									<p className="text-white/60 text-sm text-center sm:text-left">
										Pàgina {pagination.currentPage} de {pagination.totalPages}
									</p>
									<div className="flex gap-2 w-full sm:w-auto">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handlePageChange(pagination.currentPage - 1)
											}
											disabled={pagination.currentPage === 1}
											className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial">
											<ChevronLeft className="h-4 w-4" />
											<span className="hidden sm:inline">Anterior</span>
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handlePageChange(pagination.currentPage + 1)
											}
											disabled={!pagination.hasMore}
											className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial">
											<span className="hidden sm:inline">Següent</span>
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
							<CardTitle className="text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<span className="text-lg md:text-xl">
									Les Meves Inscripcions
								</span>
								<Badge
									variant="secondary"
									className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto">
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
								<div className="space-y-3 md:space-y-4">
									{userRegistrations.map((registration) => (
										<div
											key={registration.id}
											className="p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
											<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
												<div className="flex-1">
													<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
														<h3 className="text-white font-semibold text-base md:text-lg">
															{registration.event?.title}
														</h3>
														{getRegistrationStatusBadge(registration.status)}
													</div>

													<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 text-sm text-white/70">
														<div className="flex items-center gap-2">
															<Calendar className="h-4 w-4 flex-shrink-0" />
															<span className="truncate">
																{formatDate(registration.event?.date || "")}
															</span>
														</div>
														{registration.event?.location && (
															<div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
																<div className="flex items-center gap-2 min-w-0 flex-1">
																	<MapPin className="h-4 w-4 flex-shrink-0" />
																	<span className="truncate">
																		{registration.event.location}
																	</span>
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
															<Users className="h-4 w-4 flex-shrink-0" />
															<span className="truncate">
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
																<Trophy className="h-4 w-4 flex-shrink-0" />
																<span className="break-words">
																	{registration.event.prizes}
																</span>
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
														<div className="flex justify-end lg:ml-4">
															<Button
																variant="outline"
																onClick={() =>
																	handleUnregister(registration.event_id)
																}
																disabled={processingEvents.has(
																	registration.event_id
																)}
																className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm w-full sm:w-auto">
																<span className="sm:hidden">
																	{processingEvents.has(registration.event_id)
																		? "..."
																		: "Cancel·lar"}
																</span>
																<span className="hidden sm:inline">
																	{processingEvents.has(registration.event_id)
																		? "Cancel·lant..."
																		: "Cancel·lar"}
																</span>
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
