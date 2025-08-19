import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X } from "lucide-react";
import type { PlayerSlotProps } from './types';

export function PlayerSlot({
	player,
	position,
	isWinningPair,
	playerCount,
	disabled = false,
	onPlayerChange,
}: PlayerSlotProps) {
	const handleClick = () => {
		if (!disabled) {
			if (player) {
				// Remove player
				onPlayerChange(position, null);
			} else {
				// Add player - pass a dummy player to trigger selector
				onPlayerChange(position, {
					id: "",
					name: "",
					surname: "",
					avatar_url: null,
				});
			}
		}
	};

	return (
		<div
			className={`w-full h-full min-h-20 sm:min-h-24 md:w-32 md:h-32 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-xs relative px-2 py-2 sm:px-2.5 sm:py-2.5 md:px-3 md:py-3 gap-1 ${
				player
					? isWinningPair
						? "bg-padel-primary/40 border-padel-primary text-white"
						: "bg-white/10 border-white/30 text-white"
					: "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
			} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
			onClick={handleClick}>
			{player ? (
				<>
					<Avatar className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
						<AvatarImage src={player.avatar_url || ""} />
						<AvatarFallback className="text-xs md:text-sm text-white">
							{((player.name || "")[0] || "") +
								((player.surname || "")[0] || "")}
						</AvatarFallback>
					</Avatar>
					<span className="text-[11px] sm:text-[12px] md:text-sm text-center mt-1 leading-snug px-1 text-white line-clamp-2">
						{player.name} {player.surname}
					</span>
					{!disabled && (
						<button
							aria-label="Eliminar jugador"
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onPlayerChange(position, null);
							}}
							className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400/60"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</>
			) : (
				<>
					<Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white/40" />
					<span className="text-white/40 md:text-sm">
						{playerCount === 0 ? "Jugador" : "Opcional"}
					</span>
				</>
			)}
		</div>
	);
}