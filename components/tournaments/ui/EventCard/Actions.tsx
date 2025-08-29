"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type ActionsProps = {
  // event contains extra runtime fields (user_registration_status, partner) present at runtime
  event: any;
  processingEvents: Set<number>;
  onInvite: (eventId: number) => void;
  onUnregister: (eventId: number) => void;
  canRegister: (e: any) => boolean;
  canUnregister: (e: any) => boolean;
  onViewDetails?: (id: number) => void;
  imageUrl?: string | null;
  isFull?: boolean;
  onShowCode?: (id: number) => void;
};

/**
 * Actions section component for EventCard
 * Handles CTA buttons: register, unregister, confirmed state, and view details
 */
export function Actions({
  event,
  processingEvents,
  onInvite,
  onUnregister,
  canRegister,
  canUnregister,
  onViewDetails,
  imageUrl,
  isFull,
  onShowCode,
}: ActionsProps) {
  return (
    <div className="mt-3 space-y-3">
      {/* Actions row - Full width on mobile, inline on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
        {canRegister(event) && (
          <Button
            onClick={() => onInvite(event.id)}
            className={`w-full md:w-auto bg-padel-primary ${
              imageUrl ? "text-black" : "text-black"
            } hover:bg-padel-primary/90 font-bold px-6 py-3 md:px-4 md:py-2 shadow-lg shadow-padel-primary/20 hover:shadow-padel-primary/30 transform hover:scale-105 transition-all duration-200 rounded-lg`}
          >
            Inscriure&apos;m
          </Button>
        )}

        {/* If user is already confirmed but has no partner, allow showing a share code */}
        {event.user_registration_status === "confirmed" &&
          !event.partner && !isFull &&
          onShowCode && (
            <Button
              onClick={() => onShowCode(event.id)}
              className={`w-full md:w-auto bg-padel-primary text-black hover:bg-padel-primary/90 font-bold px-6 py-3 md:px-4 md:py-2 shadow-lg shadow-padel-primary/20 hover:shadow-padel-primary/30 transform hover:scale-105 transition-all duration-200 rounded-lg`}
            >
              Mostrar codi
            </Button>
          )}
        {canUnregister(event) && (
          <Button
            variant="outline"
            onClick={() => onUnregister(event.id)}
            disabled={processingEvents.has(event.id)}
            className={`w-full md:w-auto ${
              imageUrl
                ? "text-red-200 bg-red-600/10 border-red-500/40"
                : "text-red-300 bg-red-500/20 border-red-400/60"
            } backdrop-blur-sm shadow-sm hover:shadow-red-400/20 transition-all duration-200 rounded-lg px-4 py-2`}
          >
            {processingEvents.has(event.id) ? "Cancel·lant..." : "Cancel·lar"}
          </Button>
        )}
      </div>

      {/* Secondary link */}
      {onViewDetails && (
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={() => onViewDetails(event.id)}
            className="text-cyan-300 hover:text-cyan-200 text-xs underline underline-offset-2"
          >
            Veure detalls
          </button>
        </div>
      )}
    </div>
  );
}
