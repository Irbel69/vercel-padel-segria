"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/components/map/LocationPicker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertCircle,
	Search,
	Plus,
	Calendar,
	MapPin,
	Users,
	Trophy,
	Clock,
	Edit,
	Trash2,
	Eye,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Event, EventsListResponse, CreateEventData } from "@/types";

export default function AdminEventsPage() {
	const { user, profile, isLoading: userLoading } = useUser();
	const [events, setEvents] = useState<Event[]>([]);
	const [pagination, setPagination] = useState<
		EventsListResponse["pagination"] | null
	>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
		null
	);

	// Create/Edit Event Modal
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<CreateEventData>({
		title: "",
		date: "",
		location: "",
		latitude: undefined,
		longitude: undefined,
		prizes: "",
		max_participants: 16,
		registration_deadline: "",
	});

	// Redirect if not admin
	useEffect(() => {
		if (!userLoading && (!profile || !profile.is_admin)) {
			redirect("/dashboard");
		}
	}, [profile, userLoading]);

	const fetchEvents = async (page: number = 1, searchTerm: string = "") => {
		try {
			setIsLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: "10",
			});

			if (searchTerm) {
				params.append("search", searchTerm);
			}

			const response = await fetch(`/api/admin/events?${params}`);
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

	// Handle search with debounce
	useEffect(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		const timeout = setTimeout(() => {
			setCurrentPage(1);
			fetchEvents(1, search);
		}, 500);

		setSearchTimeout(timeout);

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [search]);

	// Initial load
	useEffect(() => {
		if (profile?.is_admin) {
			fetchEvents(currentPage, search);
		}
	}, [profile?.is_admin, currentPage]);

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
		fetchEvents(newPage, search);
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

	const resetForm = () => {
		setFormData({
			title: "",
			date: "",
			location: "",
			latitude: undefined,
			longitude: undefined,
			prizes: "",
			max_participants: 16,
			registration_deadline: "",
		});
		setIsEditing(false);
		setEditingEvent(null);
	};

	const openCreateModal = () => {
		resetForm();
		setIsCreateModalOpen(true);
	};

	const openEditModal = (event: Event) => {
		setFormData({
			title: event.title,
			date: event.date,
			location: event.location || "",
			latitude: event.latitude || undefined,
			longitude: event.longitude || undefined,
			prizes: event.prizes || "",
			max_participants: event.max_participants,
			registration_deadline: event.registration_deadline,
		});
		setEditingEvent(event);
		setIsEditing(true);
		setIsCreateModalOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const url = isEditing
				? `/api/admin/events/${editingEvent?.id}`
				: "/api/admin/events";
			const method = isEditing ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error processant la sol·licitud");
			}

			setIsCreateModalOpen(false);
			resetForm();
			fetchEvents(currentPage, search);
		} catch (err) {
			console.error("Error submitting event:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (eventId: number) => {
		// First simple confirmation
		if (!confirm("Estàs segur que vols eliminar aquest esdeveniment?")) {
			return;
		}

		try {
			// Try to delete without force to check if there are registrations
			const response = await fetch(`/api/admin/events/${eventId}`, {
				method: "DELETE",
			});

			const data = await response.json();

			// If successful deletion (no registrations)
			if (response.ok) {
				fetchEvents(currentPage, search);
				return;
			}

			// If the tournament has registrations, show warning dialog
			if (data.error === "tournament_has_registrations") {
				const registrationsCount = data.registrations_count;
				const confirmed = confirm(
					`Aquest torneig té ${registrationsCount} inscripció${registrationsCount > 1 ? "s" : ""}.\n\n` +
					"S'eliminaran també les reserves de tots els usuaris.\n" +
					"Es recomana comunicar-ho als usuaris inscrits prèviament.\n\n" +
					"Estàs segur que vols continuar amb l'eliminació?"
				);

				if (!confirmed) {
					return;
				}

				// Force delete if confirmed
				const forceResponse = await fetch(`/api/admin/events/${eventId}?force=true`, {
					method: "DELETE",
				});

				const forceData = await forceResponse.json();

				if (!forceResponse.ok) {
					throw new Error(forceData.error || "Error eliminant l'esdeveniment");
				}

				fetchEvents(currentPage, search);
				return;
			}

			// Handle other errors
			throw new Error(data.error || "Error eliminant l'esdeveniment");
		} catch (err) {
			console.error("Error deleting event:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		}
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

	// Show loading while checking user permissions
	if (userLoading || (!profile?.is_admin && !error)) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-padel-primary/20 rounded-lg">
						<Calendar className="h-6 w-6 text-padel-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white">
							Gestió d'Esdeveniments
						</h1>
						<p className="text-white/60">Administra tornejos i competicions</p>
					</div>
				</div>
				<Button
					onClick={openCreateModal}
					className="bg-padel-primary text-black hover:bg-padel-primary/90">
					<Plus className="h-4 w-4 mr-2" />
					Nou Esdeveniment
				</Button>
			</div>

			{/* Search */}
			<Card className="bg-white/5 border-white/10">
				<CardContent className="p-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
						<Input
							placeholder="Cerca per títol o ubicació..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Error Message */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Events List */}
			<Card className="bg-white/5 border-white/10">
				<CardHeader>
					<CardTitle className="text-white flex items-center justify-between">
						<span>Esdeveniments</span>
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
									<Skeleton className="h-20 w-full" />
								</div>
							))}
						</div>
					) : events.length === 0 ? (
						<div className="text-center py-8">
							<Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
							<p className="text-white/60">
								{search
									? "No s'han trobat esdeveniments"
									: "No hi ha esdeveniments creats"}
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
											</div>

											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
												<div className="flex items-center gap-2">
													<Calendar className="h-4 w-4" />
													<span>{formatDate(event.date)}</span>
												</div>
												{event.location && (
													<div className="flex items-center gap-2">
														<MapPin className="h-4 w-4" />
														<span>{event.location}</span>
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
											<Button
												variant="outline"
												size="sm"
												onClick={() => openEditModal(event)}
												className="bg-white/10 border-white/20 text-white hover:bg-white/20">
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDelete(event.id)}
												className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30">
												<Trash2 className="h-4 w-4" />
											</Button>
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
									onClick={() => handlePageChange(pagination.currentPage - 1)}
									disabled={pagination.currentPage === 1}
									className="bg-white/10 border-white/20 text-white hover:bg-white/20">
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(pagination.currentPage + 1)}
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

			{/* Create/Edit Event Modal */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className="bg-black/90 border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{isEditing ? "Editar Esdeveniment" : "Crear Nou Esdeveniment"}
						</DialogTitle>
						<DialogDescription className="text-white/60">
							{isEditing
								? "Modifica les dades de l'esdeveniment"
								: "Omple la informació per crear un nou torneig"}
						</DialogDescription>
					</DialogHeader>

					<div className="max-h-[60vh] overflow-y-auto px-1">
						<form id="event-form" onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="title" className="text-white">
										Títol *
									</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												title: e.target.value,
											}))
										}
										className="bg-white/10 border-white/20 text-white"
										required
									/>
								</div>

								<div>
									<Label htmlFor="date" className="text-white">
										Data de l'esdeveniment *
									</Label>
									<Input
										id="date"
										type="date"
										value={formData.date}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, date: e.target.value }))
										}
										className="bg-white/10 border-white/20 text-white"
										required
									/>
								</div>

								<div className="md:col-span-2">
									<Label className="text-white">Ubicació</Label>
									<LocationPicker
										value={{
											name: formData.location || "",
											latitude: formData.latitude || null,
											longitude: formData.longitude || null,
										}}
										onChange={(location) => {
											setFormData((prev) => ({
												...prev,
												location: location.name,
												latitude: location.latitude || undefined,
												longitude: location.longitude || undefined,
											}));
										}}
									/>
								</div>

								<div>
									<Label htmlFor="max_participants" className="text-white">
										Màxim de participants *
									</Label>
									<Input
										id="max_participants"
										type="number"
										min="4"
										max="64"
										value={formData.max_participants}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												max_participants: parseInt(e.target.value),
											}))
										}
										className="bg-white/10 border-white/20 text-white"
										required
									/>
								</div>

								<div className="md:col-span-2">
									<Label htmlFor="registration_deadline" className="text-white">
										Data límit d'inscripció *
									</Label>
									<Input
										id="registration_deadline"
										type="date"
										value={formData.registration_deadline}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												registration_deadline: e.target.value,
											}))
										}
										className="bg-white/10 border-white/20 text-white"
										required
									/>
								</div>

								<div className="md:col-span-2">
									<Label htmlFor="prizes" className="text-white">
										Premis
									</Label>
									<Textarea
										id="prizes"
										value={formData.prizes}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												prizes: e.target.value,
											}))
										}
										className="bg-white/10 border-white/20 text-white"
										placeholder="1r premi: 500€, 2n premi: 200€..."
										rows={3}
									/>
								</div>
							</div>
						</form>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsCreateModalOpen(false)}
							className="bg-white/10 border-white/20 text-white hover:bg-white/20">
							Cancel·lar
						</Button>
						<Button
							type="submit"
							form="event-form"
							disabled={isSubmitting}
							className="bg-padel-primary text-black hover:bg-padel-primary/90">
							{isSubmitting
								? isEditing
									? "Actualitzant..."
									: "Creant..."
								: isEditing
								? "Actualitzar"
								: "Crear"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
