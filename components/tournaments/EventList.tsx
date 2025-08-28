"use client";

import React from "react";
import type { Event } from "@/types";
import EventCard from "@/components/tournaments/ui/EventCard";

type Props = {
  events: Event[];
  processingEvents: Set<number>;
  onInvite: (eventId: number) => void;
  onUnregister: (eventId: number) => void;
  formatDate: (s: string) => string;
  formatDateTime: (s: string) => string;
  getStatusBadge: (s: string) => React.ReactNode;
  getRegistrationStatusBadge: (s: string) => React.ReactNode;
  canRegister: (e: Event) => boolean;
  canUnregister: (e: Event) => boolean;
  isRegistrationUrgent: (s: string) => boolean;
  onShowCode?: (id: number) => void;
  hideActions?: boolean;
  hideProgress?: boolean;
  landingHref?: string | null;
};

export default function EventList({ events, processingEvents, onInvite, onUnregister, formatDate, formatDateTime, getStatusBadge, getRegistrationStatusBadge, canRegister, canUnregister, isRegistrationUrgent, onShowCode, hideActions, hideProgress, landingHref }: Props) {
  return (
    <div className="space-y-6 md:space-y-4 max-w-full">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          processingEvents={processingEvents}
          onInvite={onInvite}
          onUnregister={onUnregister}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          canRegister={canRegister}
          canUnregister={canUnregister}
          getStatusBadge={getStatusBadge}
          getRegistrationStatusBadge={getRegistrationStatusBadge}
          isRegistrationUrgent={isRegistrationUrgent}
          imageUrl={event.image_url ?? null}
          onShowCode={onShowCode}
          hideActions={hideActions}
          hideProgress={hideProgress}
            landingHref={landingHref}
        />
      ))}
    </div>
  );
}
