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
};

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
}: Props) {
  const occupied = Math.min(
    100,
    Math.round(
      ((event.current_participants || 0) / event.max_participants) * 100
    )
  );
  const isAlmostFull = occupied >= 75 && occupied < 100;
  const isFull = occupied >= 100 || event.status === "closed";

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

  const capacityPillColor = isFull
    ? "bg-slate-700 text-slate-200"
    : isAlmostFull
    ? "bg-amber-500/20 text-amber-300"
    : "bg-green-500/20 text-green-400";

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
              isFull={isFull}
              isAlmostFull={isAlmostFull}
              className={imageUrl ? "md:h-full md:aspect-auto" : "md:h-48"}
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
              />

              {/* Progress bar - placed inside the same horizontal padding as Actions so widths align */}
              <div className="px-4 md:px-5 pt-2">
                {/* Constrain width on md+ to visually match the CTA button width while staying full width on mobile */}
                <div className="w-full md:w-auto md:max-w-[360px] ml-0 md:ml-auto">
                  <ProgressBar
                    occupied={occupied}
                    isFull={isFull}
                    isAlmostFull={isAlmostFull}
                    isInFocus={isInFocus}
                  />
                </div>
              </div>

              <div className="px-4 md:px-5 pb-4 md:pb-5">
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
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
