import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { EventCard } from "./EventCard";
import type { Event, EventsListResponse } from "@/types";

interface EventsListProps {
  events: Event[];
  pagination: EventsListResponse["pagination"] | null;
  isLoading: boolean;
  search: string;
  onPageChange: (page: number) => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
  onParticipants: (event: Event) => void;
}

export function EventsList({
  events,
  pagination,
  isLoading,
  search,
  onPageChange,
  onEdit,
  onDelete,
  onParticipants,
}: EventsListProps) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-lg md:text-xl">Esdeveniments</span>
          {pagination && (
            <Badge
              variant="secondary"
              className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto"
            >
              {pagination.totalEvents} esdeveniments
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">
              {search
                ? "No s'han trobat esdeveniments"
                : "No hi ha esdeveniments creats"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={onEdit}
                onDelete={onDelete}
                onParticipants={onParticipants}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-white/10 gap-4">
            <p className="text-white/60 text-sm text-center sm:text-left">
              Pàgina {pagination.currentPage} de {pagination.totalPages}
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
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