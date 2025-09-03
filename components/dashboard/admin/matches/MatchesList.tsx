import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords } from "lucide-react";
import { MatchCard } from './MatchCard';
import type { MatchesListProps } from './types';

export function MatchesList({ 
	matches, 
	isLoading, 
	onDeleteMatch,
	onUpdated,
	eventId,
}: MatchesListProps) {
	return (
		<Card className="border-white/10 bg-white/5">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center justify-between gap-3 text-white">
					<span className="text-lg md:text-xl">Partits</span>
					<Badge
						variant={matches.length ? "secondary" : "outline"}
						aria-live="polite"
						className={matches.length ? "bg-padel-primary/20 text-padel-primary" : "text-white/70"}
					>
						{matches.length} {matches.length === 1 ? "partit" : "partits"}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
				) : matches.length === 0 ? (
					<div className="py-10 text-center">
						<Swords className="mx-auto mb-4 h-12 w-12 text-white/50" />
						<p className="text-white/80">No hi ha partits creats per aquest torneig</p>
					</div>
				) : (
					<div className="space-y-4">
						{matches.slice().reverse().map((match) => (
							<MatchCard key={match.id} match={match} onDelete={onDeleteMatch} onUpdated={onUpdated} eventId={eventId} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}