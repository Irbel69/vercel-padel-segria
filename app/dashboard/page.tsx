"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import ButtonAccount from "@/components/ButtonAccount";
import { useUserStats } from "@/hooks/use-user-stats";
import {
	Activity,
	Trophy,
	TrendingUp,
	Target,
	Award,
	Star,
	Crown,
	Medal,
	ArrowUpRight,
	User,
	Calendar,
	CheckCircle,
	BarChart3,
	Eye,
	Flame,
	Zap,
	Heart,
	Wind,
	Shield,
	Swords,
	BrainCircuit,
	Users,
	Gamepad2,
	type LucideIcon,
} from "lucide-react";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

// Map of quality names to their icons (same as QualityManager)
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

// Function to get quality icon
const getQualityIcon = (qualityName: string): LucideIcon => {
	return qualityIconMap[qualityName] || Award;
};

export default function Dashboard() {
	const router = useRouter();
	const supabase = createClient();
	const { stats, loading: statsLoading, error: statsError } = useUserStats();

	const [user, setUser] = useState<any>(null);
	const [userProfile, setUserProfile] = useState<any>(null);
	const [userQualities, setUserQualities] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadUserData() {
			try {
				const {
					data: { user: authUser },
				} = await supabase.auth.getUser();

				if (!authUser) {
					router.push("/signin");
					return;
				}

				setUser(authUser);

				// Get user profile
				const { data: profile } = await supabase
					.from("users")
					.select("*")
					.eq("id", authUser.id)
					.single();

				if (!profile) {
					router.push("/complete-profile");
					return;
				}

				setUserProfile(profile);

				// Get user qualities
				const { data: qualities } = await supabase
					.from("user_qualities")
					.select(
						`
						quality_id,
						qualities!inner (
							id,
							name
						)
					`
					)
					.eq("user_id", authUser.id);

				setUserQualities(qualities || []);
			} catch (error) {
				console.error("Error loading user data:", error);
			} finally {
				setLoading(false);
			}
		}

		loadUserData();
	}, [router, supabase]);

	if (loading) {
		return (
			<div className="space-y-8">
				<Skeleton className="h-12 w-96" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!user || !userProfile) {
		return null;
	}

	// Use stats from API or fallback to 0
	const matchesPlayed = stats?.matchesPlayed || 0;
	const matchesWon = stats?.matchesWon || 0;
	const winPercentage = stats?.winPercentage || 0;
	const userScore = stats?.userScore || 0;

	// Show error message if stats failed to load
	if (statsError && !statsLoading) {
		console.error("Error loading stats:", statsError);
	}

	return (
		<div className="space-y-8">
			{/* Welcome Header */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<div className="space-y-2">
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
						Hola, {userProfile.name}! 👋
					</h1>
					<p className="text-white/70 text-lg">
						Benvingut al teu tauler de control de Pàdel Segrià
					</p>
				</div>
			</div>

			{/* Main User Profile Card */}
			<Card
				className="border-0 relative overflow-hidden"
				style={{
					background: "rgba(255, 255, 255, 0.1)",
					borderRadius: "20px",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
					backdropFilter: "blur(10px)",
					WebkitBackdropFilter: "blur(10px)",
					border: "1px solid rgba(255, 255, 255, 0.2)",
				}}>
				<CardHeader>
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 bg-padel-primary/20 rounded-full flex items-center justify-center">
							<User className="h-8 w-8 text-padel-primary" />
						</div>
						<div className="flex-1">
							<CardTitle className="text-2xl text-white mb-2">
								{userProfile.name} {userProfile.surname}
							</CardTitle>
							<div className="flex flex-wrap items-center gap-3">
								{userProfile.is_admin && (
									<Badge className="bg-padel-primary/20 text-padel-primary border-padel-primary/30">
										<Crown className="w-3 h-3 mr-1" />
										Administrador
									</Badge>
								)}
								<Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30">
									<Calendar className="w-3 h-3 mr-1" />
									Membre des de {new Date(userProfile.created_at).getFullYear()}
								</Badge>
							</div>
						</div>
						<div className="text-right">
							{statsLoading ? (
								<Skeleton className="h-9 w-16 mb-1" />
							) : (
								<div className="text-3xl font-bold text-white">{userScore}</div>
							)}
							<div className="text-sm text-white/60">Puntuació</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Statistics Grid */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						{/* Matches Won */}
						<div
							className="text-center p-4 rounded-xl"
							style={{
								background: "rgba(255, 255, 255, 0.05)",
								border: "1px solid rgba(255, 255, 255, 0.1)",
							}}>
							<Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
							{statsLoading ? (
								<Skeleton className="h-8 w-12 mx-auto mb-1" />
							) : (
								<div className="text-2xl font-bold text-white">
									{matchesWon}
								</div>
							)}
							<div className="text-sm text-white/60">Partits Guanyats</div>
						</div>

						{/* Matches Played */}
						<div
							className="text-center p-4 rounded-xl"
							style={{
								background: "rgba(255, 255, 255, 0.05)",
								border: "1px solid rgba(255, 255, 255, 0.1)",
							}}>
							<Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
							{statsLoading ? (
								<Skeleton className="h-8 w-12 mx-auto mb-1" />
							) : (
								<div className="text-2xl font-bold text-white">
									{matchesPlayed}
								</div>
							)}
							<div className="text-sm text-white/60">Partits Jugats</div>
						</div>

						{/* Win Percentage */}
						<div
							className="text-center p-4 rounded-xl"
							style={{
								background: "rgba(255, 255, 255, 0.05)",
								border: "1px solid rgba(255, 255, 255, 0.1)",
							}}>
							<BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
							{statsLoading ? (
								<Skeleton className="h-8 w-12 mx-auto mb-1" />
							) : (
								<div className="text-2xl font-bold text-white">
									{winPercentage}%
								</div>
							)}
							<div className="text-sm text-white/60">% Victòries</div>
						</div>

						{/* Skill Level */}
						<div
							className="text-center p-4 rounded-xl"
							style={{
								background: "rgba(255, 255, 255, 0.05)",
								border: "1px solid rgba(255, 255, 255, 0.1)",
							}}>
							<Target className="w-8 h-8 text-orange-400 mx-auto mb-2" />
							<div className="text-2xl font-bold text-white">
								{userProfile.skill_level}
								<span className="text-lg text-white/50">/10</span>
							</div>
							<div className="text-sm text-white/60">
								Nivell d&apos;Habilitat
							</div>
						</div>
					</div>

					{/* Qualities Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2">
							<Star className="w-5 h-5 text-padel-primary" />
							Qualitats Destacades
						</h3>

						{userQualities && userQualities.length > 0 ? (
							<div className="flex items-center justify-center gap-6">
								{userQualities.map((uq: any, index: number) => {
									const IconComponent = getQualityIcon(uq.qualities.name);
									return (
										<div
											key={uq.quality_id}
											className="flex flex-col items-center transition-all duration-300 hover:scale-105">
											<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-padel-primary/20 to-padel-primary/30 flex items-center justify-center border-2 border-padel-primary/40 shadow-lg">
												<IconComponent className="w-10 h-10 text-padel-primary drop-shadow-sm" />
											</div>
											<span className="text-white text-sm font-medium text-center block mt-3 max-w-20 leading-tight">
												{uq.qualities.name}
											</span>
										</div>
									);
								})}
							</div>
						) : (
							<div
								className="text-center p-8 rounded-xl"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<Award className="w-12 h-12 text-white/30 mx-auto mb-4" />
								<div className="text-white/60 mb-2">
									No tens qualitats assignades encara
								</div>
								<div className="text-sm text-white/40">
									Un administrador pot assignar-te fins a 3 qualitats
								</div>
							</div>
						)}
					</div>

					{/* Additional Information */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Player Trend */}
						<div className="space-y-3">
							<h4 className="text-white font-medium flex items-center gap-2">
								<TrendingUp className="w-4 h-4 text-padel-primary" />
								Tendència del Jugador
							</h4>
							<div className="flex items-center gap-3">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center ${
										userProfile.trend === "up"
											? "bg-green-500/20"
											: userProfile.trend === "down"
											? "bg-red-500/20"
											: "bg-gray-500/20"
									}`}>
									{userProfile.trend === "up" && (
										<ArrowUpRight className="h-4 w-4 text-green-400" />
									)}
									{userProfile.trend === "down" && (
										<ArrowUpRight className="h-4 w-4 text-red-400 rotate-180" />
									)}
									{userProfile.trend === "same" && (
										<Activity className="h-4 w-4 text-gray-400" />
									)}
								</div>
								<div>
									<div className="text-white font-medium capitalize">
										{userProfile.trend === "up" && "En Ascens"}
										{userProfile.trend === "down" && "En Descens"}
										{userProfile.trend === "same" && "Estable"}
									</div>
									<div className="text-xs text-white/50">
										Evolució recent del rendiment
									</div>
								</div>
							</div>
						</div>

						{/* Contact Information */}
						<div className="space-y-3">
							<h4 className="text-white font-medium">Informació de Contacte</h4>
							<div className="space-y-2">
								<div className="text-sm">
									<span className="text-white/50">Email: </span>
									<span className="text-white">{userProfile.email}</span>
								</div>
								{userProfile.phone && (
									<div className="text-sm">
										<span className="text-white/50">Telèfon: </span>
										<span className="text-white">{userProfile.phone}</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Observations if available */}
					{userProfile.observations && (
						<div className="space-y-3">
							<h4 className="text-white font-medium">Observacions</h4>
							<div
								className="p-4 rounded-xl text-white/80"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								{userProfile.observations}
							</div>
						</div>
					)}

					{/* Progress Bar */}
					<div className="space-y-3">
						<div className="flex justify-between items-center">
							<h4 className="text-white font-medium">Progrés del Nivell</h4>
							<span className="text-sm text-white/60">
								{userProfile.skill_level}/10
							</span>
						</div>
						<Progress
							value={(userProfile.skill_level / 10) * 100}
							className="h-3"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
