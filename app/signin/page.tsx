"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { Provider } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import config from "@/config";
import AnimatedDottedBackground from "@/components/AnimatedDottedBackground";

// This a login/signup page for Supabase Auth.
// Successful login redirects to /api/auth/callback where the Code Exchange is processed
export default function Login() {
	const supabase = createClient();
	const [email, setEmail] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isDisabled, setIsDisabled] = useState<boolean>(false);

	const handleSignup = async (
		e: any,
		options: {
			type: string;
			provider?: Provider;
		}
	) => {
		e?.preventDefault();

		setIsLoading(true);

		try {
			const { type, provider } = options;
			const redirectURL = window.location.origin + "/api/auth/callback";

			if (type === "oauth") {
				await supabase.auth.signInWithOAuth({
					provider,
					options: {
						redirectTo: redirectURL,
					},
				});
			} else if (type === "magic_link") {
				await supabase.auth.signInWithOtp({
					email,
					options: {
						emailRedirectTo: redirectURL,
					},
				});

				toast.success("Revisa el teu correu electrònic!");

				setIsDisabled(true);
			}
		} catch (error) {
			console.log(error);
			toast.error("Hi ha hagut un error. Torna-ho a provar.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden">
			{/* Animated background */}
			<AnimatedDottedBackground />

			{/* Decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-96 h-96 bg-[#c3fb12]/10 rounded-full blur-3xl" />
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#c3fb12]/20 rounded-full blur-2xl" />
			</div>

			<div className="container px-4 py-16 relative z-10">
				<div className="max-w-md mx-auto">
					{/* Back to home */}
					<div className="mb-6">
						<Link
							href="/"
							className="inline-flex items-center gap-2 text-white/70 hover:text-[#c3fb12] transition-colors group">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
								<path
									fillRule="evenodd"
									d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
									clipRule="evenodd"
								/>
							</svg>
							Torna a l'inici
						</Link>
					</div>

					{/* Logo */}
					<div className="flex justify-center mb-6">
						<div className="relative">
							<div className="absolute inset-0 bg-[#c3fb12]/30 rounded-full blur-md" />
							<Image
								src="/logo_yellow.png"
								alt={config.appName}
								width={80}
								height={80}
								className="relative"
							/>
						</div>
					</div>

					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">
							Àrea Personal
						</h1>
						<p className="text-white/60">
							Accedeix al teu compte per gestionar les teves reserves i
							participar en tornejos
						</p>
					</div>

					{/* Login card */}
					<div
						className="rounded-2xl p-6 md:p-8"
						style={{
							background: "rgba(255, 255, 255, 0.05)",
							backdropFilter: "blur(10px)",
							border: "1px solid rgba(255, 255, 255, 0.1)",
							boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)",
						}}>
						{/* Social login */}
						<button
							className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all mb-6 font-medium"
							style={{
								background: "rgba(255, 255, 255, 0.1)",
								border: "1px solid rgba(255, 255, 255, 0.2)",
							}}
							onClick={(e) =>
								handleSignup(e, { type: "oauth", provider: "google" })
							}
							disabled={isLoading}>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="w-5 h-5"
									viewBox="0 0 48 48">
									<path
										fill="#FFC107"
										d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
									/>
									<path
										fill="#FF3D00"
										d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
									/>
									<path
										fill="#4CAF50"
										d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
									/>
									<path
										fill="#1976D2"
										d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
									/>
								</svg>
							)}
							<span className="text-white">Accedeix amb Google</span>
						</button>

						{/* Divider */}
						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-white/10" />
							</div>
							<div className="relative flex justify-center">
								<span className="px-4 text-xs text-white/40 bg-black/30 backdrop-blur-sm">
									O CONTINUA AMB
								</span>
							</div>
						</div>

						{/* Magic link form */}
						<form
							className="space-y-4"
							onSubmit={(e) => handleSignup(e, { type: "magic_link" })}>
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-white/70 mb-2">
									Correu electrònic
								</label>
								<input
									id="email"
									required
									type="email"
									value={email}
									autoComplete="email"
									placeholder="exemple@correu.com"
									className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c3fb12]/50"
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>

							<button
								className="w-full py-3 px-4 rounded-xl font-bold text-black transition-all transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
								style={{
									background: "#c3fb12",
									boxShadow: "0 8px 20px rgba(195, 251, 18, 0.3)",
								}}
								disabled={isLoading || isDisabled}
								type="submit">
								{isLoading ? (
									<div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
								) : isDisabled ? (
									"Enllaç enviat!"
								) : (
									"Envia'm un enllaç màgic"
								)}
							</button>
						</form>

						{/* Help text */}
						<p className="mt-6 text-xs text-center text-white/40">
							Rebràs un correu amb un enllaç d'accés. <br />
							No es requereix contrasenya.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
