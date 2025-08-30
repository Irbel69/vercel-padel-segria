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
import { Stepper } from "@/components/complete-profile/ui/stepper";
import { PhoneInput } from "@/components/complete-profile/ui/phone-input";
import useStepper from "@/components/complete-profile/hooks/use-stepper";
import CompleteProfileHeader from "@/components/complete-profile/header";
import { motion, AnimatePresence } from "framer-motion";

export default function CompleteProfile() {
	const [name, setName] = useState("");
	const [surname, setSurname] = useState("");
	const [phone, setPhone] = useState("");
	const [observations, setObservations] = useState("");
	const [imageRightsAccepted, setImageRightsAccepted] = useState(false);
	const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const router = useRouter();
	const supabase = createClient();
	const steps = ["Dades bàsiques", "Contacte", "Polítiques"];
	const { current, next, prev } = useStepper(steps.length);

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

	const phoneRef = React.useRef<any>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// lightweight client validation
		if (!name.trim() || !surname.trim()) {
			toast.error("Si us plau, omple el nom i cognoms");
			return;
		}

			// Validate phone on final submit. If invalid, PhoneInput will show an
			// inline error; focus the field and abort submission instead of
			// showing a toast.
		if (phoneRef.current && !phoneRef.current.validate()) {
			phoneRef.current?.focus?.();
			return
		}
			// Only privacy policy acceptance is required. Image rights are optional.
			if (!privacyPolicyAccepted) {
				toast.error("Has d'acceptar les polítiques d'ús i privacitat");
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
							// Normalize phone: remove common separators so server receives a compact E.164-like string (eg. +34123456789)
							phone:
								phone && phone.trim() !== ""
									? String(phone).trim().replace(/[\s\-()\.]/g, "")
									: null,
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
				<div className="w-8 h-8 border-4 border-[var(--padel-primary)] border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[var(--padel-primary)]/5 rounded-full blur-3xl" />
				<div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[var(--padel-primary)]/3 rounded-full blur-3xl" style={{ animationDelay: "2s" }} />
			</div>

			<Card className="w-full max-w-lg relative z-10 bg-white/5 backdrop-blur-xl shadow-2xl border-transparent">
				<CardHeader className="text-center space-y-4 pb-6">
					<CompleteProfileHeader title="Completa el teu perfil" subtitle={"Només 3 passos. Trigaràs menys d'1 minut."} />
					<Stepper steps={steps} current={current} className="mt-6" />
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="form-title">
						<AnimatePresence mode="wait">
							{current === 0 && (
								<motion.div
									key="step-1"
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -12 }}
									transition={{ duration: 0.25, ease: "easeOut" }}
									className="space-y-6"
								>
									<div className="flex items-center gap-3 mb-4">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--padel-primary)]/10 border border-[var(--padel-primary)]/20">
											<svg className="w-5 h-5 text-[var(--padel-primary)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM4 20c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z" fill="currentColor"/></svg>
										</div>
										<div>
											<h4 className="font-semibold text-lg">Informació personal</h4>
											<p className="text-sm text-muted-foreground">Com et dius?</p>
										</div>
									</div>

									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="name" className="text-sm font-medium">Nom <span className="text-red-600">*</span></Label>
											<div className="gradient-border rounded-lg focus-within:focus-visible-ring">
												<Input
													id="name"
													type="text"
													value={name}
													onChange={(e) => setName(e.target.value)}
													placeholder="El teu nom"
													required
													aria-required="true"
													disabled={isLoading}
													// Force a solid black background so text remains visible
													// regardless of browser/system theme. Use white text for
													// sufficient contrast against the black background.
													className="border-0 bg-black text-white py-3 text-base"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="surname" className="text-sm font-medium">Cognoms <span className="text-red-600">*</span></Label>
											<div className="gradient-border rounded-lg focus-within:focus-visible-ring">
												<Input
													id="surname"
													type="text"
													value={surname}
													onChange={(e) => setSurname(e.target.value)}
													placeholder="Els teus cognoms"
													required
													aria-required="true"
													disabled={isLoading}
													// Force a solid black background so text remains visible
													// regardless of browser/system theme. Use white text for
													// sufficient contrast against the black background.
													className="border-0 bg-black text-white py-3 text-base"
												/>
											</div>
										</div>
									</div>

									<div className="flex justify-end pt-4">
										<Button
											type="button"
											onClick={next}
											className="bg-[var(--padel-primary)] text-black hover:bg-[var(--padel-primary)]/90 font-semibold px-8 py-3 shadow-lg shadow-[var(--padel-primary)]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[var(--padel-primary)]/30"
											disabled={!name.trim() || !surname.trim()}
										>
											Següent
										</Button>
									</div>
								</motion.div>
							)}

							{current === 1 && (
								<motion.div
									key="step-2"
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -12 }}
									transition={{ duration: 0.25, ease: "easeOut" }}
									className="space-y-6"
								>
									<div className="flex items-center gap-3 mb-4">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--padel-primary)]/10 border border-[var(--padel-primary)]/20">
											<svg className="w-5 h-5 text-[var(--padel-primary)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" fill="currentColor"/></svg>
										</div>
										<div>
											<h4 className="font-semibold text-lg">Informació de contacte</h4>
											<p className="text-sm text-muted-foreground">Com et podem contactar?</p>
										</div>
									</div>

									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="phone" className="text-sm font-medium">Número de telèfon</Label>
											<PhoneInput id="phone" ref={phoneRef} value={phone} onChange={setPhone} disabled={isLoading} />
											<p id="phone-hint" className="text-xs text-muted-foreground">Opcional. Format: +34 600 123 456</p>
										</div>
										<div className="space-y-2">
											<Label htmlFor="observations" className="text-sm font-medium">Observacions</Label>
											<div className="gradient-border rounded-lg">
												<Textarea
													id="observations"
													value={observations}
													onChange={(e) => setObservations(e.target.value)}
													placeholder="Observacions, al·lèrgies, necessitats especials, etc. (opcional)"
													disabled={isLoading}
													rows={4}
													className="border-0 bg-background/80 backdrop-blur-sm resize-none p-3"
												/>
											</div>
										</div>
									</div>

									<div className="flex justify-between pt-4">
										<Button type="button" variant="outline" onClick={prev} className="px-6 py-3 bg-transparent">Enrere</Button>
											<Button
												type="button"
												onClick={() => {
													// Validate phone before advancing to next step
													if (phoneRef.current && !phoneRef.current.validate()) {
														// Let PhoneInput render the inline error and
														// move focus there instead of showing a toast.
														phoneRef.current?.focus?.();
														return
													}
													next()
												}}
												className="bg-[var(--padel-primary)] text-black hover:bg-[var(--padel-primary)]/90 font-semibold px-8 py-3 shadow-lg shadow-[var(--padel-primary)]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[var(--padel-primary)]/30"
											>
												Següent
											</Button>
									</div>
								</motion.div>
							)}

							{current === 2 && (
								<motion.div
									key="step-3"
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -12 }}
									transition={{ duration: 0.25, ease: "easeOut" }}
									className="space-y-6"
								>
									<div className="flex items-center gap-3 mb-4">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--padel-primary)]/10 border border-[var(--padel-primary)]/20">
											<svg className="w-5 h-5 text-[var(--padel-primary)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a7 7 0 00-7 7v3H4l4 6h8l4-6h-1V9a7 7 0 00-7-7z" fill="currentColor"/></svg>
										</div>
										<div>
											<h4 className="font-semibold text-lg">Polítiques i permisos</h4>
											<p className="text-sm text-muted-foreground">Últim pas per finalitzar</p>
										</div>
									</div>

									<div className="space-y-4">
										{/* Image rights — optional: neutral container without yellow gradient */}
										<div className="rounded-lg p-4 bg-background/60 border border-border">
											<div className="flex items-start gap-3">
												<Checkbox
													id="imageRights"
													checked={imageRightsAccepted}
													onCheckedChange={(checked) => setImageRightsAccepted(!!checked)}
													disabled={isLoading}
													className="mt-1"
												/>
												<Label htmlFor="imageRights" className="text-sm leading-relaxed cursor-pointer">
													<span className="font-semibold text-[var(--padel-primary)]">Autorització del dret d&apos;imatge:</span>{" "}
													Que la imatge del meu fill o filla, en cas de l&apos;escola de nens/es, i la meva, en cas de l&apos;escola d&apos;adults, pugui aparèixer en fotografies i vídeos corresponents a activitats organitzades per Dakirol i publicades en la pàgina web i xarxes socials de l&apos;empresa.
												</Label>
											</div>
										</div>

										{/* Privacy policy — required: neutral container and show red asterisk */}
										<div className="rounded-lg p-4 bg-background/60 border border-border">
											<div className="flex items-start gap-3">
												<Checkbox
													id="privacyPolicy"
													checked={privacyPolicyAccepted}
													onCheckedChange={(checked) => setPrivacyPolicyAccepted(!!checked)}
													disabled={isLoading}
													className="mt-1"
												/>
												<Label htmlFor="privacyPolicy" className="text-sm cursor-pointer">
													Accepto les {" "}
													<a href="/privacy" target="_blank" className="text-[var(--padel-primary)] hover:underline font-medium" rel="noreferrer">
														polítiques d&apos;ús i privacitat
													</a>
													<span className="ml-1 text-red-600">*</span>
												</Label>
											</div>
										</div>
									</div>

									<div className="flex justify-between pt-6">
										<Button type="button" variant="outline" onClick={prev} className="px-6 py-3 bg-transparent">Enrere</Button>
											<Button
												type="submit"
												className="bg-[var(--padel-primary)] text-black hover:bg-[var(--padel-primary)]/90 font-bold px-10 py-3 shadow-lg shadow-[var(--padel-primary)]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[var(--padel-primary)]/30 disabled:opacity-50"
												disabled={isLoading || !privacyPolicyAccepted}
											>
											{isLoading ? (
												<>
													<div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
													Guardant...
												</>
											) : (
												<>
													Finalitzar
												</>
											)}
										</Button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
