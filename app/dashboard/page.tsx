"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ButtonAccount from "@/components/ButtonAccount";
import { useUserStats } from "@/hooks/use-user-stats";
import { useToast } from "@/hooks/use-toast";
import {
	Activity,
	Trophy,
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
	Mail,
	Phone,
	Edit3,
	type LucideIcon,
} from "lucide-react";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { useRouter } from "next/navigation";
import EditFieldDialog from "@/components/EditFieldDialog";

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
	const { toast } = useToast();

	const [user, setUser] = useState<any>(null);
	const [userProfile, setUserProfile] = useState<any>(null);
	const [userQualities, setUserQualities] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// Edit dialog states
	const [emailDialogOpen, setEmailDialogOpen] = useState(false);
	const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);

	// Function to update profile field
	const updateProfileField = async (field: string, value: string) => {
		const response = await fetch('/api/user/profile', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ [field]: value }),
		});

		if (!response.ok) {
			throw new Error('Failed to update profile');
		}

		// Update local state
		setUserProfile((prev: any) => ({ ...prev, [field]: value }));
	};

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

						// Fetch profile and qualities in parallel
						const [profileRes, qualitiesRes] = await Promise.all([
							supabase
								.from("users")
								.select(
									"id,name,surname,skill_level,trend,email,phone,observations,created_at,is_admin"
								)
								.eq("id", authUser.id)
								.single(),
							supabase
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
								.eq("user_id", authUser.id),
						]);

						if (!profileRes.data) {
							router.push("/complete-profile");
							return;
						}

						setUserProfile(profileRes.data);
						setUserQualities(qualitiesRes.data || []);
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
				<div className="h-12 w-96 bg-white/10 rounded animate-pulse" />
				<div className="h-64 w-full bg-white/10 rounded animate-pulse" />
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
		<div className="space-y-4 md:space-y-8">
			{/* Welcome Header - Optimized for mobile */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 md:gap-4">
				<div className="space-y-1 md:space-y-2">
					<h1 className="text-xl md:text-4xl font-bold tracking-tight text-white">
						Hola, {userProfile.name}! 👋
					</h1>
					<p className="text-white/70 text-sm md:text-lg">
						Benvingut al teu tauler de control de Pàdel Segrià
					</p>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="block md:hidden space-y-4">
				{/* Mobile Header Card */}
				<Card className="border-0 relative overflow-hidden rounded-xl [background:rgba(255,255,255,0.1)] shadow-lg ring-1 ring-white/20">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-padel-primary/20 rounded-full flex items-center justify-center">
								<User className="h-6 w-6 text-padel-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<h2 className="text-lg font-bold text-white truncate">
									{userProfile.name} {userProfile.surname}
								</h2>
								<div className="flex flex-wrap items-center gap-2 mt-1">
									{userProfile.is_admin && (
										<Badge className="bg-padel-primary/20 text-padel-primary border-padel-primary/30 text-xs">
											<Crown className="w-2.5 h-2.5 mr-1" />
											Admin
										</Badge>
									)}
									<Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 text-xs">
										{new Date(userProfile.created_at).getFullYear()}
									</Badge>
								</div>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-white">
									<CountUp end={userScore} duration={2.5} delay={0.5} />
								</div>
								<div className="text-xs text-white/60">Punts</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Mobile Stats Grid - 1x3 */}
				<div className="grid grid-cols-3 gap-3">
					<Card className="border-0 [background:rgba(255,255,255,0.1)] ring-1 ring-white/20">
						<CardContent className="p-3 text-center">
							<Trophy className="w-6 h-6 text-green-400 mx-auto mb-2" />
							<div className="text-xl font-bold text-white">
								<CountUp end={matchesWon} duration={2.5} delay={0.7} />
							</div>
							<div className="text-xs text-white/60">Guanyats</div>
						</CardContent>
					</Card>

					<Card className="border-0 [background:rgba(255,255,255,0.1)] ring-1 ring-white/20">
						<CardContent className="p-3 text-center">
							<Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
							<div className="text-xl font-bold text-white">
								<CountUp end={matchesPlayed} duration={2.5} delay={0.9} />
							</div>
							<div className="text-xs text-white/60">Jugats</div>
						</CardContent>
					</Card>

					<Card className="border-0 [background:rgba(255,255,255,0.1)] ring-1 ring-white/20">
						<CardContent className="p-3 text-center">
							<BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
							<div className="text-xl font-bold text-white">
								<CountUp end={winPercentage} duration={2.5} delay={1.1} suffix="%" />
							</div>
							<div className="text-xs text-white/60">Victòries</div>
						</CardContent>
					</Card>
				</div>

				{/* Mobile Qualities - Horizontal compact */}
				<Card className="border-0 [background:rgba(255,255,255,0.1)] ring-1 ring-white/20">
					<CardContent className="p-4">
						<h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
							<Star className="w-4 h-4 text-padel-primary" />
							Qualitats Destacades
						</h3>

						{userQualities && userQualities.length > 0 ? (
							<div className="flex items-center justify-around">
								{userQualities.map((uq: any) => {
									const IconComponent = getQualityIcon(uq.qualities.name);
									return (
										<div key={uq.quality_id} className="flex flex-col items-center">
											<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-padel-primary/20 to-padel-primary/30 flex items-center justify-center border border-padel-primary/40">
												<IconComponent className="w-6 h-6 text-padel-primary" />
											</div>
											<span className="text-white text-xs font-medium text-center mt-2 max-w-16 leading-tight">
												{uq.qualities.name}
											</span>
										</div>
									);
								})}
							</div>
						) : (
							<div className="text-center py-4">
								<Award className="w-8 h-8 text-white/30 mx-auto mb-2" />
								<div className="text-white/60 text-sm mb-1">
									Cap qualitat assignada
								</div>
								<div className="text-xs text-white/40">
									Un admin pot assignar-te fins a 3
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Desktop Layout - Keep existing */}
			<div className="hidden md:block">
				<Card className="border-0 relative overflow-hidden rounded-2xl [background:rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/20">
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
								<div className="text-3xl font-bold text-white">
									<CountUp end={userScore} duration={2.5} delay={0.5} />
								</div>
								<div className="text-sm text-white/60">Puntuació</div>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Statistics Grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Matches Won */}
							<div
								className="text-center p-4 rounded-xl"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
								<div className="text-2xl font-bold text-white">
									<CountUp end={matchesWon} duration={2.5} delay={0.7} />
								</div>
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
								<div className="text-2xl font-bold text-white">
									<CountUp end={matchesPlayed} duration={2.5} delay={0.9} />
								</div>
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
								<div className="text-2xl font-bold text-white">
									<CountUp end={winPercentage} duration={2.5} delay={1.1} suffix="%" />
								</div>
								<div className="text-sm text-white/60">% Victòries</div>
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
						<div className="grid grid-cols-1 gap-6">
							{/* Contact Information */}
							<div className="space-y-4">
								<h4 className="text-white font-medium flex items-center gap-2">
									<User className="w-5 h-5 text-padel-primary" />
									Informació de Contacte
								</h4>
								<div className="grid gap-4">
									{/* Email Card */}
									<div
										className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
										style={{
											background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
											border: "1px solid rgba(255, 255, 255, 0.15)",
											backdropFilter: "blur(10px)",
										}}
										onClick={() => setEmailDialogOpen(true)}
									>
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 flex items-center justify-center border border-blue-400/30">
												<Mail className="w-6 h-6 text-blue-400" />
											</div>
											<div className="flex-1">
												<div className="text-blue-300 text-sm font-medium mb-1">Correu electrònic</div>
												<div className="text-white font-medium text-lg">{userProfile.email}</div>
											</div>
											<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
												<Edit3 className="w-5 h-5 text-white/60" />
											</div>
										</div>
										<div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									</div>

									{/* Phone Card */}
									{userProfile.phone && (
										<div
											className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
											style={{
												background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
												border: "1px solid rgba(255, 255, 255, 0.15)",
												backdropFilter: "blur(10px)",
											}}
											onClick={() => setPhoneDialogOpen(true)}
										>
											<div className="flex items-center gap-3">
												<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/30 flex items-center justify-center border border-green-400/30">
													<Phone className="w-6 h-6 text-green-400" />
												</div>
												<div className="flex-1">
													<div className="text-green-300 text-sm font-medium mb-1">Telèfon</div>
													<div className="text-white font-medium text-lg">{userProfile.phone}</div>
												</div>
												<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
													<Edit3 className="w-5 h-5 text-white/60" />
												</div>
											</div>
											<div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
					</CardContent>
				</Card>
			</div>

			{/* Edit Dialogs */}
			<EditFieldDialog
				isOpen={emailDialogOpen}
				onClose={() => setEmailDialogOpen(false)}
				fieldName="email"
				fieldLabel="Correu electrònic"
				currentValue={userProfile?.email || ""}
				fieldType="email"
				onSave={(value) => updateProfileField("email", value)}
			/>

			<EditFieldDialog
				isOpen={phoneDialogOpen}
				onClose={() => setPhoneDialogOpen(false)}
				fieldName="phone"
				fieldLabel="Telèfon"
				currentValue={userProfile?.phone || ""}
				fieldType="phone"
				onSave={(value) => updateProfileField("phone", value)}
			/>
		</div>
	);
}
