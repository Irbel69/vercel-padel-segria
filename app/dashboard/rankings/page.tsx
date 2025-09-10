"use client";

import { Trophy } from "lucide-react";
import { RankingsSection } from "@/components/sections/rankings";

export default function RankingsPage() {
	return (
		<div className="space-y-4 md:space-y-6 px-4 md:px-0">
			{/* Header */}
					<div className="relative">
						<div className="absolute inset-0 bg-gradient-to-r from-padel-primary/5 via-transparent to-padel-primary/5 rounded-2xl blur-3xl -z-10" />
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6 bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-xl">
							<div className="flex flex-row items-center gap-3 md:gap-4">
								<div className="p-2 md:p-3 bg-gradient-to-br from-padel-primary/30 to-padel-primary/10 rounded-xl shadow-lg border border-padel-primary/20">
									<Trophy className="h-6 w-6 md:h-7 md:w-7 text-padel-primary drop-shadow-sm" />
								</div>
								<div className="min-w-0 flex-1">
									<h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-sm bg-gradient-to-r from-white via-white to-padel-primary bg-clip-text text-transparent">
										Classificació
									</h1>
									<p className="text-gray-300 text-sm md:text-lg font-medium">Ordenat per punts totals</p>
								</div>
							</div>
						</div>
					</div>

			{/* Reuse RankingsSection component - hide its internal header because the page provides the header */}
			<RankingsSection showHeader={false} showNavButtons={false} />
		</div>
	);
}
