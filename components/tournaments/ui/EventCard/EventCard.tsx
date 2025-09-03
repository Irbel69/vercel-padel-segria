"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useScrollScale } from "@/hooks/use-scroll-scale";
import { Hero } from "./Hero";
import { Content } from "./Content";
import { ProgressBar } from "./ProgressBar";
import { Actions } from "./Actions";
import type { Event } from "@/types";

type Props = {
  event: Event;
  processingEvents: Set<number>;
  onInvite: (eventId: number) => void;
  onUnregister: (eventId: number) => void;
  formatDate: (s: string) => string;
  formatDateTime: (s: string) => string;
  canRegister: (e: Event) => boolean;
  canUnregister: (e: Event) => boolean;
  getStatusBadge?: (s: string) => React.ReactNode;
  getRegistrationStatusBadge?: (s: string) => React.ReactNode;
  isRegistrationUrgent?: (deadline: string) => boolean;
  onViewDetails?: (id: number) => void;
  onShowCode?: (id: number) => void;
  // Optional future: hero image/url if exists in backend
  imageUrl?: string | null;
  hideActions?: boolean;
  hideProgress?: boolean;
  landingHref?: string | null;
};
import Link from "next/link";

/**
 * EventCard — Mobile-first tournament card with hero, overlays, chips and CTAs
 *
 * Visual goals:
 * - Clear hierarchy: hero (status/capacity), title, date, chips, progress, CTAs
 * - Accents: emerald/cyan for positive, amber for warning, slate/rose for closed/cancelled
 * - Replace "toca aquí" -> "Veure detalls" link
 */
export default function EventCard({
  event,
  processingEvents,
  onInvite,
  onUnregister,
  formatDate,
  formatDateTime,
  canRegister,
  canUnregister,
  getStatusBadge,
  getRegistrationStatusBadge,
  isRegistrationUrgent,
  onViewDetails,
  onShowCode,
  imageUrl,
  hideActions,
  hideProgress,
  landingHref,
}: Props) {
  const occupied = Math.min(
    100,
    Math.round(
      ((event.current_participants || 0) / event.max_participants) * 100
    )
  );
  const isAlmostFull = occupied >= 75 && occupied < 100;
  const isFull = occupied >= 100 || event.status === "closed";

  // If the registration deadline has passed, treat the event as closed for UI purposes.
  const registrationClosed =
    !!event.registration_deadline && new Date(event.registration_deadline) < new Date();

  // Consider registration-closed as closed for the "isFull" / status calculations so
  // the UI reflects the closed state consistently (no CTA shown, gray overlay, etc.)
  const effectiveIsFull = isFull || registrationClosed;

  const { ref, scale, opacity, brightness } = useScrollScale({
    scaleRange: [0.97, 1.015],
  });

  // Track if card is in focus based on scale value
  const [isInFocus, setIsInFocus] = useState(false);

  useEffect(() => {
    const unsubscribe = scale.on("change", (latest) => {
      const inFocus = latest > 1.008; // Lower threshold to catch more easily
      setIsInFocus(inFocus);
      // Temporary debug - remove later
      if (inFocus) {
        console.log(`Card "${event.title}" is in focus with scale:`, latest);
      }
    });

    return unsubscribe;
  }, [scale, event.title]);

  // Higher-contrast capacity pill with subtle glow and ring for readability over imagery
  const capacityPillColor = isFull
    ? "bg-slate-800/80 text-slate-100 ring-1 ring-slate-300/30 drop-shadow-[0_0_0.35rem_rgba(148,163,184,0.25)]"
    : isAlmostFull
    ? "bg-amber-500/25 text-amber-200 ring-1 ring-amber-300/50 drop-shadow-[0_0_0.45rem_rgba(245,158,11,0.45)]"
  : "bg-green-700/55 text-white ring-1 ring-green-400/70 drop-shadow-[0_0_0.5rem_rgba(34,197,94,0.55)]";

  const filter = useMotionTemplate`brightness(${brightness})`;

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
        opacity,
        filter,
      }}
      className="transform-gpu"
    >
      <Card className="bg-gradient-to-br from-black-900/90 via-gray-800/80 to-gray-900/90 border border-black1-700/50 overflow-hidden shadow-2xl shadow-black/40 transition-shadow duration-300">
        {/* Grid on md+: left column for hero (image), right column for content/progress/actions */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,33%)_1fr]">
          <div className="order-1 md:order-1">
            <Hero
              event={event}
              imageUrl={imageUrl}
              getStatusBadge={getStatusBadge}
              getRegistrationStatusBadge={getRegistrationStatusBadge}
              isRegistrationUrgent={isRegistrationUrgent}
              canRegister={canRegister}
              capacityPillColor={capacityPillColor}
              occupied={occupied}
              isFull={effectiveIsFull}
              isAlmostFull={isAlmostFull}
              className={imageUrl ? "md:h-full md:aspect-auto" : "md:h-48"}
              // Pass derived status so child components can render CLOSED state and styles
              registrationClosed={registrationClosed}
              effectiveStatus={
                registrationClosed ? "closed" : isFull ? "full" : isAlmostFull ? "almost_full" : "open"
              }
            />
          </div>

          <CardContent className="p-0 order-2 md:order-2">
            <div className={`${imageUrl ? "text-white" : ""}`}>
              <Content
                event={event}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                imageUrl={imageUrl}
                getRegistrationStatusBadge={getRegistrationStatusBadge}
                effectiveStatus={registrationClosed ? 'closed' : isFull ? 'full' : isAlmostFull ? 'almost_full' : 'open'}
              />

              {/* Progress bar - placed inside the same horizontal padding as Actions so widths align */}
              <div className="px-4 md:px-5 pt-2">
                {/* Constrain width on md+ to visually match the CTA button width while staying full width on mobile */}
                <div className="w-full md:w-auto md:max-w-[360px] ml-0 md:ml-auto">
                  {!hideProgress && !registrationClosed && (
                    <ProgressBar
                      occupied={occupied}
                      isFull={effectiveIsFull}
                      isAlmostFull={isAlmostFull}
                      isInFocus={isInFocus}
                    />
                  )}
                </div>
              </div>

              <div className="px-4 md:px-5 pb-4 md:pb-5">
                {/* If landingHref is provided, show a single CTA that redirects to tournaments dashboard */}
                {landingHref ? (
                  <div className="mt-3 md:flex md:justify-end">
                    <Link href={landingHref} className="block w-full md:inline-block md:w-auto">
                          <button className="w-full md:w-auto bg-padel-primary text-black font-bold px-6 py-3 md:px-4 md:py-2 shadow-lg rounded-lg">
                            Inscriure&apos;m
                          </button>
                        </Link>
                  </div>
                ) : (
                  !hideActions && (
                    <Actions
                      event={event}
                      processingEvents={processingEvents}
                      onInvite={onInvite}
                      onUnregister={onUnregister}
                      canRegister={canRegister}
                      canUnregister={canUnregister}
                      onViewDetails={onViewDetails}
                      onShowCode={onShowCode}
                      isFull={isFull}
                      imageUrl={imageUrl}
                    />
                  )
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
