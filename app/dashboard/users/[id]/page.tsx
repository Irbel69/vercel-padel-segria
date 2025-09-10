"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
	AlertCircle,
	ArrowLeft,
	User,
	Crown,
	Save,
	Calendar,
	Mail,
	Phone,
	Trophy,
	Target,
	TrendingUp,
	TrendingDown,
	Minus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QualityManager } from "@/components/dashboard/QualityManager";
import type { UserProfile } from "@/types";

interface UserDetailResponse {
	user: UserProfile & {
		score: number;
		matches_played: number;
		matches_won: number;
		user_qualities: Array<{
			quality_id: number;
			assigned_at: string;
			qualities: {
				id: number;
				name: string;
			};
		}>;
	};
}

export default function UserDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { profile, isLoading: userLoading } = useUser();

	const [user, setUser] = useState<UserDetailResponse["user"] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		surname: "",
		phone: "",
		is_admin: false,
		score: 0,
		// Removed: skill_level
		trend: "same" as "up" | "down" | "same",
		shirt_size: null as string | null,
		observations: "",
		image_rights_accepted: false,
		privacy_policy_accepted: false,
	});

	// Shirt sizes loaded from public API
	const [shirtSizes, setShirtSizes] = useState<string[]>([]);

	// Redirect if not admin
	useEffect(() => {
		if (!userLoading && (!profile || !profile.is_admin)) {
			router.push("/dashboard");
		}
	}, [profile, userLoading, router]);

	// Go back helper with safer fallback
	const goBack = () => {
		const fromParam = searchParams?.get?.("from") || null;

		if (fromParam) {
			// Navigate back to the originating page
			router.push(fromParam);
			return;
		}
		// If running in SSR, just push to users
		if (typeof window === "undefined") {
			router.push("/dashboard/users");
			return;
		}

		// If browser history has entries, go back
		try {
			if (window.history.length > 1) {
				router.back();
				return;
			}
		} catch (e) {
			// ignore and fallback below
		}

		// If a referrer from our site exists, try to navigate there
		try {
			const ref = document.referrer;
			if (ref && ref.includes(window.location.origin)) {
				// Use native location replace to ensure navigation when router.back isn't appropriate
				window.location.href = ref;
				return;
			}
		} catch (e) {
			// ignore
		}

		// Fallback: push to users list
		router.push("/dashboard/users");
	};

	// Fetch user data
	useEffect(() => {
		// Fetch available shirt sizes for select
		const fetchShirtSizes = async () => {
			try {
				const res = await fetch(`/api/public/shirt-sizes`);
				const d = await res.json();
				if (res.ok && Array.isArray(d.sizes)) {
					setShirtSizes(d.sizes);
				}
			} catch (e) {
				console.warn("Could not load shirt sizes", e);
			}
		};

		fetchShirtSizes();
		const fetchUser = async () => {
			if (!id || !profile?.is_admin) return;

			try {
				setIsLoading(true);
				setError(null);

				const response = await fetch(`/api/admin/users/${id}`);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Error carregant l'usuari");
				}

				setUser(data.user);

				// Initialize form data
				setFormData({
					name: data.user.name || "",
					surname: data.user.surname || "",
					phone: data.user.phone || "",
					is_admin: data.user.is_admin || false,
					score: data.user.score || 0,
						// Removed: skill_level
					trend: data.user.trend || "same",
					shirt_size: data.user.shirt_size || null,
					observations: data.user.observations || "",
					image_rights_accepted: data.user.image_rights_accepted || false,
					privacy_policy_accepted: data.user.privacy_policy_accepted || false,
				});
			} catch (err) {
				console.error("Error fetching user:", err);
				setError(err instanceof Error ? err.message : "Error desconegut");
			} finally {
				setIsLoading(false);
			}
		};

		fetchUser();
	}, [id, profile?.is_admin]);

	const handleSave = async () => {
		if (!id || !user) return;

		try {
			setIsSaving(true);
			setError(null);

			const response = await fetch(`/api/admin/users/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error guardant els canvis");
			}

			// Update local user data
			setUser((prev) => (prev ? { ...prev, ...data.user } : null));

			toast({
				title: "Èxit",
				description: data.message || "Informació actualitzada correctament",
			});
		} catch (err) {
			console.error("Error saving user:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Error guardant els canvis";
			setError(errorMessage);
			toast({
				variant: "destructive",
				title: "Error",
				description: errorMessage,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleQualitiesUpdated = (
		updatedQualities: UserDetailResponse["user"]["user_qualities"]
	) => {
		setUser((prev) =>
			prev ? { ...prev, user_qualities: updatedQualities } : null
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ca-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getInitials = (name: string | null, surname: string | null) => {
		return (
			`${name?.charAt(0) || ""}${surname?.charAt(0) || ""}`.toUpperCase() || "U"
		);
	};

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case "up":
				return <TrendingUp className="h-4 w-4 text-green-500" />;
			case "down":
				return <TrendingDown className="h-4 w-4 text-red-500" />;
			default:
				return <Minus className="h-4 w-4 text-gray-500" />;
		}
	};

	// Show loading while checking user permissions or loading data
	if (userLoading || isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10" />
					<Skeleton className="h-8 w-48" />
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (error && !user) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="sm"
						onClick={goBack}
						className="bg-white/10 border-white/20 text-white hover:bg-white/20">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Tornar
					</Button>
					<h1 className="text-3xl font-bold text-white">
						Detall d&apos;Usuari
					</h1>
				</div>

				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div className="space-y-6 px-3 sm:px-0">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="sm"
						onClick={goBack}
						className="bg-white/10 border-white/20 text-white hover:bg-white/20">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Tornar
					</Button>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-padel-primary/20 rounded-lg">
							<User className="h-6 w-6 text-padel-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">
								Detall d&apos;Usuari
							</h1>
							<p className="text-white/60">
								Gestiona la informació de l&apos;usuari
							</p>
						</div>
					</div>
				</div>

					<Button
						onClick={handleSave}
						disabled={isSaving}
						className="bg-padel-primary text-black hover:bg-padel-primary/90">
						<Save className="h-4 w-4 mr-2" />
						{isSaving ? "Guardant..." : "Guardar Canvis"}
					</Button>
			</div>

			{/* Error Message */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="space-y-6">
				{/* First row: Profile Overview and Edit Form */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Overview */}
					<Card className="lg:col-span-1 bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-white flex items-center gap-2">
								<User className="h-5 w-5" />
								Perfil d&apos;Usuari
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-col items-center space-y-4">
								<Avatar className="h-24 w-24">
									<AvatarImage src={user.avatar_url || ""} />
									<AvatarFallback className="bg-padel-primary/20 text-padel-primary text-xl">
										{getInitials(user.name, user.surname)}
									</AvatarFallback>
								</Avatar>

								<div className="text-center space-y-2">
									<div className="flex items-center justify-center gap-2">
										<h3 className="text-lg font-semibold text-white">
											{user.name && user.surname
												? `${user.name} ${user.surname}`
												: user.email}
										</h3>
										{user.is_admin && (
											<Crown className="h-5 w-5 text-yellow-500" />
										)}
									</div>
									<p className="text-white/60 text-sm">{user.email}</p>
									{user.phone && (
										<p className="text-white/40 text-sm flex items-center justify-center gap-1">
											<Phone className="h-3 w-3" />
											{user.phone}
										</p>
									)}
									{user.shirt_size && (
										<p className="text-white/40 text-sm flex items-center justify-center gap-1">
											<span className="text-white/60">Talla:</span>
											<span className="text-white font-medium">{user.shirt_size}</span>
										</p>
									)}
								</div>
							</div>

							<Separator className="bg-white/10" />

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-white/60 text-sm">Rol:</span>
									<Badge
										variant={user.is_admin ? "default" : "secondary"}
										className={
											user.is_admin
												? "bg-yellow-500/20 text-yellow-400"
												: "bg-white/10 text-white/70"
										}>
										{user.is_admin ? "Administrador" : "Usuari"}
									</Badge>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-white/60 text-sm flex items-center gap-1">
										<Trophy className="h-3 w-3" />
										Puntuació:
									</span>
									<span className="text-white font-medium">
										{user.score || 0}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-white/60 text-sm flex items-center gap-1">
										<Target className="h-3 w-3" />
										Partits jugats:
									</span>
									<span className="text-white font-medium">
										{user.matches_played || 0}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-white/60 text-sm flex items-center gap-1">
										<Trophy className="h-3 w-3" />
										Partits guanyats:
									</span>
									<span className="text-white font-medium">
										{user.matches_won || 0}
									</span>
								</div>

								{/* Removed: Skill level display */}

								<div className="flex items-center justify-between">
									<span className="text-white/60 text-sm">Tendència:</span>
									<div className="flex items-center gap-1">
										{getTrendIcon(user.trend)}
										<span className="text-white/70 text-sm capitalize">
											{user.trend}
										</span>
									</div>
								</div>
							</div>

							<Separator className="bg-white/10" />

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-white/60 text-sm">Registrat:</span>
									<span className="text-white/70 text-xs">
										{formatDate(user.created_at)}
									</span>
								</div>
								{user.updated_at !== user.created_at && (
									<div className="flex items-center justify-between">
										<span className="text-white/60 text-sm">Actualitzat:</span>
										<span className="text-white/70 text-xs">
											{formatDate(user.updated_at)}
										</span>
									</div>
								)}
							</div>

							{/* User Qualities */}
							{user.user_qualities && user.user_qualities.length > 0 && (
								<>
									<Separator className="bg-white/10" />
									<div className="space-y-2">
										<span className="text-white/60 text-sm">Qualitats:</span>
										<div className="flex flex-wrap gap-1">
											{user.user_qualities.map((uq) => (
												<Badge
													key={uq.quality_id}
													variant="outline"
													className="bg-padel-primary/10 border-padel-primary/30 text-padel-primary text-xs">
													{uq.qualities.name}
												</Badge>
											))}
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Edit Form */}
					<Card className="lg:col-span-2 bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-white">Editar Informació</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Personal Information */}
							<div className="space-y-4">
								<h4 className="text-white font-medium">Informació Personal</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="email" className="text-white/70">
											Email
										</Label>
										<Input
											id="email"
											value={user.email}
											disabled
											className="bg-white/10 border-white/20 text-white"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="name" className="text-white/70">
											Nom
										</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
											placeholder="Nom de l'usuari"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="surname" className="text-white/70">
											Cognom
										</Label>
										<Input
											id="surname"
											value={formData.surname}
											onChange={(e) =>
												handleInputChange("surname", e.target.value)
											}
											className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
											placeholder="Cognom de l'usuari"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone" className="text-white/70">
										Telèfon
									</Label>
									<Input
										id="phone"
										value={formData.phone}
										onChange={(e) => handleInputChange("phone", e.target.value)}
										className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
										placeholder="Número de telèfon"
									/>
								</div>

								{/* Shirt size */}
								<div className="space-y-2">
									<Label htmlFor="shirt_size" className="text-white/70">
										Talla de samarreta
									</Label>
									<Select
										value={formData.shirt_size || ""}
										onValueChange={(value) =>
											handleInputChange("shirt_size", value || null)
										}
									>
										<SelectTrigger className="bg-white/10 border-white/20 text-white">
											<SelectValue placeholder="Selecciona una talla" />
										</SelectTrigger>
										<SelectContent>
											{shirtSizes.length > 0 ? (
												shirtSizes.map((s) => (
													<SelectItem key={s} value={s}>
														{s}
													</SelectItem>
												))
											) : (
												<>
													<SelectItem value="XS">XS</SelectItem>
													<SelectItem value="S">S</SelectItem>
													<SelectItem value="M">M</SelectItem>
													<SelectItem value="L">L</SelectItem>
													<SelectItem value="XL">XL</SelectItem>
													<SelectItem value="XXL">XXL</SelectItem>
												</>
											)}
										</SelectContent>
									</Select>
								</div>
							</div>

							<Separator className="bg-white/10" />

							{/* Role and Permissions */}
							<div className="space-y-4">
								<h4 className="text-white font-medium">Rol i Permisos</h4>
								<div className="flex items-center space-x-2">
									<Switch
										id="is_admin"
										checked={formData.is_admin}
										onCheckedChange={(checked) =>
											handleInputChange("is_admin", checked)
										}
									/>
									<Label htmlFor="is_admin" className="text-white/70">
										Administrador
									</Label>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center space-x-2">
										<Switch
											id="image_rights"
											checked={formData.image_rights_accepted}
											onCheckedChange={(checked) =>
												handleInputChange("image_rights_accepted", checked)
											}
										/>
										<Label
											htmlFor="image_rights"
											className="text-white/70 text-sm">
											Drets d&apos;imatge acceptats
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											id="privacy_policy"
											checked={formData.privacy_policy_accepted}
											onCheckedChange={(checked) =>
												handleInputChange("privacy_policy_accepted", checked)
											}
										/>
										<Label
											htmlFor="privacy_policy"
											className="text-white/70 text-sm">
											Política de privacitat acceptada
										</Label>
									</div>
								</div>
							</div>

							<Separator className="bg-white/10" />

							{/* Game Statistics */}
							<div className="space-y-4">
								<h4 className="text-white font-medium">Estadístiques de Joc</h4>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label htmlFor="score" className="text-white/70">
											Puntuació
										</Label>
										<Input
											id="score"
											type="number"
											min="0"
											value={formData.score}
											onChange={(e) =>
												handleInputChange(
													"score",
													parseInt(e.target.value) || 0
												)
											}
											className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-white/70">Partits Jugats</Label>
										<div className="bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white/80">
											{user.matches_played || 0}
										</div>
									</div>
									<div className="space-y-2">
										<Label className="text-white/70">Partits Guanyats</Label>
										<div className="bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white/80">
											{user.matches_won || 0}
										</div>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Removed: Skill level input */}
									<div className="space-y-2">
										<Label htmlFor="trend" className="text-white/70">
											Tendència
										</Label>
										<Select
											value={formData.trend}
											onValueChange={(value) =>
												handleInputChange("trend", value)
											}>
											<SelectTrigger className="bg-white/10 border-white/20 text-white">
												<SelectValue placeholder="Selecciona una tendència" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="up">
													<div className="flex items-center gap-2">
														<TrendingUp className="h-4 w-4 text-green-500" />
														Pujant
													</div>
												</SelectItem>
												<SelectItem value="same">
													<div className="flex items-center gap-2">
														<Minus className="h-4 w-4 text-gray-500" />
														Igual
													</div>
												</SelectItem>
												<SelectItem value="down">
													<div className="flex items-center gap-2">
														<TrendingDown className="h-4 w-4 text-red-500" />
														Baixant
													</div>
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							<Separator className="bg-white/10" />

							{/* Observations */}
							<div className="space-y-4">
								<h4 className="text-white font-medium">Observacions</h4>
								<div className="space-y-2">
									<Label htmlFor="observations" className="text-white/70">
										Notes additionals
									</Label>
									<Textarea
										id="observations"
										value={formData.observations}
										onChange={(e) =>
											handleInputChange("observations", e.target.value)
										}
										className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
										placeholder="Observacions sobre l'usuari..."
										rows={3}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Second row: Quality Manager */}
				<QualityManager
					userId={user.id}
					userQualities={user.user_qualities}
					onQualitiesUpdated={handleQualitiesUpdated}
				/>
			</div>
		</div>
	);
}
