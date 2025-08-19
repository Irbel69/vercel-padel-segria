import React, { useMemo, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, MoreVertical, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { MatchPair } from './MatchPair';
import type { MatchCardProps } from './types';
import { toast } from "@/hooks/use-toast";
import { EditMatchDialog } from './EditMatchDialog';

export function MatchCard({ match, onDelete, onUpdated, eventId }: MatchCardProps) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);
	
	const formatHumanDate = (dateString: string) =>
		new Date(dateString).toLocaleDateString("ca-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

	const dateTimeISO = useMemo(() => new Date(match.match_date).toISOString(), [match.match_date]);

	// Funciones para manejar las acciones y cerrar el popover
	const handleEditClick = () => {
		setIsEditOpen(true);
		setPopoverOpen(false);
	};

	const handleDeleteClick = () => {
		setShowDeleteDialog(true);
		setPopoverOpen(false);
	};

	const handleDeleteConfirm = () => {
		onDelete(match.id);
		setShowDeleteDialog(false);
	};

	// Get all players in the match
	const allPlayers = match.user_matches || [];
	const totalPlayers = allPlayers.length;

	// Traditional pair logic for 4 players
	const pair1 =
		allPlayers.filter((um) => um.position === 1 || um.position === 3) || [];
	const pair2 =
		allPlayers.filter((um) => um.position === 2 || um.position === 4) || [];

	// For less than 4 players, show them all in a single list
	const showAsPairs = totalPlayers === 4;

	return (
		<section
			aria-labelledby={`match-${match.id}-title`}
			className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/7 transition-colors">
			{/* Header */}
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<h3
						id={`match-${match.id}-title`}
						className="truncate text-base font-semibold text-white md:text-lg"
					>
						Partit #{match.id}
					</h3>
					{match.winner_pair && (
						<Badge
							className="hidden md:inline-flex items-center gap-1 bg-padel-primary/15 text-padel-primary ring-1 ring-padel-primary/30"
							aria-live="polite"
						>
							<Crown className="h-3.5 w-3.5" aria-hidden="true" />
							<span className="text-xs md:text-[0.8rem]">
								Guanyadora: Parella {match.winner_pair}
							</span>
							<span className="sr-only">— Parella {match.winner_pair} guanyadora del partit</span>
						</Badge>
					)}
					{totalPlayers < 4 && (
						<Badge
							variant="outline"
							className="border-orange-500/30 text-orange-400"
							aria-label={`${totalPlayers} ${totalPlayers === 1 ? 'jugador' : 'jugadors'}`}
						>
							{totalPlayers} jugador{totalPlayers !== 1 ? "s" : ""}
						</Badge>
					)}
				</div>

				{/* Actions */}
				<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
					<TooltipProvider delayDuration={400}>
						<Tooltip>
							<TooltipTrigger asChild>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 border border-white/20 bg-white/5 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-padel-primary/60 rounded-md"
										aria-label={`Accions del partit #${match.id}`}
									>
										<MoreVertical className="h-4 w-4" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
							</TooltipTrigger>
							<TooltipContent side="left" className="text-xs">Accions</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<PopoverContent
						align="end"
						sideOffset={8}
						className="w-48 p-1 backdrop-blur-md bg-black/90 border border-white/20 shadow-[0_20px_35px_-15px_rgba(0,0,0,0.8)] rounded-lg"
					>
						<div className="space-y-0.5">
							<div className="px-3 py-2 text-xs font-medium text-white/60 uppercase tracking-wide">
								Accions
							</div>
							<div className="h-px bg-white/10 mx-2" />
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start px-3 py-2 h-auto text-left font-normal text-white hover:bg-white/10 hover:text-white rounded-md transition-colors"
								onClick={handleEditClick}
							>
								<Pencil className="mr-3 h-4 w-4" />
								<span className="text-sm">Editar partit</span>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start px-3 py-2 h-auto text-left font-normal text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors"
								onClick={handleDeleteClick}
							>
								<Trash2 className="mr-3 h-4 w-4" />
								<span className="text-sm">Eliminar…</span>
							</Button>
						</div>
					</PopoverContent>
				</Popover>

				{/* Delete Confirmation Dialog */}
				<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Eliminar el partit #{match.id}?</AlertDialogTitle>
							<AlertDialogDescription>
								Aquesta acció és permanent i no es pot desfer. S'eliminaran les
								referències dels jugadors a aquest partit.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel·lar</AlertDialogCancel>
							<AlertDialogAction
								className="bg-red-600 hover:bg-red-700"
								onClick={handleDeleteConfirm}
							>
								Eliminar
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Edit Match Dialog */}
				{eventId !== undefined && (
					<EditMatchDialog
						open={isEditOpen}
						onOpenChange={setIsEditOpen}
						eventId={eventId}
						match={match}
						onUpdated={() => {
							setIsEditOpen(false);
							onUpdated && onUpdated();
							toast({ title: 'Partit actualitzat', description: `El partit #${match.id} s\'ha actualitzat correctament.` });
						}}
					/>
				)}
			</div>

			{/* Content */}
			{showAsPairs ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<MatchPair players={pair1} isWinner={match.winner_pair === 1} pairNumber={1} />
					<MatchPair players={pair2} isWinner={match.winner_pair === 2} pairNumber={2} />
				</div>
			) : (
				<div className="rounded-lg border border-white/10 bg-white/5 p-3">
					<div className="mb-2 flex items-center gap-2">
						<span className="text-sm font-medium text-white/90">Jugadors</span>
					</div>
					<ul className="space-y-2" role="list">
						{allPlayers
							.sort((a, b) => a.position - b.position)
							.map((userMatch) => (
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
									<span className="ml-auto text-xs text-white/65">Pos. {userMatch.position}</span>
								</li>
							))}
					</ul>
				</div>
			)}

			{/* Footer */}
			<div className="mt-4">
				<Separator className="mb-3 bg-white/10" />
				<div className="flex items-center gap-2 text-xs text-white/80">
					<CalendarClock className="h-4 w-4" aria-hidden="true" />
					<time dateTime={dateTimeISO}>{formatHumanDate(match.match_date)}</time>
				</div>
			</div>
		</section>
	);
}