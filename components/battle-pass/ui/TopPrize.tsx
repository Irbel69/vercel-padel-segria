"use client";
import {HTMLAttributes,PointerEvent,KeyboardEvent} from "react";
import Image from "next/image";
import { Gift, Lock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BattlePassPrizeProgress } from "../hooks/use-battle-pass-progress";

interface TopPrizeProps extends HTMLAttributes<HTMLDivElement> {
  prize: BattlePassPrizeProgress;
  index: number;
  canClaim: boolean;
  isLocked: boolean;
  isClaimed: boolean;
}

export default function TopPrize({ prize, index, canClaim, isLocked, isClaimed, className, onPreviewClick, allowPreview = true, ...rest }: TopPrizeProps & { onPreviewClick?: () => void; allowPreview?: boolean }) {
  // Tap detection: simple pointer-based threshold to distinguish taps from horizontal swipes
  let pointerDownInfo: { x: number; y: number; t: number } | null = null;

  const onPointerDown = (e: PointerEvent) => {
    // Only track primary pointer
    if (e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === 'mouse') {
      pointerDownInfo = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!pointerDownInfo) return;
    const dx = Math.abs(e.clientX - pointerDownInfo.x);
    const dy = Math.abs(e.clientY - pointerDownInfo.y);
    const dt = Date.now() - pointerDownInfo.t;
    pointerDownInfo = null;

    // Consider it a tap when movement small and time short
    if (dx < 12 && dy < 12 && dt < 350) {
      if (allowPreview) onPreviewClick?.();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (allowPreview) onPreviewClick?.(); } };

  return (
    <div className={cn("flex flex-col items-center relative group snap-center overflow-visible", className)} {...rest}>
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        // Allow touch-action pan-x on the container but ensure browser doesn't block pointer events
        style={{ touchAction: 'manipulation' }}
        className={cn(
          "relative w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-padel-primary/60",
          isLocked ? "from-gray-800/50 via-gray-700/60 to-gray-800/50 border-gray-600/40" : "from-yellow-600/60 via-yellow-500/70 to-yellow-600/60 border-yellow-400/60",
          isLocked && "grayscale opacity-60"
        )}
      >
        <div className="relative w-full h-full p-2 md:p-3 flex items-center justify-center">
          {prize.image_url ? (
            // use a fixed-size, positioned container so Image with `fill` can be object-cover and never overflow
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden z-50" data-prize-image>
              <Image src={prize.image_url} alt={prize.title} fill className="object-cover" />
            </div>
          ) : (
            <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center", isLocked ? "bg-gray-600/50 text-gray-400" : "bg-yellow-500/20 text-yellow-400")}> 
              {/* fallback icon handled by CSS or parent */}
            </div>
          )}
        </div>

        {/* Status overlay: convert to inline icons (no background/rounding) placed top-right but visually inline style */}
        <div className="absolute top-1 right-1 flex items-center space-x-1">
          {isClaimed && (
            <Check className="w-4 h-4 text-green-400" aria-hidden />
          )}
          {isLocked && (
            // Lock icon larger and inline, no bg/rounding. Use a subdued 'not-accessible' color.
            <Lock className="w-5 h-5 text-red-400" aria-hidden />
          )}
          {canClaim && (
            <Gift className="w-5 h-5 text-padel-primary" aria-hidden />
          )}
        </div>

        {/* Hashtag badge */}
        <div className="absolute top-1 left-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            #{index + 1}
          </Badge>
        </div>
      </div>
    </div>
  );
}
