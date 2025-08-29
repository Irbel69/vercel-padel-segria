"use client";
import {ReactNode} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EventList from "@/components/tournaments/EventList";
import type { Registration, Event } from "@/types";

type Props = {
  registrations: Registration[];
  isLoading: boolean;
  processingEvents: Set<number>;
  onUnregister: (id: number) => void;
  formatDate: (s: string) => string;
  formatDateTime: (s: string) => string;
  canUnregister: (e: any) => boolean;
  // The following props are necessary to render EventList similarly to AvailableEventsSection
  getStatusBadge?: (s: string) => ReactNode;
  getRegistrationStatusBadge?: (s: string) => ReactNode;
  canRegister?: (e: Event) => boolean;
  isRegistrationUrgent?: (deadline: string) => boolean;
  onShowCode?: (id: number) => void;
};

export default function MyRegistrationsSection({
  registrations,
  isLoading,
  processingEvents,
  onUnregister,
  formatDate,
  formatDateTime,
  canUnregister,
  getStatusBadge,
  getRegistrationStatusBadge,
  canRegister,
  isRegistrationUrgent,
  onShowCode,
}: Props) {
  // Map registrations to events shape expected by EventList.
  // Keep the original registration fields on the event for compatibility (user_registration_status etc.)
  const events = registrations
    .map((r) => ({ ...(r.event || {}), user_registration_status: r.status, registration: r }))
    .filter((e) => e && e.id) as Event[];

  return (
    <Card className="bg-white/5 border-white/10 w-full max-w-full overflow-hidden">
      <CardHeader className="px-3 md:px-6 space-y-2">
        <CardTitle className="text-white text-lg md:text-xl text-center sm:text-left flex items-center justify-center sm:justify-start gap-3">
          <span className="flex items-center gap-2">
            <span className="text-lg md:text-xl">Les Meves Inscripcions</span>
            <Badge
              variant="secondary"
              className="h-6 w-6 rounded-full bg-padel-primary/20 text-padel-primary flex items-center justify-center text-sm font-medium"
              aria-label={`${registrations.length} inscripcions`}
            >
              <span className="sr-only">inscripcions</span>
              {registrations.length}
            </Badge>
          </span>
        </CardTitle>
      </CardHeader>
  <CardContent className="px-3 md:px-6 max-w-full overflow-hidden">
        {/* If loading or no registrations, let EventList handle empty arrays; we still pass the converted events */}
        <EventList
          events={events}
          processingEvents={processingEvents}
          onInvite={() => { /* no-op for registrations view */ }}
          onUnregister={onUnregister}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          getStatusBadge={getStatusBadge ?? (() => null)}
          getRegistrationStatusBadge={getRegistrationStatusBadge ?? (() => null)}
          canRegister={canRegister ?? (() => false)}
          canUnregister={canUnregister}
          isRegistrationUrgent={isRegistrationUrgent ?? (() => false)}
          onShowCode={onShowCode}
        />
        {events.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="h-12 w-12 bg-white/10 mx-auto mb-4 rounded-full" />
            <p className="text-white/60">No tens cap inscripció activa</p>
            <p className="text-white/40 text-sm mt-2">Explora els esdeveniments disponibles per participar en tornejos</p>
          </div>
        )}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full">
                <div className="bg-white/3 border border-white/6 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,33%)_1fr] gap-0">
                    <div className="p-4 md:p-0">
                      <div className="h-32 md:h-full w-full rounded-md bg-white/5 animate-pulse" />
                    </div>
                    <div className="p-4 md:p-5">
                      <div className="space-y-3">
                        <div className="h-6 w-3/4 rounded-md bg-white/5 animate-pulse" />
                        <div className="h-4 w-2/3 rounded-md bg-white/5 animate-pulse" />
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-24 rounded-full bg-white/5 animate-pulse" />
                          <div className="h-6 w-20 rounded-full bg-white/5 animate-pulse" />
                        </div>
                        <div className="h-3 w-full rounded-md bg-white/5 animate-pulse" />
                        <div className="flex items-center justify-between pt-2">
                          <div className="w-2/3">
                            <div className="h-8 w-full rounded-md bg-white/5 animate-pulse" />
                          </div>
                          <div className="w-1/3 md:w-auto">
                            <div className="h-8 w-28 rounded-md bg-white/5 animate-pulse ml-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
