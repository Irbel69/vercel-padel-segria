"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event, EventsListResponse } from "@/types";

type Status = "open" | "closed" | "soon" | "";

// Fetch helpers
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || "Network error");
  }
  return data as T;
}

// Public events (homepage)
export function usePublicEvents({ limit = 4 }: { limit?: number } = {}) {
  return useQuery<{ events: Event[] }, Error>({
    queryKey: ["events", "public", { limit }],
    queryFn: () => fetchJSON<{ events: Event[] }>(`/api/events/public?limit=${limit}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    meta: {
      onError: (err: unknown) => {
        console.error("usePublicEvents error", err);
      },
    },
  });
}

// Dashboard events (paginated list)
export function useEventsList(params: { page?: number; limit?: number; status?: Status; search?: string }) {
  const { page = 1, limit = 10, status = "", search = "" } = params || {};
  const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) sp.set("status", status);
  if (search) sp.set("search", search);

  return useQuery<EventsListResponse, Error>({
    queryKey: ["events", "list", { page, limit, status, search }],
    queryFn: () => fetchJSON<EventsListResponse>(`/api/events?${sp.toString()}`),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    meta: {
      onError: (err: unknown) => {
        console.error("useEventsList error", err);
      },
    },
  });
}

// Mutations helpers for register/unregister that invalidate the list
export function useRegisterForEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => {
      return fetchJSON<{ ok: true }>(`/api/events/${eventId}/register`, { method: "POST" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}

export function useUnregisterFromEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => {
      return fetchJSON<{ ok: true }>(`/api/events/${eventId}/register`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}

// Pair invite creation
export function useCreatePairInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { eventId: number; email?: string; generateCodeOnly?: boolean; forceNew?: boolean }) => {
      const { eventId, email, generateCodeOnly, forceNew } = params;
      return fetchJSON<{ data?: { short_code?: string } }>(`/api/events/${eventId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, generateCodeOnly: !!generateCodeOnly, forceNew: !!forceNew }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "list"] });
    },
  });
}
