"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Settings,
	User,
	Bell,
	Shield,
	Palette,
	Save,
	Check,
	Phone,
	Mail,
	UserCircle,
	Globe,
	Lock,
	Database,
	Zap,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function ConfigurationPage() {
	const { profile, refreshProfile } = useUser();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: profile?.name || "",
		surname: profile?.surname || "",
		phone: profile?.phone || "",
		observations: profile?.observations || "",
		emailNotifications: true,
		pushNotifications: false,
		tournamentUpdates: true,
		matchReminders: true,
		darkMode: true,
		language: "ca",
	});

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSwitchChange = (name: string, value: boolean) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSave = async () => {
		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success("Configuració desada correctament!");
			await refreshProfile();
		} catch (error) {
			toast.error("Error desant la configuració");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
						Configuració
					</h1>
					<p className="text-white/70 text-lg">
						Gestiona les teves preferències i configuració del compte
					</p>
				</div>
				<Button
					onClick={handleSave}
					disabled={isLoading}
					className="bg-padel-primary text-black hover:bg-padel-primary/90 font-semibold">
					{isLoading ? (
						<div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
					) : (
						<Save className="w-4 h-4 mr-2" />
					)}
					{isLoading ? "Desant..." : "Desar Canvis"}
				</Button>
			</div>

			{/* Configuration Tabs */}
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
					<Tabs defaultValue="profile" className="space-y-6">
						<TabsList className="bg-white/5 border border-white/10 grid w-full grid-cols-2 lg:grid-cols-4">
							<TabsTrigger
								value="profile"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								<UserCircle className="w-4 h-4 mr-2" />
								Perfil
							</TabsTrigger>
							<TabsTrigger
								value="notifications"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								<Bell className="w-4 h-4 mr-2" />
								Notificacions
							</TabsTrigger>
							<TabsTrigger
								value="appearance"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								<Palette className="w-4 h-4 mr-2" />
								Aparença
							</TabsTrigger>
							<TabsTrigger
								value="security"
								className="data-[state=active]:bg-padel-primary/20 data-[state=active]:text-padel-primary">
								<Shield className="w-4 h-4 mr-2" />
								Seguretat
							</TabsTrigger>
						</TabsList>

						{/* Profile Tab */}
						<TabsContent value="profile" className="space-y-6">
							<div className="grid gap-6 lg:grid-cols-2">
								{/* Personal Information */}
								<Card
									className="border-0"
									style={{
										background: "rgba(255, 255, 255, 0.05)",
										borderRadius: "16px",
										border: "1px solid rgba(255, 255, 255, 0.1)",
									}}>
									<CardHeader>
										<CardTitle className="text-white flex items-center gap-2">
											<User className="w-5 h-5 text-padel-primary" />
											Informació Personal
										</CardTitle>
										<CardDescription className="text-white/60">
											Actualitza la teva informació de perfil
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label className="text-white/70">Nom</Label>
												<Input
													name="name"
													value={formData.name}
													onChange={handleInputChange}
													className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-padel-primary/50"
													placeholder="El teu nom"
												/>
											</div>
											<div className="space-y-2">
												<Label className="text-white/70">Cognoms</Label>
												<Input
													name="surname"
													value={formData.surname}
													onChange={handleInputChange}
													className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-padel-primary/50"
													placeholder="Els teus cognoms"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label className="text-white/70">Telèfon</Label>
											<Input
												name="phone"
												value={formData.phone}
												onChange={handleInputChange}
												className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-padel-primary/50"
												placeholder="+34 XXX XXX XXX"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-white/70">Observacions</Label>
											<Textarea
												name="observations"
												value={formData.observations}
												onChange={handleInputChange}
												className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-padel-primary/50 min-h-[100px]"
												placeholder="Informació adicional sobre el teu joc, preferències, etc."
											/>
										</div>
									</CardContent>
								</Card>

								{/* Account Information */}
								<Card
									className="border-0"
									style={{
										background: "rgba(255, 255, 255, 0.05)",
										borderRadius: "16px",
										border: "1px solid rgba(255, 255, 255, 0.1)",
									}}>
									<CardHeader>
										<CardTitle className="text-white flex items-center gap-2">
											<Shield className="w-5 h-5 text-padel-primary" />
											Informació del Compte
										</CardTitle>
										<CardDescription className="text-white/60">
											Detalls del teu compte i estat actual
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div
											className="p-4 rounded-xl"
											style={{
												background: "rgba(255, 255, 255, 0.05)",
												border: "1px solid rgba(255, 255, 255, 0.1)",
											}}>
											<div className="flex items-center gap-3 mb-2">
												<Mail className="w-4 h-4 text-padel-primary" />
												<span className="text-sm font-medium text-white/70">
													Correu electrònic
												</span>
											</div>
											<p className="text-white font-medium">{profile?.email}</p>
										</div>

										<div
											className="p-4 rounded-xl"
											style={{
												background: "rgba(255, 255, 255, 0.05)",
												border: "1px solid rgba(255, 255, 255, 0.1)",
											}}>
											<div className="flex items-center gap-3 mb-2">
												<User className="w-4 h-4 text-padel-primary" />
												<span className="text-sm font-medium text-white/70">
													Tipus de compte
												</span>
											</div>
											<Badge
												className={
													profile?.is_admin
														? "bg-padel-primary/20 text-padel-primary border-padel-primary/30"
														: "bg-blue-400/20 text-blue-400 border-blue-400/30"
												}>
												{profile?.is_admin ? "Administrador" : "Jugador"}
											</Badge>
										</div>

										<div
											className="p-4 rounded-xl"
											style={{
												background: "rgba(255, 255, 255, 0.05)",
												border: "1px solid rgba(255, 255, 255, 0.1)",
											}}>
											<div className="flex items-center gap-3 mb-2">
												<Check className="w-4 h-4 text-green-400" />
												<span className="text-sm font-medium text-white/70">
													Estat del compte
												</span>
											</div>
											<p className="text-green-400 font-medium">Verificat</p>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Notifications Tab */}
						<TabsContent value="notifications" className="space-y-6">
							<Card
								className="border-0"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									borderRadius: "16px",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<CardHeader>
									<CardTitle className="text-white flex items-center gap-2">
										<Bell className="w-5 h-5 text-padel-primary" />
										Preferències de Notificació
									</CardTitle>
									<CardDescription className="text-white/60">
										Configura com vols rebre les notificacions
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<Label className="text-white font-medium">
													Notificacions per correu
												</Label>
												<p className="text-sm text-white/60">
													Rep actualitzacions importants per email
												</p>
											</div>
											<Switch
												checked={formData.emailNotifications}
												onCheckedChange={(value) =>
													handleSwitchChange("emailNotifications", value)
												}
											/>
										</div>
										<Separator className="bg-white/10" />
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<Label className="text-white font-medium">
													Notificacions push
												</Label>
												<p className="text-sm text-white/60">
													Notificacions immediates al navegador
												</p>
											</div>
											<Switch
												checked={formData.pushNotifications}
												onCheckedChange={(value) =>
													handleSwitchChange("pushNotifications", value)
												}
											/>
										</div>
										<Separator className="bg-white/10" />
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<Label className="text-white font-medium">
													Actualitzacions de tornejos
												</Label>
												<p className="text-sm text-white/60">
													Informació sobre nous tornejos i competicions
												</p>
											</div>
											<Switch
												checked={formData.tournamentUpdates}
												onCheckedChange={(value) =>
													handleSwitchChange("tournamentUpdates", value)
												}
											/>
										</div>
										<Separator className="bg-white/10" />
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<Label className="text-white font-medium">
													Recordatoris de partits
												</Label>
												<p className="text-sm text-white/60">
													Recordatoris abans dels teus partits
												</p>
											</div>
											<Switch
												checked={formData.matchReminders}
												onCheckedChange={(value) =>
													handleSwitchChange("matchReminders", value)
												}
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Appearance Tab */}
						<TabsContent value="appearance" className="space-y-6">
							<Card
								className="border-0"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									borderRadius: "16px",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<CardHeader>
									<CardTitle className="text-white flex items-center gap-2">
										<Palette className="w-5 h-5 text-padel-primary" />
										Configuració d'Aparença
									</CardTitle>
									<CardDescription className="text-white/60">
										Personalitza l'aparença de l'aplicació
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<Label className="text-white font-medium">
													Mode fosc
												</Label>
												<p className="text-sm text-white/60">
													Utilitza el tema fosc per a una millor experiència
													nocturna
												</p>
											</div>
											<Switch
												checked={formData.darkMode}
												onCheckedChange={(value) =>
													handleSwitchChange("darkMode", value)
												}
											/>
										</div>
										<Separator className="bg-white/10" />
										<div className="space-y-2">
											<Label className="text-white font-medium">Idioma</Label>
											<Select
												value={formData.language}
												onValueChange={(value) =>
													setFormData((prev) => ({ ...prev, language: value }))
												}>
												<SelectTrigger className="bg-white/5 border-white/20 text-white">
													<SelectValue placeholder="Selecciona idioma" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="ca">Català</SelectItem>
													<SelectItem value="es">Español</SelectItem>
													<SelectItem value="en">English</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Security Tab */}
						<TabsContent value="security" className="space-y-6">
							<Card
								className="border-0"
								style={{
									background: "rgba(255, 255, 255, 0.05)",
									borderRadius: "16px",
									border: "1px solid rgba(255, 255, 255, 0.1)",
								}}>
								<CardHeader>
									<CardTitle className="text-white flex items-center gap-2">
										<Lock className="w-5 h-5 text-padel-primary" />
										Configuració de Seguretat
									</CardTitle>
									<CardDescription className="text-white/60">
										Gestiona la seguretat del teu compte
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid gap-6 md:grid-cols-2">
										<div
											className="p-4 rounded-xl"
											style={{
												background: "rgba(255, 255, 255, 0.05)",
												border: "1px solid rgba(255, 255, 255, 0.1)",
											}}>
											<div className="flex items-center gap-3 mb-3">
												<Lock className="w-5 h-5 text-padel-primary" />
												<span className="text-white font-medium">
													Contrasenya
												</span>
											</div>
											<p className="text-white/60 text-sm mb-4">
												Última actualització: Fa 30 dies
											</p>
											<Button
												variant="outline"
												size="sm"
												className="bg-white/5 border-white/20 text-white hover:bg-white/10">
												Canviar Contrasenya
											</Button>
										</div>

										<div
											className="p-4 rounded-xl"
											style={{
												background: "rgba(255, 255, 255, 0.05)",
												border: "1px solid rgba(255, 255, 255, 0.1)",
											}}>
											<div className="flex items-center gap-3 mb-3">
												<Shield className="w-5 h-5 text-green-400" />
												<span className="text-white font-medium">
													Autenticació 2FA
												</span>
											</div>
											<p className="text-white/60 text-sm mb-4">
												Protecció adicional per al teu compte
											</p>
											<Button
												variant="outline"
												size="sm"
												className="bg-green-400/10 border-green-400/20 text-green-400 hover:bg-green-400/20">
												Configurar
											</Button>
										</div>
									</div>

									<Separator className="bg-white/10" />

									<div className="space-y-4">
										<h4 className="text-white font-medium">Sessions Actives</h4>
										<div
											className="p-4 rounded-xl"
											style={{
												background: "rgba(255, 255, 255, 0.05)",
												border: "1px solid rgba(255, 255, 255, 0.1)",
											}}>
											<div className="flex items-center justify-between">
												<div>
													<p className="text-white font-medium">
														Navegador actual
													</p>
													<p className="text-white/60 text-sm">
														Chrome, Windows • Ara mateix
													</p>
												</div>
												<Badge className="bg-green-400/20 text-green-400 border-green-400/30">
													Activa
												</Badge>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
