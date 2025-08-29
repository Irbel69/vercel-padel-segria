"use client";

import { useEffect, useState } from "react";
import type { Event, EventsListResponse } from "@/types";
import { useEventsList } from "@/hooks/use-events";

export function useEventsPagination(limit = 10) {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<EventsListResponse["pagination"] | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);

  const { data: eventsData, isLoading: isEventsLoading } = useEventsList({
    page: currentPage,
    limit,
  });

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData.events);
      setPagination(eventsData.pagination);
    }
  }, [eventsData]);

  return {
    events,
    pagination,
    isEventsLoading,
    currentPage,
    setPage: setCurrentPage,
  };
}
