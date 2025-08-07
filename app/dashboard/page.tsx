import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ButtonAccount from "@/components/ButtonAccount";
import { RankingsComponent } from "@/components/dashboard/RankingsComponent";
import {
	Activity,
	CreditCard,
	DollarSign,
	Users,
	Trophy,
	Calendar,
	TrendingUp,
	Target,
	Zap,
	Award,
	Star,
	Crown,
	Medal,
	ArrowUpRight,
	Eye,
	Clock,
	Settings,
} from "lucide-react";
import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
	const supabase = createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/signin");
	}

	// Get user profile
	const { data: userProfile } = await supabase
		.from("users")
		.select("*")
		.eq("id", user.id)
		.single();

	if (!userProfile) {
		redirect("/complete-profile");
	}

	// Calculate skill level percentage for progress bar
	const skillLevelPercentage = (userProfile.skill_level / 10) * 100;

	// Calcular estadísticas del usuario basadas en partidos
	const { data: userMatches, error: userMatchesError } = await supabase
		.from("matches")
		.select(
			`
			id,
			winner_pair,
			user_matches (
				position,
				user_id
			)
		`
		)
		.contains("user_matches", [{ user_id: user.id }]);

	// Calcular estadísticas
	let matchesPlayed = 0;
	let matchesWon = 0;
	let points = 0;

	userMatches?.forEach((match) => {
		const userMatch = match.user_matches?.find((um) => um.user_id === user.id);

		if (userMatch) {
			matchesPlayed++;

			const userPosition = userMatch.position;
			const isInPair1 = userPosition === 1 || userPosition === 3;
			const isInPair2 = userPosition === 2 || userPosition === 4;
			const userPair = isInPair1 ? 1 : isInPair2 ? 2 : null;

			if (match.winner_pair && match.winner_pair === userPair) {
				matchesWon++;
				points += 10; // 10 puntos por victoria
			} else if (match.winner_pair) {
				points += 3; // 3 puntos por derrota
			}
		}
	});

	const winPercentage =
		matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

	// Get skill level badge
	const getSkillLevelBadge = (level: number) => {
		if (level >= 9)
			return {
				text: "Expert",
				color: "bg-padel-primary/20 text-padel-primary border-padel-primary/30",
			};
		if (level >= 7)
			return {
				text: "Avançat",
				color: "bg-green-400/20 text-green-400 border-green-400/30",
			};
		if (level >= 5)
			return {
				text: "Intermedi",
				color: "bg-blue-400/20 text-blue-400 border-blue-400/30",
			};
		if (level >= 3)
			return {
				text: "Principiant",
				color: "bg-orange-400/20 text-orange-400 border-orange-400/30",
			};
		return {
			text: "Nou",
			color: "bg-gray-400/20 text-gray-400 border-gray-400/30",
		};
	};

	const skillBadge = getSkillLevelBadge(userProfile.skill_level);

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
				<div className="flex items-center gap-4">
					<Badge className={skillBadge.color}>
						<Star className="w-3 h-3 mr-1" />
						{skillBadge.text}
					</Badge>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{/* Score Card */}
				<Card
					className="border-0 relative overflow-hidden group hover:scale-105 transition-all duration-300"
					style={{
						background: "rgba(255, 255, 255, 0.1)",
						borderRadius: "20px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
						backdropFilter: "blur(10px)",
						WebkitBackdropFilter: "blur(10px)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
					}}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-white/70">
							Puntuació Total
						</CardTitle>
						<div className="w-10 h-10 bg-padel-primary/20 rounded-xl flex items-center justify-center">
							<Trophy className="h-5 w-5 text-padel-primary" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-white mb-1">{points}</div>
						<p className="text-xs text-white/50">Punts acumulats</p>
						<div className="mt-3 w-full bg-white/10 rounded-full h-2">
							<div
								className="bg-gradient-to-r from-padel-primary to-padel-primary/70 h-2 rounded-full transition-all duration-500"
								style={{
									width: `${Math.min((points / 3000) * 100, 100)}%`,
								}}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Matches Played Card */}
				<Card
					className="border-0 relative overflow-hidden group hover:scale-105 transition-all duration-300"
					style={{
						background: "rgba(255, 255, 255, 0.1)",
						borderRadius: "20px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
						backdropFilter: "blur(10px)",
						WebkitBackdropFilter: "blur(10px)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
					}}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-white/70">
							Partits Jugats
						</CardTitle>
						<div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
							<Activity className="h-5 w-5 text-blue-400" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-white mb-1">
							{matchesPlayed}
						</div>
						<p className="text-xs text-white/50">Total de partits</p>
						<div className="mt-3 flex items-center gap-2">
							<ArrowUpRight className="w-3 h-3 text-green-400" />
							<span className="text-xs text-green-400">+12% aquest mes</span>
						</div>
					</CardContent>
				</Card>

				{/* Skill Level Card */}
				<Card
					className="border-0 relative overflow-hidden group hover:scale-105 transition-all duration-300"
					style={{
						background: "rgba(255, 255, 255, 0.1)",
						borderRadius: "20px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
						backdropFilter: "blur(10px)",
						WebkitBackdropFilter: "blur(10px)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
					}}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-white/70">
							Nivell d'Habilitat
						</CardTitle>
						<div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
							<Target className="h-5 w-5 text-purple-400" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-white mb-1">
							{userProfile.skill_level}
							<span className="text-lg text-white/50">/10</span>
						</div>
						<p className="text-xs text-white/50 mb-3">El teu nivell actual</p>
						<Progress value={skillLevelPercentage} className="h-2" />
					</CardContent>
				</Card>

				{/* Trend Card */}
				<Card
					className="border-0 relative overflow-hidden group hover:scale-105 transition-all duration-300"
					style={{
						background: "rgba(255, 255, 255, 0.1)",
						borderRadius: "20px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
						backdropFilter: "blur(10px)",
						WebkitBackdropFilter: "blur(10px)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
					}}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-white/70">
							Tendència
						</CardTitle>
						<div
							className={`w-10 h-10 rounded-xl flex items-center justify-center ${
								userProfile.trend === "up"
									? "bg-green-500/20"
									: userProfile.trend === "down"
									? "bg-red-500/20"
									: "bg-gray-500/20"
							}`}>
							{userProfile.trend === "up" && (
								<TrendingUp className="h-5 w-5 text-green-400" />
							)}
							{userProfile.trend === "down" && (
								<TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
							)}
							{userProfile.trend === "same" && (
								<Activity className="h-5 w-5 text-gray-400" />
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-white mb-1 capitalize">
							{userProfile.trend === "up" && "Pujant"}
							{userProfile.trend === "down" && "Baixant"}
							{userProfile.trend === "same" && "Estable"}
						</div>
						<p className="text-xs text-white/50">Evolució recent</p>
						<div className="mt-3 flex items-center gap-1">
							{userProfile.trend === "up" && (
								<span className="text-xs text-green-400">
									Millors resultats
								</span>
							)}
							{userProfile.trend === "down" && (
								<span className="text-xs text-red-400">Necessita millorar</span>
							)}
							{userProfile.trend === "same" && (
								<span className="text-xs text-gray-400">
									Rendiment constant
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Profile Information - 2/3 width */}
				<div className="lg:col-span-2">
					<Card
						className="border-0"
						style={{
							background: "rgba(255, 255, 255, 0.1)",
							borderRadius: "20px",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
							backdropFilter: "blur(10px)",
							WebkitBackdropFilter: "blur(10px)",
							border: "1px solid rgba(255, 255, 255, 0.2)",
						}}>
						<CardHeader>
							<CardTitle className="text-white flex items-center gap-2">
								<Users className="w-5 h-5 text-padel-primary" />
								Informació del Perfil
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<p className="text-sm font-medium text-white/50">
										Nom complet
									</p>
									<p className="text-lg text-white font-medium">
										{userProfile.name} {userProfile.surname}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium text-white/50">
										Correu electrònic
									</p>
									<p className="text-lg text-white/80">{userProfile.email}</p>
								</div>
								{userProfile.phone && (
									<div className="space-y-2">
										<p className="text-sm font-medium text-white/50">Telèfon</p>
										<p className="text-lg text-white/80">{userProfile.phone}</p>
									</div>
								)}
								<div className="space-y-2">
									<p className="text-sm font-medium text-white/50">
										Membre des de
									</p>
									<p className="text-lg text-white/80">
										{new Date(userProfile.created_at).toLocaleDateString(
											"ca-ES"
										)}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium text-white/50">
										Tipus d'usuari
									</p>
									<Badge
										className={
											userProfile.is_admin
												? "bg-padel-primary/20 text-padel-primary border-padel-primary/30"
												: "bg-blue-400/20 text-blue-400 border-blue-400/30"
										}>
										{userProfile.is_admin ? (
											<>
												<Crown className="w-3 h-3 mr-1" />
												Administrador
											</>
										) : (
											<>
												<Trophy className="w-3 h-3 mr-1" />
												Jugador
											</>
										)}
									</Badge>
								</div>
							</div>
							{userProfile.observations && (
								<div className="pt-4 border-t border-white/10">
									<p className="text-sm font-medium text-white/50 mb-3">
										Observacions
									</p>
									<div
										className="text-sm text-white/80 p-4 rounded-xl"
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

				{/* Quick Actions & Events - 1/3 width */}
				<div className="space-y-6">
					{/* Upcoming Events */}
					<Card
						className="border-0"
						style={{
							background: "rgba(255, 255, 255, 0.1)",
							borderRadius: "20px",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
							backdropFilter: "blur(10px)",
							WebkitBackdropFilter: "blur(10px)",
							border: "1px solid rgba(255, 255, 255, 0.2)",
						}}>
						<CardHeader>
							<CardTitle className="text-white flex items-center gap-2">
								<Calendar className="w-5 h-5 text-padel-primary" />
								Pròxims Esdeveniments
							</CardTitle>
							<CardDescription className="text-white/60">
								Els teus tornejos i activitats programades
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div
									className="flex items-center space-x-4 p-4 rounded-xl"
									style={{
										background: "rgba(255, 255, 255, 0.05)",
										border: "1px solid rgba(255, 255, 255, 0.1)",
									}}>
									<div className="w-3 h-3 bg-padel-primary rounded-full"></div>
									<div className="space-y-1 flex-1">
										<p className="text-sm font-medium leading-none text-white">
											No hi ha esdeveniments programats
										</p>
										<p className="text-xs text-white/50">
											Subscriu-te als propers tornejos
										</p>
									</div>
									<Clock className="w-4 h-4 text-white/40" />
								</div>
								<Button
									className="w-full bg-padel-primary/20 text-padel-primary hover:bg-padel-primary/30 border border-padel-primary/30 hover:border-padel-primary/50 transition-all duration-300"
									variant="outline">
									<Trophy className="w-4 h-4 mr-2" />
									Veure Tornejos
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Quick Stats */}
					<Card
						className="border-0"
						style={{
							background: "rgba(255, 255, 255, 0.1)",
							borderRadius: "20px",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
							backdropFilter: "blur(10px)",
							WebkitBackdropFilter: "blur(10px)",
							border: "1px solid rgba(255, 255, 255, 0.2)",
						}}>
						<CardHeader>
							<CardTitle className="text-white flex items-center gap-2">
								<Award className="w-5 h-5 text-padel-primary" />
								Estadístiques Ràpides
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-white">
										{matchesWon}
									</div>
									<div className="text-xs text-white/50">Victòries</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-white">
										{matchesPlayed - matchesWon}
									</div>
									<div className="text-xs text-white/50">Derrotes</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-padel-primary">
										{winPercentage}%
									</div>
									<div className="text-xs text-white/50">% Victòries</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-400">#12</div>
									<div className="text-xs text-white/50">Ranking</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Ranking Component */}
			<RankingsComponent />

			{/* Tabs Section */}
			<Card
				className="border-0"
				style={{
					background: "rgba(255, 255, 255, 0.1)",
					borderRadius: "20px",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
					backdropFilter: "blur(10px)",
					WebkitBackdropFilter: "blur(10px)",
					border: "1px solid rgba(255, 255, 255, 0.2)",
				}}>
				<CardContent className="p-6">
					<Tabs defaultValue="overview" className="space-y-6">
						<TabsList className="bg-white/5 border border-white/10">
							<TabsTrigger
								value="overview"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								Resum
							</TabsTrigger>
							<TabsTrigger
								value="matches"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								Historial de Partits
							</TabsTrigger>
							<TabsTrigger
								value="tournaments"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								Tornejos
							</TabsTrigger>
							<TabsTrigger
								value="profile"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								Perfil
							</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-4">
							<div
								className="p-6 rounded-xl"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<h3 className="text-lg font-semibold text-white mb-4">
									Estadístiques del Jugador
								</h3>
								<p className="text-white/70 mb-6">
									El teu rendiment i evolució durant aquesta temporada
								</p>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-white/70">
											Partits Guanyats
										</span>
										<Badge className="bg-green-400/20 text-green-400 border-green-400/30">
											{matchesWon} de {matchesPlayed}
										</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-white/70">
											Percentatge de Victòries
										</span>
										<Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30">
											{winPercentage}%
										</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-white/70">
											Punts Totals
										</span>
										<Badge className="bg-purple-400/20 text-purple-400 border-purple-400/30">
											{points} pts
										</Badge>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="matches" className="space-y-4">
							<div
								className="p-6 rounded-xl text-center"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<Trophy className="w-12 h-12 text-white/30 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-white mb-2">
									Historial de Partits
								</h3>
								<p className="text-white/60 mb-4">
									{matchesPlayed > 0
										? `Has jugat ${matchesPlayed} partits i has guanyat ${matchesWon}.`
										: "Encara no hi ha partits registrats. Comença a jugar per veure les teves estadístiques aquí!"}
								</p>
								<Button className="bg-padel-primary text-black hover:bg-padel-primary/90 font-semibold">
									Reservar Pista
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="tournaments" className="space-y-4">
							<div
								className="p-6 rounded-xl text-center"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<Medal className="w-12 h-12 text-white/30 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-white mb-2">
									Tornejos
								</h3>
								<p className="text-white/60 mb-4">
									Descobreix els propers tornejos i competitions. Participa per
									pujar al ranking!
								</p>
								<Button className="bg-padel-primary text-black hover:bg-padel-primary/90 font-semibold">
									Veure Tornejos
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="profile" className="space-y-4">
							<div
								className="p-6 rounded-xl"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<h3 className="text-lg font-semibold text-white mb-4">
									Configuració del Perfil
								</h3>
								<p className="text-white/60 mb-6">
									Gestiona la informació del teu compte i preferències
								</p>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Button
										variant="outline"
										className="bg-white/5 border-white/20 text-white hover:bg-white/10">
										<Users className="w-4 h-4 mr-2" />
										Editar Perfil
									</Button>
									<Button
										variant="outline"
										className="bg-white/5 border-white/20 text-white hover:bg-white/10">
										<Settings className="w-4 h-4 mr-2" />
										Configuració
									</Button>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
