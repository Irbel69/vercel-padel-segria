"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AlertCircle,
	Plus,
	ArrowLeft,
	Swords,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
	MatchesList, 
	CreateMatchDialog, 
	useMatches,
	type Event 
} from "@/components/dashboard/admin/matches";

export default function EventMatchesPage({
	params,
}: {
	params: { id: string };
}) {
	const { user, profile, isLoading: userLoading } = useUser();
	const router = useRouter();
	const eventId = parseInt(params.id);

	// State for create match modal
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	// Use custom hook for matches data
	const {
		event,
		matches,
		isLoading,
		error,
		setError,
		fetchMatches,
		deleteMatch,
	} = useMatches(eventId, profile?.is_admin || false);

	// Redirect if not admin
	useEffect(() => {
		if (!userLoading && (!profile || !profile.is_admin)) {
			redirect("/dashboard");
		}
	}, [profile, userLoading]);

	// Show loading while checking user permissions
	if (userLoading || (!profile?.is_admin && !error)) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-6 px-4 md:px-0">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
				{/* Left: back on first line (mobile), icon+title on second; on md+, keep in one row */}
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-3">
						<Button
							variant="ghost"
							size="sm"
							asChild
							className="text-white/80 hover:text-white px-2 py-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-padel-primary/60"
						>
							<Link href="/dashboard/admin/events" aria-label="Tornar a Esdeveniments" className="flex items-center gap-2">
								<ArrowLeft className="h-4 w-4" />
								<span className="text-sm">Esdeveniments</span>
							</Link>
						</Button>
						{/* Icon + title block. On mobile, wrap to next line; on md, inline */}
						<div className="basis-full md:basis-auto flex items-center gap-3 min-w-0">
							<div className="p-2 bg-padel-primary/20 rounded-lg shrink-0" aria-hidden="true">
								<Swords className="h-6 w-6 text-padel-primary" />
							</div>
							<div className="min-w-0">
								<h1 className="text-2xl md:text-3xl font-bold text-white truncate">
									Partits - {event?.title || "Carregant..."}
								</h1>
								<p className="text-white/60 text-sm md:text-base">
									Gestiona els partits del torneig
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Right: create button */}
				<Button
					onClick={() => setIsCreateModalOpen(true)}
					className="bg-padel-primary text-black hover:bg-padel-primary/90 w-full md:w-auto">
					<Plus className="h-4 w-4 mr-2" />
					<span className="sm:hidden">Nou Partit</span>
					<span className="hidden sm:inline">Crear Partit</span>
				</Button>
			</div>

			{/* Error Message */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Matches List */}
			<MatchesList
				matches={matches}
				isLoading={isLoading}
				onDeleteMatch={deleteMatch}
				onUpdated={fetchMatches}
				eventId={eventId}
			/>

			{/* Create Match Modal */}
			<CreateMatchDialog
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				eventId={eventId}
				onMatchCreated={() => {
					setIsCreateModalOpen(false);
					fetchMatches();
				}}
			/>
		</div>
	);
}
