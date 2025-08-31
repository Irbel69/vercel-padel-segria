"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Activity, BarChart3 } from "lucide-react";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

export default function StatsGrid({
	matchesWon,
	matchesPlayed,
	winPercentage,
	className,
}: {
	matchesWon: number;
	matchesPlayed: number;
	winPercentage: number;
	className?: string;
}) {
	const tileClass =
		"text-center p-4 rounded-xl bg-white/5 ring-1 ring-white/15 transition-colors hover:bg-white/[.06]";

	return (
		<div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
			<Card className={tileClass}>
				<CardContent className="p-0">
					<Trophy className="w-7 h-7 text-green-400 mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">
						<CountUp end={matchesWon} duration={2.0} delay={0.3} />
					</div>
					<div className="text-sm text-white/60">Partits Guanyats</div>
				</CardContent>
			</Card>

			<Card className={tileClass}>
				<CardContent className="p-0">
					<Activity className="w-7 h-7 text-blue-400 mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">
						<CountUp end={matchesPlayed} duration={2.0} delay={0.45} />
					</div>
					<div className="text-sm text-white/60">Partits Jugats</div>
				</CardContent>
			</Card>

			<Card className={tileClass}>
				<CardContent className="p-0">
					<BarChart3 className="w-7 h-7 text-purple-400 mx-auto mb-2" />
					<div className="text-2xl font-bold text-white">
						<CountUp
							end={winPercentage}
							duration={2.0}
							delay={0.6}
							suffix="%"
						/>
					</div>
					<div className="text-sm text-white/60">% Victòries</div>
				</CardContent>
			</Card>
		</div>
	);
}
