"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import EditFieldDialog from "@/components/EditFieldDialog";
import UpcomingBookingsList from "@/components/lessons/UpcomingBookingsList";
import { Mail, Phone } from "lucide-react";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStats } from "@/hooks/use-user-stats";
import { useToast } from "@/hooks/use-toast";
import StatsHeader from "@/components/dashboard/ui/stats-header";
import StatsGrid from "@/components/dashboard/ui/stats-grid";
import Qualities from "@/components/dashboard/ui/qualities";
import EditableInfoCard from "@/components/dashboard/ui/editable-info-card";

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
		const response = await fetch("/api/user/profile", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ [field]: value }),
		});

		if (!response.ok) throw new Error("Failed to update profile");

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
							"id,name,surname,trend,email,phone,observations,created_at,is_admin"
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

	if (!user || !userProfile) return null;

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
		<div className="space-y-4 md:space-y-8 h-full ">
			{/* Welcome Header */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 md:gap-4">
				<div className="space-y-1 md:space-y-2">
					<h1 className="text-xl md:text-4xl font-bold tracking-tight text-white">
						Hola, {userProfile.name}! 👋
					</h1>
					<p className="text-white/70 text-sm md:text-lg">
						Benvingut al teu tauler de control de Padel Segrià
					</p>
				</div>
			</div>

			{/* First Section */}
			<div className="space-y-4 md:space-y-6">
				<StatsHeader userProfile={userProfile} userScore={userScore} />
				<StatsGrid
					matchesWon={matchesWon}
					matchesPlayed={matchesPlayed}
					winPercentage={winPercentage}
				/>
				<Qualities userQualities={userQualities} />

				{/* Contact Information */}
				<div className="space-y-4">
					<h4 className="text-white font-medium">Informació de Contacte</h4>
					<div className="grid gap-4 md:grid-cols-2">
						<EditableInfoCard
							label="Correu electrònic"
							value={userProfile.email}
							icon={<Mail className="w-5 h-5 text-blue-400" />}
							onEdit={() => setEmailDialogOpen(true)}
							iconBgClass="bg-blue-500/20 border-blue-400/30"
							ariaLabel="Editar correu electrònic"
						/>

						<EditableInfoCard
							label="Telèfon"
							value={userProfile.phone || "—"}
							icon={<Phone className="w-5 h-5 text-green-400" />}
							onEdit={() => setPhoneDialogOpen(true)}
							iconBgClass="bg-green-500/20 border-green-400/30"
							ariaLabel="Editar telèfon"
						/>
					</div>
				</div>

				{/* Observations */}
				{userProfile.observations && (
					<Card className="border-0 bg-white/5 ring-1 ring-white/15 rounded-xl">
						<CardContent className="p-4 text-white/80">
							{userProfile.observations}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Bookings section */}
			<div className="space-y-2 md:space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-lg md:text-xl font-semibold text-white">
						Les meves reserves
					</h2>
					<Link href="/dashboard/lessons" className="shrink-0">
						<Button className="bg-padel-primary text-black hover:opacity-90">
							Reserva la teva propera classe
						</Button>
					</Link>
				</div>
				<UpcomingBookingsList />
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
