"use client";

import { Trophy, TrendingUp, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import CountUp from "react-countup";
import { useEffect, useState } from "react";

interface UserPointsDisplayProps {
	userPoints: number;
	totalPrizes?: number;
	completedPrizes?: number;
	className?: string;
	animate?: boolean;
}

export function UserPointsDisplay({ 
	userPoints, 
	totalPrizes = 0, 
	completedPrizes = 0,
	className,
	animate = true,
}: UserPointsDisplayProps) {
	const progressPercentage = totalPrizes > 0 ? (completedPrizes / totalPrizes) * 100 : 0;

	// Local mounted flag to kick off CSS transition when component appears or when progress changes
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// next tick so initial render can apply base width (0) and then transition to target
		const t = setTimeout(() => setMounted(true), 20);
		return () => clearTimeout(t);
	}, []);

	return (
		<div className={cn(
			"bg-gradient-to-r from-gray-900/80 via-gray-800/90 to-gray-900/80",
			"border border-gray-700/50 rounded-2xl p-4 backdrop-blur-sm w-full md:w-1/3 mx-auto",
			className
		)}>
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-padel-primary/20 rounded-lg flex items-center justify-center">
						<Trophy className="w-5 h-5 text-padel-primary" />
					</div>
					<h2 className="font-semibold text-white">El teu progrés</h2>
				</div>
					<Badge className="bg-padel-primary/20 text-padel-primary border-padel-primary/30">
					Battle Pass
				</Badge>
			</div>

			{/* Points display */}
			<div className="space-y-3">
				{/* Current points */}
				<div className="flex items-center justify-between">
					<span className="text-gray-300 text-sm">Punts actuals</span>
						<div className="flex items-center gap-2">
						<div className="flex items-center gap-1 text-padel-primary font-bold">
							<Star className="w-4 h-4" />
							{animate ? (
								<CountUp start={0} end={userPoints} duration={1.8} delay={0.2} key={String(userPoints)} separator="," />
							) : (
								<span>{userPoints.toLocaleString()}</span>
							)}
						</div>
					</div>
				</div>

				{/* Progress stats */}
				{totalPrizes > 0 && (
					<>
						<div className="flex items-center justify-between">
								<span className="text-gray-300 text-sm">Premis desbloquejats</span>
							<span className="text-white font-medium">
								{animate ? (
									<>
										<CountUp start={0} end={completedPrizes} duration={1.2} delay={0.15} key={`completed-${String(completedPrizes)}`} />
										{' '}/ {totalPrizes}
									</>
								) : (
									<>{completedPrizes} / {totalPrizes}</>
								)}
							</span>
						</div>

						{/* Progress bar */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-xs">
								<span className="text-gray-400">Progress</span>
								<span className="text-padel-primary font-medium">
									{animate ? (
										<CountUp start={0} end={Math.round(progressPercentage)} duration={1.2} delay={0.15} suffix="%" key={`progress-${Math.round(progressPercentage)}`} />
									) : (
										<>{Math.round(progressPercentage)}%</>
									)}
								</span>
							</div>
							<div className="w-full bg-gray-700/50 rounded-full h-2">
								<div 
									className={cn(
										"h-2 rounded-full",
										// Use transform scaleX for smoother GPU-accelerated animation and avoid layout thrash
										"origin-left transition-transform duration-1000 ease-out",
										"bg-gradient-to-r from-padel-primary via-yellow-400 to-padel-primary"
									)}
									style={{ transform: `scaleX(${mounted && animate ? progressPercentage / 100 : 0})` }}
								/>
							</div>
						</div>

						{/* Completion status */}
						{progressPercentage === 100 ? (
							<div className="flex items-center gap-2 text-green-400 text-sm mt-2">
								<TrendingUp className="w-4 h-4" />
								Battle Pass complet!
							</div>
						) : (
							<div className="flex items-center gap-2 text-padel-primary text-sm mt-2">
								<TrendingUp className="w-4 h-4" />
								Continua així!
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}