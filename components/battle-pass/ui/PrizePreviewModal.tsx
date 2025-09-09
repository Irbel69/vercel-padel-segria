"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Trophy, Lock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { BattlePassPrizeProgress } from "../hooks/use-battle-pass-progress";

interface PrizePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: BattlePassPrizeProgress;
  isLocked: boolean;
  isClaimed?: boolean;
}

export default function PrizePreviewModal({ isOpen, onClose, prize, isLocked, isClaimed }: PrizePreviewModalProps) {
  const shouldReduceMotion = useReducedMotion();

  const panelVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 6 },
    enter: { opacity: 1, scale: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.35, ease: [0.2, 0.8, 0.2, 1] } },
    exit: { opacity: 0, scale: 0.98, y: 6, transition: { duration: shouldReduceMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] } },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-900/95 border-gray-700">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-padel-primary" />
            Vista previa del premi
          </DialogTitle>
          <DialogDescription className="text-gray-300">Mira el premi en detalle.</DialogDescription>
        </DialogHeader>

        <motion.div initial="hidden" animate="enter" exit="exit" variants={panelVariants} className="py-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-padel-primary/10 via-padel-primary/12 to-padel-primary/10 rounded-2xl blur-xl" />

            {/* Cambiar borde a verde cuando ya esté reclamado */}
            <div className={`relative bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-2xl p-6 ${isClaimed ? 'border border-emerald-500/40' : 'border border-padel-primary/30'}`}>
              <div className="relative text-center">
                <div className="mx-auto mb-4 relative w-36 h-36 overflow-hidden rounded-lg">
                  {prize.image_url ? (
                    <Image src={prize.image_url} alt={prize.title} fill className="object-contain rounded-lg" />
                  ) : (
                    <div className={`w-36 h-36 mx-auto rounded-2xl flex items-center justify-center ${isClaimed ? 'bg-emerald-900/40' : 'bg-padel-primary/20'}`}>
                      <Trophy className={`${isClaimed ? 'text-emerald-400' : 'text-padel-primary'} w-12 h-12`} />
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{prize.title}</h3>

                {prize.description && (
                  <p className="text-sm text-gray-300 mb-4">{prize.description}</p>
                )}

                {/* Si está reclamado, mostrar Badge verde para RecreationX */}
                <Badge className={`transform-gpu transition-transform duration-300 ease-in-out hover:scale-105 ${isClaimed ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'bg-padel-primary/20 text-padel-primary border-padel-primary/30 hover:text-padel-primary hover:bg-padel-primary/20'}`}>
                  <Trophy className={`w-3 h-3 mr-1 ${isClaimed ? 'text-emerald-400' : 'text-padel-primary'}`} />
                  Es requereixen {prize.points_required} punts
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        <DialogFooter className="sm:justify-center gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Tanca
          </Button>
          {/* Button: use inline icons (no background/rounding) and show missing points when locked */}
          <Button disabled className={`${isClaimed ? "bg-emerald-900/40" : "bg-gray-700"} text-gray-300 min-w-[140px] flex items-center justify-center gap-2`} title={isLocked ? "Bloquejat: encara no tens prou punts" : "Reclamar"}>
            {isLocked ? (
                // Compute missing points from prize.progress_percentage -> approximate missing points
              (() => {
                const missing = Math.max(0, prize.points_required - Math.floor((prize.progress_percentage * prize.points_required) / 100));
                return (
                  <>
                    {/* inline lock icon, yellow to signal 'not accessible yet' */}
                    <Lock className="w-5 h-5 mr-2 text-yellow-400" />
                    {/* Only show a single large text, vertically centered */}
                    <span className=" font-semibold">Encara falten {missing} punts</span>
                  </>
                );
              })()
            ) : (
              // If already claimed show a muted gift + 'Reclamat' (Catalan), otherwise active gift + 'Reclamar'
              isClaimed ? (
                <>
                  <Gift className="w-5 h-5 mr-1 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Reclamat</span>
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5 mr-1 text-padel-primary" />
                  <span className="text-sm font-medium">Reclamar</span>
                </>
              )
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
