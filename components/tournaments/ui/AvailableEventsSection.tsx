"use client";
import {ReactNode} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import EventList from "@/components/tournaments/EventList";
import type { Event, EventsListResponse } from "@/types";

type Props = {
  events: Event[];
  pagination: EventsListResponse["pagination"] | null;
  isEventsLoading: boolean;
  processingEvents: Set<number>;
  onInvite: (id: number) => void;
  onUnregister: (id: number) => void;
  onPageChange: (page: number) => void;
  formatDate: (s: string) => string;
  formatDateTime: (s: string) => string;
  getStatusBadge: (s: string) => ReactNode;
  getRegistrationStatusBadge: (s: string) => ReactNode;
  canRegister: (e: Event) => boolean;
  canUnregister: (e: Event) => boolean;
  isRegistrationUrgent: (deadline: string) => boolean;
  onShowCode?: (id: number) => void;
};

export default function AvailableEventsSection({
  events,
  pagination,
  isEventsLoading,
  processingEvents,
  onInvite,
  onUnregister,
  onPageChange,
  formatDate,
  formatDateTime,
  getStatusBadge,
  getRegistrationStatusBadge,
  canRegister,
  canUnregister,
  isRegistrationUrgent,
  onShowCode,
}: Props) {
  return (
    <Card className="bg-white/5 border-white/10 w-full max-w-full overflow-hidden">
      <CardHeader className="px-3 md:px-6 space-y-2">
        <CardTitle className="text-white text-lg md:text-xl text-center sm:text-left">
          Esdeveniments Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6 max-w-full overflow-hidden">
        {isEventsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-full">
                {/* Card-like skeleton matching EventCard structure: hero + content + progress/actions */}
                <div className="bg-white/3 border border-white/6 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,33%)_1fr] gap-0">
                    <div className="p-4 md:p-0">
                      <Skeleton className="h-40 md:h-full w-full rounded-md" />
                    </div>
                    <div className="p-4 md:p-5">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-2/3 rounded-md" />
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-full rounded-md" />
                        <div className="flex items-center justify-between pt-2">
                          <div className="w-2/3">
                            <Skeleton className="h-8 w-full rounded-md" />
                          </div>
                          <div className="w-1/3 md:w-auto">
                            <Skeleton className="h-8 w-28 rounded-md ml-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No hi ha esdeveniments disponibles</p>
          </div>
        ) : (
          <EventList
            events={events}
            processingEvents={processingEvents}
            onInvite={onInvite}
            onUnregister={onUnregister}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusBadge={getStatusBadge}
            getRegistrationStatusBadge={getRegistrationStatusBadge}
            canRegister={canRegister}
            canUnregister={canUnregister}
            isRegistrationUrgent={isRegistrationUrgent}
            onShowCode={onShowCode}
          />
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-white/10 gap-4">
            <p className="text-white/60 text-sm text-center sm:text-left">
              Pàgina {pagination.currentPage} de {pagination.totalPages}
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange((pagination.currentPage || 1) - 1)}
                disabled={(pagination.currentPage || 1) === 1}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange((pagination.currentPage || 1) + 1)}
                disabled={!pagination.hasMore}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial"
              >
                <span className="hidden sm:inline">Següent</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
