"use client";

import { Trophy } from "lucide-react";
import { RankingsSection } from "@/components/sections/rankings";

export default function RankingsPage() {
	return (
		<div className="space-y-4 md:space-y-6 px-4 md:px-0">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2 bg-padel-primary/20 rounded-lg">
					<Trophy className="h-6 w-6 text-padel-primary" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-white">
						Classificació
					</h1>
					<p className="text-white/60 text-sm md:text-base">
						Ordenat per punts totals
					</p>
				</div>
			</div>

			{/* Reuse RankingsSection component */}
			<RankingsSection />
		</div>
	);
}
