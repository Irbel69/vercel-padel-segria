"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Award, Star } from "lucide-react";
import { getQualityIcon } from "./quality-icons";

export default function Qualities({
	userQualities,
}: {
	userQualities: Array<{ quality_id: number; qualities: { name: string } }>;
}) {
	return (
		<Card className="border-0 bg-white/5 ring-1 ring-white/15 rounded-xl">
			<CardContent className="p-4">
				<h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
					<Star className="w-4 h-4 text-padel-primary" />
					Qualitats Destacades
				</h3>

				{userQualities && userQualities.length > 0 ? (
					<div className="flex items-center justify-center md:justify-center gap-4 md:gap-6">
						{userQualities.map((uq) => {
							const Icon = getQualityIcon(uq.qualities.name);
							return (
								<div key={uq.quality_id} className="flex flex-col items-center">
									<div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-padel-primary/20 to-padel-primary/30 flex items-center justify-center border border-padel-primary/40">
										<Icon className="w-7 h-7 md:w-10 md:h-10 text-padel-primary" />
									</div>
									<span className="text-white text-xs md:text-sm font-medium text-center mt-2 max-w-24 md:max-w-28 leading-tight">
										{uq.qualities.name}
									</span>
								</div>
							);
						})}
					</div>
				) : (
					<div className="text-center py-6">
						<Award className="w-8 h-8 text-white/30 mx-auto mb-2" />
						<div className="text-white/60 text-sm mb-1">
							Cap qualitat assignada
						</div>
						<div className="text-xs text-white/40">
							Un admin pot assignar-te fins a 3
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
