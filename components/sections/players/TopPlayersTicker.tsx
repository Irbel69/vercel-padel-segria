"use client";
import { useState, useRef, useEffect } from "react";
import { useTopPlayers, TopPlayer } from "@/hooks/use-top-players";
import { Crown, Trophy } from "lucide-react";
import Image from "next/image";
import { TopPlayerSheet } from "./TopPlayerSheet";

interface TopPlayersTickerProps {
	limit?: number; // optional limit (ignored now for 3 focus design, but kept for future)
}

export function TopPlayersTicker({ limit }: TopPlayersTickerProps) {
	const { data, isLoading, error } = useTopPlayers();
	const [selected, setSelected] = useState<TopPlayer | null>(null);
	const [open, setOpen] = useState(false);
	const tickerRef = useRef<HTMLDivElement>(null);

	// Tomamos sólo los primeros 5 para seguridad y luego reconstruimos arreglo de 3 con campeón centrado
	const base = (data?.players || []).slice(0, limit || 5);
	const champion = base.find((p) => p.rank === 1) || base[0];
	const others = base.filter((p) => p.id !== champion.id).slice(0, 2);
	let display: TopPlayer[] = [];
	if (others.length === 2) {
		display = [others[0], champion, others[1]]; // campeón en medio
	} else {
		// fallback: usar lo que haya sin duplicar
		display = base.slice(0, 3);
	}

	function openPlayer(p: TopPlayer) {
		setSelected(p);
		setOpen(true);
	}

	function closeSheet() {
		setOpen(false);
		// pequeña demora para transición antes de limpiar jugador
		setTimeout(() => setSelected(null), 200);
	}

	if (isLoading) {
		return (
			<div
				className="flex gap-3 overflow-hidden animate-pulse"
				aria-label="Carregant jugadors">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0"
					/>
				))}
			</div>
		);
	}

	if (error) {
		return <p className="text-sm text-red-400">Error carregant jugadors</p>;
	}

	return (
		<div className="w-full" aria-label="Top players ticker">
			<div
				ref={tickerRef}
				className="flex items-end justify-center gap-6 py-4 select-none"
				role="list"
				aria-label="Top 3 jugadors">
				{display.map((player) => {
					const fullName = `${player.name || ""}`.trim();
					const initials = `${player.name?.[0] || ""}${
						player.surname?.[0] || ""
					}`.toUpperCase();
					const isChampion = player.rank === 1 || player.isChampion;
					const sizeClasses = isChampion ? "w-24 h-24" : "w-16 h-16";
					const ringClasses = isChampion
						? "ring-4 ring-yellow-400 shadow-[0_0_0_4px_rgba(234,179,8,0.15)]"
						: "ring-2 ring-padel-primary/40";
					const translate = isChampion ? "-translate-y-2" : "translate-y-0";
					return (
						<button
							key={player.id}
							role="listitem"
							onClick={() => openPlayer(player)}
							className={`group relative flex flex-col items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-padel-primary/70 transition-transform ${translate}`}
							aria-label={`Jugador ${fullName} posició ${player.rank}`}>
							<div
								className={`relative ${sizeClasses} rounded-full flex items-center justify-center ${ringClasses} bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-sm overflow-hidden transition-transform group-active:scale-95 ${
									isChampion ? "scale-105" : ""
								}`}>
								{player.avatar_url ? (
									<Image
										src={player.avatar_url}
										alt={fullName}
										fill
										sizes={isChampion ? "96px" : "64px"}
										className="object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
									/>
								) : (
									<span
										className={`font-bold text-padel-primary ${
											isChampion ? "text-lg" : "text-sm"
										}`}>
										{initials}
									</span>
								)}
								{isChampion && (
									<span className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full p-1 shadow-md">
										<Crown className="w-3 h-3" />
									</span>
								)}
							</div>
							<span
								className={`text-[10px] text-white/80 font-medium text-center leading-tight w-full ${
									isChampion ? "mt-1" : ""
								}`}>
								{fullName || "—"}
							</span>
							<span
								className={`text-[10px] font-semibold ${
									isChampion ? "text-yellow-300" : "text-padel-primary/80"
								}`}>
								#{player.rank}
							</span>
						</button>
					);
				})}
			</div>
			<p className="sr-only">Toca un jugador per a més detalls.</p>
			<TopPlayerSheet player={selected} onClose={closeSheet} open={open} />
		</div>
	);
}
