"use client";

import Image from "next/image";
// React is available in scope for JSX
import { Badge } from "@/components/ui/badge";
import { motion, useReducedMotion } from "framer-motion";
import { UserPlus } from "lucide-react";
import React from "react";

// Small helper that animates the urgent badge with a subtle pop + float while
// respecting prefers-reduced-motion. Kept local to this file for simplicity.
function MotionUrgentBadge({
  children,
  reducedMotion,
}: {
  children: React.ReactNode;
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return <div>{children}</div>;
  }

  // Subtle scale-only pop loop (no movement or opacity change)
  return (
    <motion.div
      initial={{ scale: 0.85 }}
      animate={{ scale: [1, 1.05, 0.98, 1] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      {children}
    </motion.div>
  );
}
import type { Event } from "@/types";

type HeroProps = {
  event: Event;
  imageUrl?: string | null;
  getStatusBadge?: (s: string) => React.ReactNode;
  getRegistrationStatusBadge?: (s: string) => React.ReactNode;
  isRegistrationUrgent?: (deadline: string) => boolean;
  canRegister: (e: Event) => boolean;
  capacityPillColor: string;
  occupied?: number;
  isFull: boolean;
  isAlmostFull: boolean;
  className?: string;
  // new prop: indicates registration deadline has passed
  registrationClosed?: boolean;
  // an explicit effective status string derived by parent
  effectiveStatus?: string;
};

/**
 * Hero section component for EventCard
 * Handles image/gradient background, status badges, capacity, and map button
 */
export function Hero({
  event,
  imageUrl,
  getStatusBadge,
  getRegistrationStatusBadge,
  isRegistrationUrgent,
  canRegister,
  capacityPillColor,
  occupied,
  isFull,
  isAlmostFull,
  className,
  registrationClosed,
  effectiveStatus,
}: HeroProps) {
  // Call hook at top-level to respect Hooks rules and compute status once
  const reducedMotion = useReducedMotion();
  const status = effectiveStatus ?? (isFull ? "full" : isAlmostFull ? "almost_full" : "open");

  return (
    <div className={`relative w-full aspect-video ${className ?? ""}`}>
      {/* If a future event image exists, render it; else vibrant gradient hero with padel court pattern */}
      {imageUrl ? (
        <Image src={imageUrl} alt={event.title} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-padel-primary/30 via-gray-800/90 to-padel-primary/20" />

          {/* Padel court pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <svg
              className="w-full h-full"
              viewBox="0 0 400 225"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Court outline */}
              <rect
                x="50"
                y="50"
                width="300"
                height="125"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-padel-primary/40"
              />
              {/* Center line */}
              <line
                x1="200"
                y1="50"
                x2="200"
                y2="175"
                stroke="currentColor"
                strokeWidth="1"
                className="text-padel-primary/30"
              />
              {/* Service boxes */}
              <line
                x1="125"
                y1="50"
                x2="125"
                y2="175"
                stroke="currentColor"
                strokeWidth="1"
                className="text-padel-primary/30"
              />
              <line
                x1="275"
                y1="50"
                x2="275"
                y2="175"
                stroke="currentColor"
                strokeWidth="1"
                className="text-padel-primary/30"
              />
              {/* Net representation */}
              <line
                x1="200"
                y1="50"
                x2="200"
                y2="175"
                stroke="currentColor"
                strokeWidth="3"
                className="text-padel-primary/50"
              />
              {/* Decorative padel racket */}
              <g
                transform="translate(320, 40)"
                className="text-padel-primary/25"
              >
                <ellipse
                  cx="0"
                  cy="0"
                  rx="15"
                  ry="25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="0"
                  y1="25"
                  x2="0"
                  y2="45"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Enhanced diagonal sheen with yellow tint (reduced to be subtle) */}
      <div className="absolute inset-0 opacity-20 [background:linear-gradient(120deg,transparent,rgba(229,240,0,0.08),transparent)]" />

      {/* Additional depth layer (lighter so images remain visible) */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-transparent" />

      {/* If an external image is present, add a subtle dark overlay to ensure contrast
          but keep the photo clearly visible. */}
      {imageUrl && (
        <div
          aria-hidden
          className="absolute inset-0 bg-black/18 backdrop-blur-[1px]"
        />
      )}

      {/* When event is full/closed, use a softer overlay to communicate completion
          without fully obscuring the image. */}
      {(isFull || registrationClosed) && (
        <div aria-hidden className="absolute inset-0 bg-slate-800/30" />
      )}

      {/* Overlays: status and capacity */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        {
          <div className="drop-shadow">
            {/* Wrap the status badge with animation when event is almost full (and not full) */}
            {isAlmostFull && !isFull && !registrationClosed ? (
              <MotionUrgentBadge reducedMotion={reducedMotion}>
                {getStatusBadge(status)}
              </MotionUrgentBadge>
            ) : (
              getStatusBadge(status)
            )}
          </div>
        }
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {/* Compact registration status (mobile) - keep existing behavior */}
        {event.user_registration_status && getRegistrationStatusBadge && (
          <div className="sm:hidden">
            {getRegistrationStatusBadge(event.user_registration_status)}
          </div>
        )}
        {/* When registration is closed, make the capacity pill red to indicate closure */}
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${
            registrationClosed || effectiveStatus === 'closed'
              ? 'bg-red-600/25 text-red-200 ring-1 ring-red-400/50 drop-shadow-[0_0_0.45rem_rgba(239,68,68,0.45)]'
              : capacityPillColor
          }`}
        >
          {event.current_participants || 0}/{event.max_participants}
        </span>
      </div>

      {/* Removed bottom-right 'Últimes places' badge; animation now applies to the status badge when almost full. */}

      {/* Map quick open — moved to Content for better discoverability and consistent layout */}
    </div>
  );
}
