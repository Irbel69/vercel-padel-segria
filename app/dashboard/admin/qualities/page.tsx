"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { AlertCircle, Award, Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getQualityIcon, getAvailableIcons } from "@/lib/qualities";

// Get available icons from centralized function
const availableIcons = getAvailableIcons();

interface Quality {
	id: number;
	name: string;
	icon?: string;
}

interface DeleteConfirmation {
	quality: Quality;
	assignedUsersCount?: number;
	warning?: string;
}

export default function QualitiesPage() {
	const { profile, isLoading: userLoading } = useUser();
	const [qualities, setQualities] = useState<Quality[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [editingQuality, setEditingQuality] = useState<Quality | null>(null);
	const [deleteConfirmation, setDeleteConfirmation] =
		useState<DeleteConfirmation | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		icon: "Award",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const hasLoadedRef = useRef(false);

	// Redirect if not admin
	useEffect(() => {
		if (!userLoading && (!profile || !profile.is_admin)) {
			redirect("/dashboard");
		}
	}, [profile, userLoading]);

	// Load qualities
	useEffect(() => {
		if (profile?.is_admin && !hasLoadedRef.current) {
			hasLoadedRef.current = true;
			loadQualities();
		}
	}, [profile?.is_admin]); // Only depend on the admin status, not the entire profile object

	const loadQualities = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/admin/qualities");
			const data = await response.json();

			if (response.ok) {
				setQualities(data.qualities || []);
			} else {
				hasLoadedRef.current = false; // Reset on error to allow retry
				toast({
					title: "Error",
					description: data.error || "Error carregant les qualitats",
					variant: "destructive",
				});
			}
		} catch (error) {
			hasLoadedRef.current = false; // Reset on error to allow retry
			console.error("Error loading qualities:", error);
			toast({
				title: "Error",
				description: "Error de connexió",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Helper function to reload qualities when needed
	const reloadQualities = () => {
		hasLoadedRef.current = false;
		loadQualities();
	};

	const handleCreate = async () => {
		if (!formData.name.trim()) {
			toast({
				title: "Error",
				description: "El nom de la qualitat és obligatori",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsSubmitting(true);
			const response = await fetch("/api/admin/qualities", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (response.ok) {
				toast({
					title: "Èxit",
					description: "Qualitat creada correctament",
				});
				setQualities([...qualities, data.quality]);
				setShowCreateDialog(false);
				setFormData({ name: "", icon: "Award" });
			} else {
				toast({
					title: "Error",
					description: data.error || "Error creant la qualitat",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error creating quality:", error);
			toast({
				title: "Error",
				description: "Error de connexió",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = async () => {
		if (!editingQuality || !formData.name.trim()) {
			toast({
				title: "Error",
				description: "El nom de la qualitat és obligatori",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsSubmitting(true);
			const response = await fetch("/api/admin/qualities", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: editingQuality.id,
					...formData,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast({
					title: "Èxit",
					description: "Qualitat actualitzada correctament",
				});
				setQualities(
					qualities.map((q) => (q.id === editingQuality.id ? data.quality : q))
				);
				setShowEditDialog(false);
				setEditingQuality(null);
				setFormData({ name: "", icon: "Award" });
			} else {
				toast({
					title: "Error",
					description: data.error || "Error actualitzant la qualitat",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error updating quality:", error);
			toast({
				title: "Error",
				description: "Error de connexió",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteRequest = async (quality: Quality) => {
		try {
			// First, check if the quality is assigned to users
			const response = await fetch(`/api/admin/qualities?id=${quality.id}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (response.ok) {
				if (data.warning) {
					// Show confirmation dialog with warning info
					setDeleteConfirmation({
						quality,
						assignedUsersCount: data.assignedUsersCount,
						warning: data.warning,
					});
				} else {
					// No users assigned, but still show confirmation dialog
					setDeleteConfirmation({
						quality,
						assignedUsersCount: 0,
						warning: undefined,
					});
				}
			} else {
				toast({
					title: "Error",
					description: data.error || "Error eliminant la qualitat",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error deleting quality:", error);
			toast({
				title: "Error",
				description: "Error de connexió",
				variant: "destructive",
			});
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deleteConfirmation) return;

		try {
			// Determine if we need to use force delete based on assigned users
			const forceParam =
				deleteConfirmation.assignedUsersCount > 0 ? "&force=true" : "";
			const response = await fetch(
				`/api/admin/qualities?id=${deleteConfirmation.quality.id}${forceParam}`,
				{
					method: "DELETE",
				}
			);

			const data = await response.json();

			if (response.ok) {
				toast({
					title: "Èxit",
					description: "Qualitat eliminada correctament",
				});
				setQualities(
					qualities.filter((q) => q.id !== deleteConfirmation.quality.id)
				);
			} else {
				toast({
					title: "Error",
					description: data.error || "Error eliminant la qualitat",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error deleting quality:", error);
			toast({
				title: "Error",
				description: "Error de connexió",
				variant: "destructive",
			});
		} finally {
			setDeleteConfirmation(null);
		}
	};

	const openEditDialog = (quality: Quality) => {
		setEditingQuality(quality);
		setFormData({
			name: quality.name,
			icon: quality.icon || "Award",
		});
		setShowEditDialog(true);
	};

	const resetCreateForm = () => {
		setFormData({ name: "", icon: "Award" });
		setShowCreateDialog(false);
	};

	const resetEditForm = () => {
		setFormData({ name: "", icon: "Award" });
		setEditingQuality(null);
		setShowEditDialog(false);
	};

	// Filter qualities based on search term
	const filteredQualities = qualities.filter((quality) =>
		quality.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	if (userLoading || !profile) {
		return (
			<div className="p-6 space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white mb-2">
						Gestió de Qualitats
					</h1>
					<p className="text-white/60">
						Administra les qualitats disponibles per assignar als jugadors
					</p>
				</div>
				<Button
					onClick={() => setShowCreateDialog(true)}
					className="bg-padel-primary hover:bg-padel-primary/80 text-black font-medium">
					<Plus className="w-4 h-4 mr-2" />
					Nova Qualitat
				</Button>
			</div>

			{/* Search and Filters */}
			<Card className="bg-white/10 border-white/20">
				<CardContent className="pt-6">
					<div className="flex items-center gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
							<Input
								placeholder="Cercar qualitats..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
							/>
						</div>
						<Badge variant="outline" className="text-white/70 border-white/20">
							{filteredQualities.length} qualitat
							{filteredQualities.length !== 1 ? "s" : ""}
						</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Qualities Table */}
			<Card className="bg-white/10 border-white/20">
				<CardHeader>
					<CardTitle className="text-white flex items-center gap-2">
						<Award className="w-5 h-5 text-padel-primary" />
						Qualitats del Sistema
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : filteredQualities.length === 0 ? (
						<div className="text-center py-8">
							<Award className="w-12 h-12 text-white/30 mx-auto mb-4" />
							<p className="text-white/60 mb-2">
								{searchTerm
									? "No s'han trobat qualitats"
									: "No hi ha qualitats creades"}
							</p>
							<p className="text-sm text-white/40">
								{searchTerm
									? "Prova amb un altre terme de cerca"
									: "Crea la teva primera qualitat per començar"}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="border-white/20">
									<TableHead className="text-white/70">Icona</TableHead>
									<TableHead className="text-white/70">Nom</TableHead>
									<TableHead className="text-white/70 text-right">
										Accions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredQualities.map((quality) => {
									const IconComponent = getQualityIcon(quality);
									return (
										<TableRow key={quality.id} className="border-white/20">
											<TableCell className="py-4">
												<div className="w-10 h-10 rounded-lg bg-padel-primary/20 flex items-center justify-center">
													<IconComponent className="w-5 h-5 text-padel-primary" />
												</div>
											</TableCell>
											<TableCell className="py-4">
												<div className="text-white font-medium">
													{quality.name}
												</div>
											</TableCell>
											<TableCell className="py-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => openEditDialog(quality)}
														className="bg-white/10 border-white/20 text-white hover:bg-white/20">
														<Edit className="w-4 h-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleDeleteRequest(quality)}
														className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30">
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Create Quality Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={resetCreateForm}>
				<DialogContent className="bg-black/90 border-white/20 text-white">
					<DialogHeader>
						<DialogTitle>Crear Nova Qualitat</DialogTitle>
						<DialogDescription className="text-white/60">
							Afegeix una nova qualitat que els administradors podran assignar
							als jugadors.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="name" className="text-white">
								Nom de la Qualitat
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Ex: Lideratge, Potència..."
								className="bg-white/10 border-white/20 text-white"
							/>
						</div>
						<div>
							<Label className="text-white mb-3 block">
								Selecciona una Icona
							</Label>
							<div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
								{Object.entries(availableIcons).map(
									([iconName, IconComponent]) => (
										<button
											key={iconName}
											type="button"
											onClick={() =>
												setFormData({ ...formData, icon: iconName })
											}
											className={`p-3 rounded-lg border-2 transition-all duration-200 ${
												formData.icon === iconName
													? "border-padel-primary bg-padel-primary/20"
													: "border-white/20 bg-white/5 hover:bg-white/10"
											}`}>
											<IconComponent className="w-5 h-5 mx-auto text-white" />
										</button>
									)
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={resetCreateForm}
							className="bg-white/10 border-white/20 text-white hover:bg-white/20">
							Cancel·lar
						</Button>
						<Button
							onClick={handleCreate}
							disabled={isSubmitting}
							className="bg-padel-primary hover:bg-padel-primary/80 text-black">
							{isSubmitting ? "Creant..." : "Crear Qualitat"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Quality Dialog */}
			<Dialog open={showEditDialog} onOpenChange={resetEditForm}>
				<DialogContent className="bg-black/90 border-white/20 text-white">
					<DialogHeader>
						<DialogTitle>Editar Qualitat</DialogTitle>
						<DialogDescription className="text-white/60">
							Modifica el nom i la icona de la qualitat seleccionada.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-name" className="text-white">
								Nom de la Qualitat
							</Label>
							<Input
								id="edit-name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Ex: Lideratge, Potència..."
								className="bg-white/10 border-white/20 text-white"
							/>
						</div>
						<div>
							<Label className="text-white mb-3 block">
								Selecciona una Icona
							</Label>
							<div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
								{Object.entries(availableIcons).map(
									([iconName, IconComponent]) => (
										<button
											key={iconName}
											type="button"
											onClick={() =>
												setFormData({ ...formData, icon: iconName })
											}
											className={`p-3 rounded-lg border-2 transition-all duration-200 ${
												formData.icon === iconName
													? "border-padel-primary bg-padel-primary/20"
													: "border-white/20 bg-white/5 hover:bg-white/10"
											}`}>
											<IconComponent className="w-5 h-5 mx-auto text-white" />
										</button>
									)
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={resetEditForm}
							className="bg-white/10 border-white/20 text-white hover:bg-white/20">
							Cancel·lar
						</Button>
						<Button
							onClick={handleEdit}
							disabled={isSubmitting}
							className="bg-padel-primary hover:bg-padel-primary/80 text-black">
							{isSubmitting ? "Guardant..." : "Guardar Canvis"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteConfirmation}
				onOpenChange={() => setDeleteConfirmation(null)}>
				<AlertDialogContent className="bg-black/90 border-white/20 text-white">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-red-400" />
							Confirmar Eliminació
						</AlertDialogTitle>
						<AlertDialogDescription className="text-white/60">
							{deleteConfirmation?.warning ||
								`Estàs segur que vols eliminar la qualitat "${deleteConfirmation?.quality.name}"? Aquesta acció no es pot desfer.`}
						</AlertDialogDescription>
						{deleteConfirmation?.assignedUsersCount &&
							deleteConfirmation.assignedUsersCount > 0 && (
								<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-3">
									<p className="text-red-300 text-sm">
										⚠️ Aquesta acció desassociarà la qualitat de{" "}
										{deleteConfirmation.assignedUsersCount} usuari(s).
									</p>
								</div>
							)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
							Cancel·lar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600 hover:bg-red-700 text-white">
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
