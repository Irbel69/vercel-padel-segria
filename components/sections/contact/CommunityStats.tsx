"use client";
import React from "react";
import { Users, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
	icon: any;
	label: string;
	value: string;
	progress?: number;
}
interface CommunityStatsProps {
	stats?: StatItem[];
	className?: string;
	compact?: boolean;
	animated?: boolean;
}

const containerStyle: React.CSSProperties = {
	background: "rgba(255, 255, 255, 0.1)",
	borderRadius: "16px",
	boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
	backdropFilter: "blur(5px)",
	WebkitBackdropFilter: "blur(5px)",
	border: "1px solid rgba(255, 255, 255, 0.2)",
};

const defaultStats: StatItem[] = [
	{ icon: Users, label: "Jugadors actius", value: "2,500+", progress: 85 },
	{ icon: Trophy, label: "Tornejos aquest any", value: "45", progress: 75 },
	{ icon: Calendar, label: "Partits jugats", value: "12,000+", progress: 92 },
];

export const CommunityStats: React.FC<CommunityStatsProps> = ({
	stats = defaultStats,
	className,
	compact = false,
	animated = true,
}) => {
	return (
		<div
			className={cn(
				"p-4 md:p-6 text-white rounded-2xl flex-1 relative overflow-hidden",
				animated && "animate-fade-in-up",
				className
			)}
			style={containerStyle}>
			<h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">
				La nostra comunitat
			</h3>
			<div
				className={cn(
					"grid grid-cols-1 md:grid-cols-3",
					compact ? "gap-2 md:gap-3 pt-2" : "gap-3 md:gap-4 pt-3 md:pt-5"
				)}>
				{stats.map((stat, index) => (
					<div
						key={index}
						className={cn(
							"text-center transition-opacity duration-500",
							animated && `delay-[${index * 75}ms]`
						)}>
						<div className="w-12 h-12 md:w-14 md:h-14 bg-padel-primary/20 rounded-xl flex items-center justify-center m-auto mb-2 md:mb-3 relative">
							<stat.icon className="w-6 h-6 md:w-7 md:h-7 text-padel-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
						</div>
						<p className="text-xl md:text-2xl font-bold text-padel-primary mb-1">
							{stat.value}
						</p>
						<p className="text-sm text-gray-300">{stat.label}</p>
					</div>
				))}
			</div>
		</div>
	);
};
