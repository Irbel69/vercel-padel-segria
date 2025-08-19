import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PadelCourt } from './PadelCourt';
import { PlayerSelector } from './PlayerSelector';
import { useEditMatch } from './hooks/use-edit-match';
import type { Match } from './types';

interface EditMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  match: Match;
  onUpdated: () => void;
}

export function EditMatchDialog({ open, onOpenChange, eventId, match, onUpdated }: EditMatchDialogProps) {
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
    updateMatch,
  } = useEditMatch({ eventId, match });

  const handlePlayerChangeWithSelector = (position: number, player: any) => {
    const result = handlePlayerChange(position, player);
    if (result?.shouldOpenSelector) setPlayerSelectorOpen(true);
  };

  const handlePlayerSelectWithClose = (player: any) => {
    const success = handlePlayerSelect(player);
    if (success) setPlayerSelectorOpen(false);
  };

  const handleSubmit = async () => {
    await updateMatch(
      () => {
        onOpenChange(false);
        onUpdated();
      },
      (message) => setError(message)
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
    <DialogContent className="bg-black/90 border-white/20 text-white max-w-2xl sm:max-w-2xl w-[calc(100vw-2rem)] max-h-[100dvh] sm:max-h-[90dvh] p-0">
          {/* Layout: header fixed, scrollable body, footer pinned */}
          <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
              <DialogHeader>
                <DialogTitle className="leading-snug break-words">Editar Partit #{match.id}</DialogTitle>
                <DialogDescription className="text-white/60">
                  Modifica jugadors i la parella guanyadora. Pots deixar el camp de guanyador en blanc per desassignar-lo.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300">{error}</div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                <PadelCourt
                  players={selectedPlayers}
                  onPlayerChange={handlePlayerChangeWithSelector}
                  winnerPair={winnerPair}
                  onWinnerChange={setWinnerPair}
                />
                <p className="text-sm text-white/60 text-center">
                  Fes clic en una posició per canviar o eliminar el jugador. Utilitza les corones per marcar la parella guanyadora.
                </p>
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Cancel·lar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-padel-primary text-black hover:bg-padel-primary/90">
                  {isSubmitting ? 'Guardant...' : 'Desar canvis'}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Player Selector Dialog */}
      <Dialog open={playerSelectorOpen} onOpenChange={setPlayerSelectorOpen}>
  <DialogContent className="bg-black/90 border-white/20 text-white max-w-md w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Seleccionar Jugador</DialogTitle>
            <DialogDescription className="text-white/60">
              Tria un jugador per a la posició {selectedPosition !== null ? selectedPosition + 1 : ''}.
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
