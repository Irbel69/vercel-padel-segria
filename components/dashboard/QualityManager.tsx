"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
	Crown,
	Eye,
	Flame,
	Zap,
	Heart,
	Activity,
	Wind,
	Target,
	ArrowUpRight,
	Shield,
	Swords,
	BrainCircuit,
	Award,
	Trophy,
	Star,
	Medal,
	Users,
	Gamepad2,
	Plus,
	X,
	Sparkles,
	type LucideIcon,
} from "lucide-react";

// Map of quality names to their icons
const qualityIconMap: Record<string, LucideIcon> = {
	Lideratge: Crown,
	Anticipació: Eye,
	Potència: Flame,
	Velocitat: Zap,
	Resistència: Heart,
	Reflexos: Activity,
	Flexibilitat: Wind,
	Equilibri: Target,
	Mobilitat: ArrowUpRight,
	Defensa: Shield,
	Atac: Swords,
	Control: BrainCircuit,
	"Col·locació": Target,
	Volea: Award,
	Globo: Trophy,
	Rematada: Flame,
	Vibora: Zap,
	Servei: Star,
	Sortida: ArrowUpRight,
	Contraatac: Activity,
	"Baixada de pared": Shield,
	Bandeja: Medal,
	Comunicació: Users,
	Adaptació: Wind,
	X3: Gamepad2,
};

interface Quality {
	id: number;
	name: string;
}

interface UserQuality {
	quality_id: number;
	assigned_at: string;
	qualities: Quality;
}

interface QualityManagerProps {
	userId: string;
	userQualities: UserQuality[];
	onQualitiesUpdated: (updatedQualities: UserQuality[]) => void;
}

export function QualityManager({
	userId,
	userQualities,
	onQualitiesUpdated,
}: QualityManagerProps) {
	// Temporary simple render to test
	return (
		<Card className="bg-white/5 border-white/10">
			<CardHeader>
				<CardTitle className="text-white flex items-center gap-2">
					<Sparkles className="h-5 w-5" />
					Qualitats destacades (Test)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-white/60 text-center py-4">
					Component en desenvolupament...
				</div>
			</CardContent>
		</Card>
	);
	const [allQualities, setAllQualities] = useState<Quality[]>([]);
	const [assignedQualities, setAssignedQualities] = useState<
		(Quality | null)[]
	>([null, null, null]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingQualities, setIsLoadingQualities] = useState(true);
	const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

	// Initialize assigned qualities from props
	useEffect(() => {
		const initialQualities: (Quality | null)[] = [null, null, null];

		userQualities.forEach((uq, index) => {
			if (index < 3) {
				initialQualities[index] = uq.qualities;
			}
		});

		setAssignedQualities(initialQualities);
	}, [userQualities]);

	// Fetch all available qualities
	useEffect(() => {
		const fetchQualities = async () => {
			try {
				setIsLoadingQualities(true);
				const response = await fetch("/api/admin/qualities");
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Error carregant les qualitats");
				}

				setAllQualities(data.qualities);
			} catch (error) {
				console.error("Error fetching qualities:", error);
				toast({
					variant: "destructive",
					title: "Error",
					description: "No s'han pogut carregar les qualitats disponibles",
				});
			} finally {
				setIsLoadingQualities(false);
			}
		};

		fetchQualities();
	}, []);

	const handleQualitySelect = async (
		slotIndex: number,
		quality: Quality | null
	) => {
		const newQualities = [...assignedQualities];
		newQualities[slotIndex] = quality;

		// If assigning a quality that's already assigned elsewhere, remove it from the other slot
		if (quality) {
			for (let i = 0; i < newQualities.length; i++) {
				if (i !== slotIndex && newQualities[i]?.id === quality.id) {
					newQualities[i] = null;
				}
			}
		}

		setAssignedQualities(newQualities);
		setSelectedSlot(null);

		// Save to backend
		await saveQualities(newQualities);
	};

	const saveQualities = async (qualities: (Quality | null)[]) => {
		try {
			setIsLoading(true);

			const qualityIds = qualities.map((q) => q?.id || null);

			const response = await fetch(`/api/admin/users/${userId}/qualities`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ qualityIds }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error guardant les qualitats");
			}

			// Update parent component
			onQualitiesUpdated(data.user.user_qualities);

			toast({
				title: "Èxit",
				description: data.message || "Qualitats actualitzades correctament",
			});
		} catch (error) {
			console.error("Error saving qualities:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Error guardant les qualitats",
			});

			// Revert changes on error
			const revertedQualities: (Quality | null)[] = [null, null, null];
			userQualities.forEach((uq, index) => {
				if (index < 3) {
					revertedQualities[index] = uq.qualities;
				}
			});
			setAssignedQualities(revertedQualities);
		} finally {
			setIsLoading(false);
		}
	};

	const getAvailableQualities = (currentSlot: number) => {
		const assignedIds = assignedQualities
			.map((q, index) => (index !== currentSlot ? q?.id : null))
			.filter((id) => id !== null);

		return allQualities.filter((quality) => !assignedIds.includes(quality.id));
	};

	const getQualityIcon = (qualityName: string): LucideIcon => {
		const IconComponent = qualityIconMap[qualityName];
		return IconComponent || Sparkles;
	};

	if (isLoadingQualities) {
		return (
			<Card className="bg-white/5 border-white/10">
				<CardHeader>
					<CardTitle className="text-white flex items-center gap-2">
						<Sparkles className="h-5 w-5" />
						Qualitats destacades
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-white/60 text-center py-4">
						Carregant qualitats...
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="bg-white/5 border-white/10">
			<CardHeader>
				<CardTitle className="text-white flex items-center gap-2">
					<Sparkles className="h-5 w-5" />
					Qualitats destacades
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Horizontal layout for qualities */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
					{assignedQualities.map((quality, index) => (
						<div key={index} className="flex flex-col items-center space-y-3">
							{quality ? (
								// Assigned quality
								<div className="relative group">
									<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-padel-primary/20 to-padel-primary/30 flex items-center justify-center border-2 border-padel-primary/40 shadow-lg transition-all duration-200 hover:from-padel-primary/30 hover:to-padel-primary/40 hover:scale-105 cursor-pointer">
										{(() => {
											const IconComponent = getQualityIcon(quality.name);
											return (
												<IconComponent className="w-12 h-12 text-padel-primary drop-shadow-sm" />
											);
										})()}
									</div>
									<span className="text-white text-sm font-medium text-center block mt-3 max-w-20 leading-tight">
										{quality.name}
									</span>
									{/* Remove button on hover */}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleQualitySelect(index, null)}
										disabled={isLoading}
										className="absolute -top-2 -right-2 h-7 w-7 p-0 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg">
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								// Empty slot with skeleton design
								<Dialog>
									<DialogTrigger asChild>
										<div className="cursor-pointer transition-all duration-200 hover:scale-105 group">
											<div className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40 hover:bg-white/10 transition-all duration-200 group-hover:border-padel-primary/30">
												<Plus className="w-10 h-10 text-white/40 group-hover:text-white/60 transition-colors duration-200" />
											</div>
											<span className="text-white/40 text-sm text-center block mt-3 group-hover:text-white/60 transition-colors duration-200">
												Slot {index + 1}
											</span>
										</div>
									</DialogTrigger>
									<DialogContent className="bg-gray-900 border-white/20 max-w-4xl">
										<DialogHeader>
											<DialogTitle className="text-white text-lg">
												Seleccionar qualitat per al slot {index + 1}
											</DialogTitle>
										</DialogHeader>
										<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto p-2">
											{getAvailableQualities(index).map((availableQuality) => {
												const IconComponent = getQualityIcon(
													availableQuality.name
												);
												return (
													<Button
														key={availableQuality.id}
														variant="outline"
														className="p-4 h-auto flex flex-col items-center space-y-3 bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-padel-primary/50 transition-all duration-200 min-h-[100px]"
														onClick={() =>
															handleQualitySelect(index, availableQuality)
														}
														disabled={isLoading}>
														<div className="w-14 h-14 rounded-xl bg-padel-primary/20 flex items-center justify-center group-hover:bg-padel-primary/30 transition-colors duration-200">
															<IconComponent className="w-8 h-8 text-padel-primary" />
														</div>
														<span className="text-xs text-center leading-tight font-medium max-w-full">
															{availableQuality.name}
														</span>
													</Button>
												);
											})}
										</div>
									</DialogContent>
								</Dialog>
							)}
						</div>
					))}
				</div>

				{isLoading && (
					<div className="text-center py-4 mt-4">
						<Badge
							variant="outline"
							className="bg-padel-primary/10 border-padel-primary/30 text-padel-primary">
							Guardant canvis...
						</Badge>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
