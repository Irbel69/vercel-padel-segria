"use client";

import { useRef, useEffect, useMemo } from "react";
import { BattlePassPrizeProgress } from "../hooks/use-battle-pass-progress";
import { PrizeNode } from "./PrizeNode";
import { ProgressIndicator } from "./ProgressIndicator";

interface BattlePassTrackProps {
	prizes: BattlePassPrizeProgress[];
	userPoints: number;
	isLoading?: boolean;
}

export function BattlePassTrack({ prizes, userPoints, isLoading = false }: BattlePassTrackProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const hasScrolledRef = useRef(false);

	// Build equal-spacing mapping so prizes never overlap while preserving relative progress within segments
	const equalSpacing = useMemo(() => {
		if (prizes.length === 0) {
			return { toPercent: (_x: number) => 0, markerPercents: [] as number[] };
		}
		const sorted = [...prizes].sort((a, b) => a.points_required - b.points_required);
		const P = sorted.map(p => p.points_required);
		const n = P.length;
		const segment = n > 1 ? 1 / (n - 1) : 1;
		const rankById = new Map<number, number>();
		sorted.forEach((p, i) => rankById.set(p.id, i));
		const markerPercents = prizes.map(p => {
			const i = rankById.get(p.id) ?? 0;
			return (i * segment) * 100;
		});
		const toPercent = (x: number) => {
			if (n === 1) return 100;
			if (x <= P[0]) return 0;
			if (x >= P[n - 1]) return 100;
			let i = 0;
			for (; i < n - 1; i++) {
				if (x <= P[i + 1]) break;
			}
			const a = P[i];
			const b = P[i + 1];
			const localT = b === a ? (x >= b ? 1 : 0) : (x - a) / (b - a);
			const pos = i * segment + localT * segment;
			return pos * 100;
		};
		return { toPercent, markerPercents };
	}, [prizes]);

	// Auto-scroll to user's current progress position
	useEffect(() => {
		if (!trackRef.current || hasScrolledRef.current || isLoading || prizes.length === 0) {
			return;
		}

		// Find the first prize the user cannot claim (their next target)
		const nextPrizeIndex = prizes.findIndex(prize => !prize.can_claim);
		const scrollToIndex = nextPrizeIndex === -1 ? prizes.length - 1 : Math.max(0, nextPrizeIndex - 1);

		// Scroll to position after a brief delay to ensure DOM is ready
		const timer = setTimeout(() => {
			const container = trackRef.current!;
			// Query the individual prize nodes rendered in the scrolling area
			const items = container.querySelectorAll('[data-prize-node]');
			const prizeElement = items[scrollToIndex] as HTMLElement | undefined;
			if (prizeElement) {
				const containerWidth = container.clientWidth;
				// Use visual rects so CSS transforms (translateX(-50%)) are accounted for
				const elRect = prizeElement.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				const elementCenter = elRect.left + elRect.width / 2;
				const containerCenter = containerRect.left + containerWidth / 2;
				const delta = elementCenter - containerCenter;
				const target = container.scrollLeft + delta;

				container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
				hasScrolledRef.current = true;
			}
		}, 300);

		return () => clearTimeout(timer as unknown as number);
	}, [prizes, userPoints, isLoading]);

	return (
		<div className="w-full relative">
			{/* Track container */}
			<div 
				ref={trackRef}
				role="region"
				aria-label="Pista de recompenses del Battle Pass"
				aria-describedby="battlepass-scroll-instructions"
				tabIndex={0}
				className="relative overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain snap-x snap-mandatory focus:outline-none focus-visible:ring-2 focus-visible:ring-padel-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-xl"
				style={{
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
				}}
				onKeyDown={(e) => {
					const el = trackRef.current;
					if (!el) return;
					const delta = 240;
					if (e.key === 'ArrowRight') {
						el.scrollBy({ left: delta, behavior: 'smooth' });
						e.preventDefault();
					}
					if (e.key === 'ArrowLeft') {
						el.scrollBy({ left: -delta, behavior: 'smooth' });
						e.preventDefault();
					}
					if (e.key === 'Home') {
						el.scrollTo({ left: 0, behavior: 'smooth' });
						e.preventDefault();
					}
					if (e.key === 'End') {
						el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
						e.preventDefault();
					}
				}}
			>
				{/* We render a wide relative area so nodes can be absolutely placed along a single track. min-w-full keeps it at least viewport width but allows scrolling if content overflows */}
				{/* Ensure horizontal padding equals half the card width so centered cards never get clipped */}
				<div className="relative w-full min-w-[960px] pl-[112px] pr-[112px] py-6 md:pl-[128px] md:pr-[128px] md:py-8">
					{/* Full-width progress indicator using equal spacing mapping to align with cards */}
					<ProgressIndicator prizes={prizes} userPoints={userPoints} useEqualSpacing />
					
					{/* Prize nodes positioned absolutely along the same coordinate space as the progress indicator */}
					{/* allow vertical overflow so claim buttons and badges are visible on small screens */}
					<div className="relative h-[200px] md:h-[240px] overflow-visible">
						{prizes.map((prize, index) => {
							// Use equal-spacing mapping percent for this prize
							const leftPercent = equalSpacing.markerPercents[index] ?? 0;
							return (
								<div
									key={prize.id}
									data-prize-node
									style={{ left: `${leftPercent}%`, transform: "translateX(-50%)" }}
									className="absolute top-0 w-56 md:w-64 overflow-visible"
								>
									<PrizeNode
										prize={prize}
										index={index}
										totalPrizes={prizes.length}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* SR-only scrolling instructions */}
			<p id="battlepass-scroll-instructions" className="sr-only">Utilitza les tecles fletxa esquerra i dreta o fes swipe per navegar pels premis del Battle Pass.</p>
			
			{/* Bottom gradient fade */}
			<div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
		</div>
	);
}
