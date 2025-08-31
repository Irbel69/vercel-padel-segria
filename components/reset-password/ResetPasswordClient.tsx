"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";

export default function ResetPasswordClient() {
	const supabase = createClient();
	const searchParams = useSearchParams();
	const router = useRouter();

	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [ok, setOk] = useState(false);

	useEffect(() => {
		const type = searchParams?.get("type");
		(async () => {
			try {
				const hash = typeof window !== "undefined" ? window.location.hash : "";
				if (hash && hash.startsWith("#")) {
					const params = new URLSearchParams(hash.substring(1));
					const access_token = params.get("access_token");
					const refresh_token = params.get("refresh_token");
					if (access_token) {
						const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
						if (setErr) console.debug("setSession error:", setErr.message || setErr);
						else setOk(true);
					}
				}
			} catch (err) {
				console.debug("parse fragment/setSession failed", err);
			}
		})();
		if (type === "recovery") setOk(true);
		else setOk(true);
	}, [searchParams]);

	const handleSubmit = async (e: any) => {
		e?.preventDefault();
		if (!password || password.length < 6) {
			toast.error("La contrasenya ha de tenir almenys 6 car\u00e0cters.");
			return;
		}

		if (password !== passwordConfirm) {
			toast.error("Les contrasenyes no coincideixen.");
			return;
		}

		setLoading(true);
		try {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) {
				console.error(error);
				toast.error("No s'ha pogut actualitzar la contrasenya. Torna-ho a provar.");
			} else {
				toast.success("Contrasenya actualitzada. Ja pots iniciar sessi\u00f3.");
				setTimeout(() => router.push("/signin"), 900);
			}
		} catch (err) {
			console.error(err);
			toast.error("No s'ha pogut actualitzar la contrasenya. Torna-ho a provar.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="h-screen flex items-center justify-center">
			<div className="max-w-md w-full p-6 rounded-xl bg-white/5 backdrop-blur-md">
				<h1 className="text-2xl font-bold mb-4 text-white">Restablir contrasenya</h1>
				<p className="text-sm text-white/70 mb-4">Introdueix la nova contrasenya (m\u00ednim 6 car\u00e0cters)</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm text-white/70 mb-2">Nova contrasenya</label>
						<input
							type="password"
							className="w-full py-2 px-3 rounded-md bg-white/5 border border-white/10 text-white"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							minLength={6}
							required
						/>
					</div>

					<div>
						<label className="block text-sm text-white/70 mb-2">Repeteix la contrasenya</label>
						<input
							type="password"
							className="w-full py-2 px-3 rounded-md bg-white/5 border border-white/10 text-white"
							value={passwordConfirm}
							onChange={(e) => setPasswordConfirm(e.target.value)}
							minLength={6}
							required
						/>
						{passwordConfirm && password !== passwordConfirm ? (
							<p className="text-xs text-rose-400 mt-1">Les contrasenyes no coincideixen.</p>
						) : null}
					</div>

					<div>
						<button
							type="submit"
							disabled={loading || password !== passwordConfirm}
							className="w-full py-2 px-3 rounded-md bg-[#c3fb12] text-black font-bold">
							{loading ? "Actualitzant..." : "Actualitzar contrasenya"}
						</button>
					</div>
				</form>

				<p className="text-xs text-white/60 mt-4">Si el link no funciona, torna a sol\u00b7licitar el restabliment des del formulari d&apos;inici de sessi\u00f3.</p>
			</div>
		</main>
	);
}
