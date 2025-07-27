"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
			} catch (error) {
				console.error("Error checking profile:", error);
			}

			setIsCheckingAuth(false);
		};

		checkAuth();
	}, [router, supabase.auth]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim() || !surname.trim()) {
			toast.error("Si us plau, omple tots els camps");
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
