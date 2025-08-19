import React from 'react';
import { Crown } from "lucide-react";
import { PlayerSlot } from './PlayerSlot';
import type { PadelCourtProps } from './types';

export function PadelCourt({
	players,
	onPlayerChange,
	winnerPair,
	onWinnerChange,
	disabled = false,
}: PadelCourtProps) {
	const playerCount = players.filter((p) => p !== null).length;

	return (
		<div className="relative w-full top-4">
			{/* MOBILE VERSION (default) */}
			<div className="md:hidden">
				{/* Court container with fixed aspect ratio for responsiveness */}
				<div className="relative w-full max-w-sm sm:max-w-md aspect-[4/3] bg-green-900/20 border-2 border-white/30 rounded-lg overflow-hidden">
					{/* Center lines */}
					<div className="absolute inset-0">
						{/* Net - vertical */}
						<div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/70 -translate-x-1/2" />
						{/* Service line - horizontal */}
						<div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/30 -translate-y-1/2" />
					</div>

					{/* Grid with 2x2 slots filling the court */}
					<div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 p-2 sm:p-3">
						{players.map((player, index) => {
							const position = index + 1;
							const isPair1 = position === 1 || position === 3;
							const isPair2 = position === 2 || position === 4;
							const isWinningPair =
								(isPair1 && winnerPair === 1) || (isPair2 && winnerPair === 2);
							return (
								<PlayerSlot
									key={index}
									player={player}
									position={position}
									isWinningPair={isWinningPair}
									playerCount={playerCount}
									disabled={disabled}
									onPlayerChange={onPlayerChange}
								/>
							);
						})}
					</div>
				</div>

				{/* Winner crowns (mobile positions) */}
				{!disabled && (
					<>
						<button
							type="button"
							aria-label="Marcar parella 1 com a guanyadora"
							className={`absolute -top-7 sm:-top-8 left-[25%] -translate-x-1/2 cursor-pointer transition-all duration-200 ${
								winnerPair === 1
									? "text-padel-primary scale-110"
									: "text-white/40 hover:text-white/70"
							}`}
							onClick={() => onWinnerChange(winnerPair === 1 ? null : 1)}
						>
							<Crown className="w-6 h-6 sm:w-7 sm:h-7" />
						</button>
						<button
							type="button"
							aria-label="Marcar parella 2 com a guanyadora"
							className={`absolute -top-7 sm:-top-8 left-[75%] -translate-x-1/2 cursor-pointer transition-all duration-200 ${
								winnerPair === 2
									? "text-padel-primary scale-110"
									: "text-white/40 hover:text-white/70"
							}`}
							onClick={() => onWinnerChange(winnerPair === 2 ? null : 2)}
						>
							<Crown className="w-6 h-6 sm:w-7 sm:h-7" />
						</button>
					</>
				)}

				{/* Labels */}
				<div className="flex justify-between mt-2 sm:mt-4 text-xs sm:text-sm text-white/60 max-w-sm sm:max-w-md">
					<span>
						Parella 1 {playerCount < 4 && playerCount > 0 ? "(pos. 1,3)" : ""}
					</span>
					<span>
						Parella 2 {playerCount < 4 && playerCount > 0 ? "(pos. 2,4)" : ""}
					</span>
				</div>
			</div>

			{/* DESKTOP VERSION (>= md) — improved layout with bigger court and better positioning */}
			<div className="hidden md:block">
				{/* Court - increased size for better desktop experience */}
				<div className="w-[480px] h-[360px] mx-auto bg-green-900/20 border-2 border-white/30 rounded-lg relative">
					{/* Net - Vertical line (thick) representing the net */}
					<div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/70 transform -translate-x-0.5"></div>

					{/* Service lines - Horizontal lines (thinner) */}
					<div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 transform -translate-y-0.5"></div>

					{/* Player positions - better spacing and centering */}
					{players.map((player, index) => {
						const positions = [
							"top-4 left-4 w-36 h-32 flex items-center justify-center",
							"top-4 right-4 w-36 h-32 flex items-center justify-center",
							"bottom-4 left-4 w-36 h-32 flex items-center justify-center", 
							"bottom-4 right-4 w-36 h-32 flex items-center justify-center",
						];
						const position = index + 1;
						const isPair1 = position === 1 || position === 3;
						const isPair2 = position === 2 || position === 4;
						const isWinningPair =
							(isPair1 && winnerPair === 1) || (isPair2 && winnerPair === 2);

						return (
							<div key={index} className={`absolute ${positions[index]}`}>
								<PlayerSlot
									player={player}
									position={position}
									isWinningPair={isWinningPair}
									playerCount={playerCount}
									disabled={disabled}
									onPlayerChange={onPlayerChange}
								/>
							</div>
						);
					})}
				</div>

				{/* Winner crowns - adjusted for larger court */}
				{!disabled && (
					<>
						{/* Pair 1 crown (left side) */}
						<div
							className={`absolute -top-10 left-32 cursor-pointer transition-all duration-200 ${
								winnerPair === 1
									? "text-padel-primary scale-110"
									: "text-white/30 hover:text-white/60"
							}`}
							onClick={() => onWinnerChange(winnerPair === 1 ? null : 1)}>
							<Crown className="w-7 h-7" />
						</div>

						{/* Pair 2 crown (right side) */}
						<div
							className={`absolute -top-10 right-32 cursor-pointer transition-all duration-200 ${
								winnerPair === 2
									? "text-padel-primary scale-110"
									: "text-white/30 hover:text-white/60"
							}`}
							onClick={() => onWinnerChange(winnerPair === 2 ? null : 2)}>
							<Crown className="w-7 h-7" />
						</div>
					</>
				)}

				{/* Labels */}
				<div className="flex justify-between mt-4 text-sm text-white/60 w-[480px] mx-auto">
					<span>
						Parella 1 {playerCount < 4 && playerCount > 0 ? "(pos. 1,3)" : ""}
					</span>
					<span>
						Parella 2 {playerCount < 4 && playerCount > 0 ? "(pos. 2,4)" : ""}
					</span>
				</div>
			</div>
		</div>
	);
}