import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PadelCourt } from './PadelCourt';
import { PlayerSelector } from './PlayerSelector';
import { useCreateMatch } from './hooks/use-create-match';
import type { CreateMatchDialogProps } from './types';

export function CreateMatchDialog({
	open,
	onOpenChange,
	eventId,
	onMatchCreated,
}: CreateMatchDialogProps) {
	const [error, setError] = useState<string | null>(null);
	const [playerSelectorOpen, setPlayerSelectorOpen] = useState(false);

	const {
		selectedPlayers,
		winnerPair,
		selectedPosition,
		isSubmitting,
		setWinnerPair,
		handlePlayerChange,
		handlePlayerSelect,
		resetForm,
		createMatch,
	} = useCreateMatch(eventId);

	const handlePlayerChangeWithSelector = (position: number, player: any) => {
		const result = handlePlayerChange(position, player);
		if (result?.shouldOpenSelector) {
			setPlayerSelectorOpen(true);
		}
	};

	const handlePlayerSelectWithClose = (player: any) => {
		const success = handlePlayerSelect(player);
		if (success) {
			setPlayerSelectorOpen(false);
		}
	};

	const handleSubmit = async () => {
		await createMatch(
			() => {
				onOpenChange(false);
				onMatchCreated();
			},
			(errorMessage) => {
				setError(errorMessage);
			}
		);
	};

	const handleClose = () => {
		onOpenChange(false);
		resetForm();
		setError(null);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent className="bg-black/90 border-white/20 text-white max-w-2xl max-h-[100dvh] sm:max-h-[90dvh] p-0">
					<div className="flex flex-col h-full">
						<div className="px-4 sm:px-6 pt-4 sm:pt-6">
							<DialogHeader>
								<DialogTitle className="leading-snug break-words">Crear Nou Partit</DialogTitle>
								<DialogDescription className="text-white/60">
									Selecciona entre 1 i 4 jugadors. Pots escollir la parella guanyadora per atorgar punts (només aplicable amb 4 jugadors registrats).
								</DialogDescription>
							</DialogHeader>
							{error && (
								<div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300">
									{error}
								</div>
							)}
						</div>

						<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
							<div className="flex flex-col items-center space-y-6">
								<PadelCourt
									players={selectedPlayers}
									onPlayerChange={handlePlayerChangeWithSelector}
									winnerPair={winnerPair}
									onWinnerChange={setWinnerPair}
								/>

								<p className="text-sm text-white/60 text-center">
									Fes clic en una posició buida per afegir un jugador.
									<br />
									Utilitza les corones per seleccionar la parella guanyadora.
								</p>

								<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
									<p className="font-medium mb-1">ℹ️ Nota sobre puntuació:</p>
									<p>• Els jugadors en posicions 1 i 3 formen la Parella 1</p>
									<p>• Els jugadors en posicions 2 i 4 formen la Parella 2</p>
									<p>• Els guanyadors reben +10 punts, els perdedors +3 punts</p>
								</div>
							</div>
						</div>

						<div className="px-4 sm:px-6 pb-4 sm:pb-6">
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={handleClose}
									className="bg-white/10 border-white/20 text-white hover:bg-white/20">
									Cancel·lar
								</Button>
								<Button
									onClick={handleSubmit}
									disabled={
										isSubmitting ||
										selectedPlayers.filter((p) => p !== null).length < 1
									}
									className="bg-padel-primary text-black hover:bg-padel-primary/90">
									{isSubmitting ? "Creant..." : "Crear Partit"}
								</Button>
							</DialogFooter>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Player Selector Dialog */}
			<Dialog open={playerSelectorOpen} onOpenChange={setPlayerSelectorOpen}>
				<DialogContent className="bg-black/90 border-white/20 text-white max-w-md max-h-[90dvh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Seleccionar Jugador</DialogTitle>
						<DialogDescription className="text-white/60">
							Tria un jugador per a la posició{" "}
							{selectedPosition !== null ? selectedPosition + 1 : ""}.
							{selectedPosition !== null &&
								selectedPosition + 1 > 4 &&
								" (opcional)"}
						</DialogDescription>
					</DialogHeader>
					<PlayerSelector
						open={playerSelectorOpen}
						onOpenChange={setPlayerSelectorOpen}
						onPlayerSelect={handlePlayerSelectWithClose}
						selectedPlayers={selectedPlayers}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}