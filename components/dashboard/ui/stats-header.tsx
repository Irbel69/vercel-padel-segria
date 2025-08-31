"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, User } from "lucide-react";
import CountUp from "react-countup";

type UserProfile = {
	name: string;
	surname?: string | null;
	created_at: string;
	is_admin?: boolean | null;
};

export default function StatsHeader({
	userProfile,
	userScore,
}: {
	userProfile: UserProfile;
	userScore: number;
}) {
	return (
		<Card className="border-0 relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15">
			<CardHeader className="pb-2">
				<div className="flex items-center gap-3">
					<div className="w-14 h-14 bg-padel-primary/20 rounded-full flex items-center justify-center">
						<User className="h-7 w-7 text-padel-primary" />
					</div>
					<div className="flex-1">
						<CardTitle className="text-xl md:text-2xl text-white">
							{userProfile.name} {userProfile.surname}
						</CardTitle>
						<div className="flex flex-wrap items-center gap-2 mt-1">
							{userProfile.is_admin && (
								<Badge className="bg-padel-primary/20 text-padel-primary border-padel-primary/30">
									<Crown className="w-3 h-3 mr-1" /> Admin
								</Badge>
							)}
							<Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30">
								<Calendar className="w-3 h-3 mr-1" />
								{new Date(userProfile.created_at).getFullYear()}
							</Badge>
						</div>
					</div>
					<div className="text-right">
						<div className="text-2xl md:text-3xl font-bold text-white">
							<CountUp end={userScore} duration={2.0} delay={0.3} />
						</div>
						<div className="text-xs md:text-sm text-white/60">Punts</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0" />
		</Card>
	);
}
