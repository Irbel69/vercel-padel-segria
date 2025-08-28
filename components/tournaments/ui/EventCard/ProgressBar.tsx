"use client";

import React from "react";
import { motion } from "framer-motion";

type ProgressBarProps = {
  occupied: number;
  isFull: boolean;
  isAlmostFull: boolean;
  isInFocus: boolean;
};

/**
 * Animated progress bar component for EventCard
 * Shows tournament capacity with sparkle effects when in focus
 */
export function ProgressBar({ occupied, isFull, isAlmostFull, isInFocus }: ProgressBarProps) {
  return (
    <div className="mt-4">
  {/* Wrapper is relative so sparkles can be centered to the bar height */}
  {/* Removed md horizontal inset so parent can control alignment/width (keeps parity with Actions button) */}
  <div className="relative h-2 w-full">
        {/* Progress bar container with clipping for the fill only */}
        <div className="h-2 w-full rounded-full bg-gray-700/60 overflow-hidden shadow-inner">
          <motion.div
            className={`h-full relative overflow-hidden rounded-full ${
              isFull
                ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-300 shadow-yellow-400/40 shadow-lg"
                : isAlmostFull
                  ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-300 shadow-yellow-400/40 shadow-lg"
                  : "bg-gradient-to-r from-padel-primary via-yellow-400 to-yellow-300 shadow-padel-primary/40 shadow-lg"
            }`}
            style={{ width: isFull ? '100%' : `${Math.max(occupied, 0)}%`, minWidth: occupied > 0 || isFull ? '8px' : '0px' }}
            animate={{
              boxShadow: !isFull && isInFocus
                ? isAlmostFull
                  ? ["0 0 8px rgba(251, 191, 36, 0.4)", "0 0 16px rgba(251, 191, 36, 0.6)", "0 0 8px rgba(251, 191, 36, 0.4)"]
                  : ["0 0 8px rgba(229, 240, 0, 0.4)", "0 0 16px rgba(229, 240, 0, 0.6)", "0 0 8px rgba(229, 240, 0, 0.4)"]
                : undefined
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Glow effect - enhanced when card is in focus */}
            {!isFull && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-white/20"
                animate={{
                  opacity: isInFocus ? [0.3, 0.7, 0.3] : [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: isInFocus ? 1.5 : 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            {/* Moving shine effect - animated sweep from left to right */}
            {!isFull && (
              // Wrap the animated shine in a non-animated container that applies the skew
              // so Framer Motion can safely animate the `x` (translateX) property without
              // being overridden by a static `transform` string.
              <div className="absolute inset-0 rounded-full overflow-hidden" style={{ transform: 'skewX(-20deg)' }}>
                {/* Make the shine narrower than the container and start offset to the left so
                    translating it produces a visible sweep. Using percent-based x values
                    moves relative to the element's own width. */}
                <motion.div
                  className="absolute top-0 left-[-20%] h-full rounded-full"
                  style={{ width: '60%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)' }}
                  animate={{
                    x: isInFocus ? ['0%', '120%'] : ['0%', '100%'],
                    opacity: isInFocus ? [0, 0.75, 0] : [0, 0.35, 0]
                  }}
                  transition={{
                    duration: isInFocus ? 1.2 : 2.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* No decorative particles or glow - progress bar remains clean */}
      </div>
    </div>
  );
}