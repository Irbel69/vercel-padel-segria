"use client";

import { useState, useEffect } from "react";
import type { Event, EventsListResponse } from "@/types";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<
    EventsListResponse["pagination"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const fetchEvents = async (page: number = 1, searchTerm: string = "") => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/admin/events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error carregant els esdeveniments");
      }

      const typedData = data as EventsListResponse;
      setEvents(typedData.events);
      setPagination(typedData.pagination);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchEvents(1, search);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchEvents(newPage, search);
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm("Estàs segur que vols eliminar aquest esdeveniment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        fetchEvents(currentPage, search);
        return;
      }

      if (data.error === "tournament_has_registrations") {
        const registrationsCount = data.registrations_count;
        const confirmed = confirm(
          `Aquest torneig té ${registrationsCount} inscripció${
            registrationsCount > 1 ? "s" : ""
          }.\n\n` +
            "S'eliminaran també les reserves de tots els usuaris.\n" +
            "Es recomana comunicar-ho als usuaris inscrits prèviament.\n\n" +
            "Estàs segur que vols continuar amb l'eliminació?"
        );

        if (!confirmed) {
          return;
        }

        const forceResponse = await fetch(
          `/api/admin/events/${eventId}?force=true`,
          {
            method: "DELETE",
          }
        );

        const forceData = await forceResponse.json();

        if (!forceResponse.ok) {
          throw new Error(forceData.error || "Error eliminant l'esdeveniment");
        }

        fetchEvents(currentPage, search);
        return;
      }

      throw new Error(data.error || "Error eliminant l'esdeveniment");
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
    }
  };

  return {
    events,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    currentPage,
    fetchEvents,
    handlePageChange,
    handleDelete,
    setError,
  };
}