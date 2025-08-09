"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import config from "@/config";

export default function CompleteProfile() {
	const [name, setName] = useState("");
	const [surname, setSurname] = useState("");
	const [phone, setPhone] = useState("+34 ");
	const [observations, setObservations] = useState("");
	const [imageRightsAccepted, setImageRightsAccepted] = useState(false);
	const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		const checkAuth = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				router.push("/signin");
				return;
			}

			// Check if user already has a profile
			try {
				const response = await fetch("/api/auth/profile");
				const data = await response.json();

				if (data.user?.profile?.name && data.user?.profile?.surname) {
					// User already has complete profile, redirect to dashboard
					router.push("/dashboard");
					return;
				}

				// Pre-fill existing data if partial profile exists
				if (data.user?.profile) {
					const profile = data.user.profile;
					if (profile.name) setName(profile.name);
					if (profile.surname) setSurname(profile.surname);
					if (profile.phone) setPhone(profile.phone);
					if (profile.observations) setObservations(profile.observations);
					setImageRightsAccepted(profile.image_rights_accepted || false);
					setPrivacyPolicyAccepted(profile.privacy_policy_accepted || false);
				}
			} catch (error) {
				console.error("Error checking profile:", error);
			}

			setIsCheckingAuth(false);
		};

		checkAuth();
	}, [router, supabase.auth]);

	// Format phone number as user types
	const formatPhoneNumber = (value: string) => {
		// Remove all non-digits except +
		const cleaned = value.replace(/[^\d+]/g, "");

		// Ensure it starts with +34
		if (!cleaned.startsWith("+34")) {
			return "+34 ";
		}

		// Extract the number part after +34
		const numberPart = cleaned.slice(3);

		// Format as +34 XXX XXX XXX
		if (numberPart.length <= 3) {
			return `+34 ${numberPart}`;
		} else if (numberPart.length <= 6) {
			return `+34 ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
		} else {
			return `+34 ${numberPart.slice(0, 3)} ${numberPart.slice(
				3,
				6
			)} ${numberPart.slice(6, 9)}`;
		}
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatPhoneNumber(e.target.value);
		setPhone(formatted);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim() || !surname.trim()) {
			toast.error("Si us plau, omple el nom i cognoms");
			return;
		}

		if (!imageRightsAccepted || !privacyPolicyAccepted) {
			toast.error(
				"Has d'acceptar les condicions d'ús i autorització de drets d'imatge"
			);
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/complete-profile", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: name.trim(),
					surname: surname.trim(),
					phone: phone.trim() === "+34 " ? null : phone.trim(),
					observations: observations.trim() || null,
					imageRightsAccepted,
					privacyPolicyAccepted,
				}),
			});
			const data = await response.json();

			if (response.ok) {
				toast.success("Perfil completat correctament!");
				router.push("/dashboard");
			} else {
				toast.error(data.error || "Error completant el perfil");
			}
		} catch (error) {
			console.error("Error completing profile:", error);
			toast.error("Error de connexió. Torna-ho a provar.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isCheckingAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-[#c3fb12] border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<Image
							src="/logo_yellow.png"
							alt={config.appName}
							width={60}
							height={60}
						/>
					</div>
					<CardTitle className="text-2xl">Completa el teu perfil</CardTitle>
					<CardDescription>
						Per continuar, necessitem que omplis aquesta informació bàsica
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nom</Label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="El teu nom"
								required
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="surname">Cognoms</Label>
							<Input
								id="surname"
								type="text"
								value={surname}
								onChange={(e) => setSurname(e.target.value)}
								placeholder="Els teus cognoms"
								required
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Número de telèfon</Label>
							<Input
								id="phone"
								type="tel"
								value={phone}
								onChange={handlePhoneChange}
								placeholder="+34 XXX XXX XXX"
								disabled={isLoading}
							/>
							<p className="text-xs text-muted-foreground">
								Format: +34 XXX XXX XXX (opcional)
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="observations">Observacions</Label>
							<Textarea
								id="observations"
								value={observations}
								onChange={(e) => setObservations(e.target.value)}
								placeholder="Observacions, al·lèrgies, necessitats especials, etc. (opcional)"
								disabled={isLoading}
								rows={3}
							/>
						</div>

						<div className="space-y-4 pt-4">
							<div className="flex items-start space-x-2">
								<Checkbox
									id="imageRights"
									checked={imageRightsAccepted}
									onCheckedChange={(checked) =>
										setImageRightsAccepted(!!checked)
									}
									disabled={isLoading}
								/>
								<Label
									htmlFor="imageRights"
									className="text-sm leading-relaxed">
									<span className="font-medium">
										Autorització del dret d&apos;imatge:
									</span>{" "}
									Que la imatge del meu fill o filla, en cas de l&apos;escola de
									nens/es, i la meva, en cas de l&apos;escola d&apos;adults,
									pugui aparèixer en fotografies i vídeos corresponents a
									activitats organitzades per Dakirol i publicades en la pàgina
									web i xarxes socials de l&apos;empresa.
								</Label>
							</div>

							<div className="flex items-start space-x-2">
								<Checkbox
									id="privacyPolicy"
									checked={privacyPolicyAccepted}
									onCheckedChange={(checked) =>
										setPrivacyPolicyAccepted(!!checked)
									}
									disabled={isLoading}
								/>
								<Label htmlFor="privacyPolicy" className="text-sm">
									Accepto les{" "}
									<a
										href="/privacy"
										target="_blank"
										className="text-[#c3fb12] hover:underline">
										polítiques d&apos;ús i privacitat
									</a>
								</Label>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={isLoading}
							style={{
								backgroundColor: "#c3fb12",
								color: "black",
							}}>
							{isLoading ? (
								<div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
							) : null}
							{isLoading ? "Guardant..." : "Completar perfil"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
