"use client";
import { HTMLAttributes } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BattlePassPrizeProgress } from "../hooks/use-battle-pass-progress";

interface BottomPrizeProps extends HTMLAttributes<HTMLDivElement> {
  prize: BattlePassPrizeProgress;
  index: number;
  canClaim: boolean;
  isLocked: boolean;
  isClaimed: boolean;
  onClaim?: () => void;
  onInteraction?: () => void;
}

export default function BottomPrize({ prize, index, canClaim, isLocked, isClaimed, onClaim, onInteraction, className, ...rest }: BottomPrizeProps) {
  return (
    <div className={cn("text-center w-full mt-7 max-w-[140px]", className)} {...rest}>
      <h3 className={cn("font-semibold text-sm md:text-base mb-1 line-clamp-2", isLocked ? "text-gray-400" : "text-white")}>
        {prize.title}
      </h3>

      <div className={cn("text-xs md:text-sm flex items-center justify-center gap-1 mb-3", isLocked ? "text-gray-500" : "text-yellow-400")}>
        <Trophy className="w-3 h-3" />
        {prize.points_required} pts
      </div>

      {canClaim && (
        <Button
          size="sm"
          className="bg-yellow-500 text-black hover:bg-yellow-400 text-sm font-semibold px-5 py-2.5"
          onClick={(e) => {
            // prevent the click from bubbling up to parent container which opens the claimed-users list
            e.stopPropagation();
            // Defensive: older parsers/builders sometimes choke on the optional call operator (?.()),
            // so call stopImmediatePropagation safely without using ?.()
            try {
              const ne = e.nativeEvent as any;
              if (typeof ne?.stopImmediatePropagation === "function") {
                ne.stopImmediatePropagation();
              }
            } catch (err) {
              // ignore
            }
            onInteraction?.();
            onClaim?.();
          }}
          onPointerDown={(e) => { e.stopPropagation(); onInteraction?.(); }} // also stop pointer events
          onPointerUp={(e) => e.stopPropagation()}
          onPointerCancel={(e) => e.stopPropagation()}
        >
          Reclama premi
        </Button>
      )}
    </div>
  );
}
