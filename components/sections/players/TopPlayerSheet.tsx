"use client";

import { useEffect, useRef } from "react";
import { X, Trophy, Star, Crown } from "lucide-react";
import Image from "next/image";
import type { TopPlayer } from "@/hooks/use-top-players";

interface TopPlayerSheetProps {
	player: TopPlayer | null;
	onClose: () => void;
	open: boolean;
}

// Util simple para atrapar foco dentro del sheet
function useFocusTrap(
	enabled: boolean,
	containerRef: React.RefObject<HTMLDivElement>,
	onClose: () => void
) {
	useEffect(() => {
		if (!enabled || !containerRef.current) return;
		const container = containerRef.current;
		const focusable = container.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if (focusable.length) {
			focusable[0].focus();
		}

		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				e.preventDefault();
				(container as any).dataset.closing = "true";
				setTimeout(() => onClose(), 150);
			} else if (e.key === "Tab") {
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [enabled, containerRef]);
}

export function TopPlayerSheet({ player, onClose, open }: TopPlayerSheetProps) {
	const ref = useRef<HTMLDivElement>(null);
	useFocusTrap(open, ref, onClose);

	// Cerrar al click fuera
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onClose();
			}
		}
		if (open) document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open, onClose]);

	if (!open || !player) return null;

	const fullName = `${player.name || ""} ${player.surname || ""}`.trim();
	const initials = `${player.name?.[0] || ""}${
		player.surname?.[0] || ""
	}`.toUpperCase();

	return (
		<div
			aria-label="Detall jugador"
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-[9998] flex flex-col justify-end">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
				onClick={onClose}
			/>
			<div
				ref={ref}
				className="relative w-full max-h-[75vh] h-[75vh] bg-gradient-to-b from-[#0a1822] to-black rounded-t-3xl p-6 overflow-y-auto animate-in slide-in-from-bottom duration-300 focus:outline-none">
				<div className="flex items-start justify-between mb-4">
					<h3 className="text-xl font-bold text-white flex items-center gap-2">
						{player.rank === 1 ? (
							<Crown className="w-5 h-5 text-yellow-400" />
						) : (
							<Trophy className="w-5 h-5 text-padel-primary" />
						)}
						#{player.rank} {fullName}
					</h3>
					<button
						aria-label="Cerrar"
						onClick={onClose}
						className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
						<X className="w-5 h-5 text-white" />
					</button>
				</div>

				<div className="flex items-center gap-4 mb-6">
					<div className="relative w-20 h-20 flex-shrink-0">
						{player.avatar_url ? (
							<Image
								src={player.avatar_url}
								alt={fullName}
								fill
								sizes="80px"
								className="object-cover rounded-2xl border border-white/10"
							/>
						) : (
							<div className="w-20 h-20 rounded-2xl bg-padel-primary/30 text-padel-primary flex items-center justify-center text-2xl font-bold">
								{initials}
							</div>
						)}
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-2 text-padel-primary">
							<Star className="w-4 h-4" />
							<span className="text-2xl font-extrabold leading-none">
								{player.score}
							</span>
							<span className="text-xs text-gray-400 uppercase tracking-wide">
								punts
							</span>
						</div>
						<p className="text-sm text-gray-400 mt-1">
							Posició actual #{player.rank}
						</p>
					</div>
				</div>

				<div className="mb-6">
					<h4 className="text-sm font-semibold text-gray-300 mb-3 tracking-wide uppercase">
						Qualitats destacades
					</h4>
					{player.qualities.length ? (
						<ul className="grid grid-cols-3 gap-3" role="list">
							{player.qualities.slice(0, 3).map((q) => (
								<li
									key={q.id}
									className="px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white flex items-center justify-center gap-1 font-medium">
									<span className="inline-block w-2 h-2 rounded-full bg-padel-primary" />{" "}
									{q.name}
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-gray-500">
							No hi ha qualitats assignades
						</p>
					)}
				</div>

				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 py-3 rounded-xl bg-padel-primary text-padel-secondary font-semibold text-sm tracking-wide hover:bg-padel-primary/90 transition-colors">
						Tancar
					</button>
					<a
						href="#rankings"
						onClick={onClose}
						className="flex-1 py-3 rounded-xl bg-white/10 text-white text-center font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/20 transition-colors">
						Veure tots
					</a>
				</div>
			</div>
		</div>
	);
}
