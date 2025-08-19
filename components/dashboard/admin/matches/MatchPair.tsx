import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import type { MatchPairProps } from './types';

export function MatchPair({
	players,
	isWinner,
	pairNumber,
	showCrown = true,
}: MatchPairProps) {
	return (
		<div
			className={
				`rounded-lg border p-3 transition-colors ${
					isWinner
						? "bg-padel-primary/10 ring-1 ring-padel-primary/35 border-padel-primary/30"
						: "bg-white/5 border-white/10"
				}`
			}
			aria-current={isWinner ? "true" : undefined}
			aria-label={`Parella ${pairNumber}${isWinner ? ', guanyadora' : ''}`}
		>
			<div className="mb-2 flex items-center gap-2">
				<span className="text-sm font-medium text-white">Parella {pairNumber}</span>
				{isWinner && showCrown && (
					<Crown className="h-4 w-4 text-padel-primary" aria-hidden="true" />
				)}
				{isWinner && <span className="sr-only">Equip guanyador</span>}
			</div>
			<ul className="space-y-2" role="list">
				{players.map((userMatch) => (
					<li key={userMatch.users.id} role="listitem" className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src={userMatch.users.avatar_url} />
							<AvatarFallback className="text-xs">
								{((userMatch.users.name || "")[0] || "") +
									((userMatch.users.surname || "")[0] || "")}
							</AvatarFallback>
						</Avatar>
						<span className="text-sm text-white">
							{`${userMatch.users.name || ""} ${userMatch.users.surname || ""}`.trim() ||
								"Sense nom"}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}