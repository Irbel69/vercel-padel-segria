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
import ButtonAccount from "@/components/ButtonAccount";
import {
	Activity,
	CreditCard,
	DollarSign,
	Users,
	Trophy,
	Calendar,
	TrendingUp,
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

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Hola, {userProfile.name} {userProfile.surname}!
					</h1>
					<p className="text-muted-foreground">
						Benvingut al teu tauler de control de Pàdel Segrià
					</p>
				</div>
				<ButtonAccount />
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Puntuació Total
						</CardTitle>
						<Trophy className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userProfile.score}</div>
						<p className="text-xs text-muted-foreground">Punts acumulats</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Partits Jugats
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{userProfile.matches_played}
						</div>
						<p className="text-xs text-muted-foreground">Total de partits</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Nivell d'Habilitat
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{userProfile.skill_level}/10
						</div>
						<p className="text-xs text-muted-foreground">
							El teu nivell actual
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Tendència</CardTitle>
						<div
							className={`h-4 w-4 ${
								userProfile.trend === "up"
									? "text-green-500"
									: userProfile.trend === "down"
									? "text-red-500"
									: "text-gray-500"
							}`}>
							{userProfile.trend === "up" && <TrendingUp />}
							{userProfile.trend === "down" && (
								<TrendingUp className="rotate-180" />
							)}
							{userProfile.trend === "same" && <Activity />}
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold capitalize">
							{userProfile.trend === "up" && "Pujant"}
							{userProfile.trend === "down" && "Baixant"}
							{userProfile.trend === "same" && "Estable"}
						</div>
						<p className="text-xs text-muted-foreground">Evolució recent</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Informació del Perfil</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Nom complet
								</p>
								<p className="text-lg">
									{userProfile.name} {userProfile.surname}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Correu electrònic
								</p>
								<p className="text-lg">{userProfile.email}</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Membre des de
								</p>
								<p className="text-lg">
									{new Date(userProfile.created_at).toLocaleDateString("ca-ES")}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Tipus d'usuari
								</p>
								<Badge variant={userProfile.is_admin ? "default" : "secondary"}>
									{userProfile.is_admin ? "Administrador" : "Jugador"}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Pròxims Esdeveniments</CardTitle>
						<CardDescription>
							Els teus tornejos i activitats programades
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center space-x-4">
								<div className="w-2 h-2 bg-[#c3fb12] rounded-full"></div>
								<div className="space-y-1">
									<p className="text-sm font-medium leading-none">
										No hi ha esdeveniments programats
									</p>
									<p className="text-xs text-muted-foreground">
										Subscriu-te als propers tornejos
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Resum</TabsTrigger>
					<TabsTrigger value="matches">Historial de Partits</TabsTrigger>
					<TabsTrigger value="tournaments">Tornejos</TabsTrigger>
					<TabsTrigger value="profile">Perfil</TabsTrigger>
				</TabsList>
				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Estadístiques del Jugador</CardTitle>
							<CardDescription>El teu rendiment i evolució</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Partits Guanyats</span>
								<Badge variant="default">Per implementar</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">
									Percentatge de Victòries
								</span>
								<Badge variant="secondary">Per implementar</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Ranking Actual</span>
								<Badge variant="outline">Per implementar</Badge>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="matches" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Historial de Partits</CardTitle>
							<CardDescription>
								Els teus partits recents i resultats
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								Encara no hi ha partits registrats
							</p>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="tournaments" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Tornejos</CardTitle>
							<CardDescription>
								Participa en els nostres tornejos
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								No hi ha tornejos disponibles actualment
							</p>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="profile" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Configuració del Perfil</CardTitle>
							<CardDescription>
								Gestiona la informació del teu compte
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								Configuració del perfil - Per implementar
							</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
