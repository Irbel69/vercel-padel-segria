"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BattlePassPrize {
  id: number;
  name: string;
  description?: string;
  required_points: number;
  prize_type: "physical" | "digital" | "experience" | "currency";
  prize_value?: string;
  image_url?: string;
  original_image_url?: string | null; // newly added to allow re-cropping from source
  is_active: boolean;
  display_order: number;
  stock_quantity?: number;
  claimed_count: number;
  created_at: string;
  updated_at: string;
}

export interface BattlePassPrizesResponse {
  prizes: BattlePassPrize[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPrizes: number;
    hasMore: boolean;
  };
}

interface PrizesParams {
  page?: number;
  limit?: number;
  search?: string;
  prize_type?: string;
  is_active?: boolean;
}

// Fetch helper
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Network error");
  }
  return data as T;
}

// Main prizes query hook
export function useBattlePassPrizes(params: PrizesParams = {}) {
  const { page = 1, limit = 20, search = "", prize_type, is_active } = params;
  
  const searchParams = new URLSearchParams({ 
    page: String(page), 
    limit: String(limit) 
  });
  
  if (search) searchParams.set("search", search);
  if (prize_type) searchParams.set("prize_type", prize_type);
  if (is_active !== undefined) searchParams.set("is_active", String(is_active));

  return useQuery<BattlePassPrizesResponse, Error>({
  queryKey: ["battle-pass-prizes", { page, limit, search, prize_type, is_active }],
    queryFn: () => fetchJSON<BattlePassPrizesResponse>(`/api/admin/battle-pass/prizes?${searchParams}`),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    meta: {
      onError: (err: unknown) => {
        console.error("useBattlePassPrizes error:", err);
      },
    },
  });
}

// Create prize mutation
export function useCreatePrize() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prizeData: Omit<BattlePassPrize, "id" | "claimed_count" | "created_at" | "updated_at">) => {
      return fetchJSON<{ data: BattlePassPrize }>("/api/admin/battle-pass/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prizeData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battle-pass-prizes"] });
    },
    meta: {
      onError: (err: unknown) => {
        console.error("useCreatePrize error:", err);
      },
    },
  });
}

// Update prize mutation
export function useUpdatePrize() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...prizeData }: Partial<BattlePassPrize> & { id: number }) => {
      return fetchJSON<{ data: BattlePassPrize }>(`/api/admin/battle-pass/prizes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prizeData),
      });
    },
    // Optimistic update so toggling visibility feels instant
    onMutate: async (variables: Partial<BattlePassPrize> & { id: number }) => {
      const { id, ...patch } = variables;

      await queryClient.cancelQueries({ queryKey: ["battle-pass-prizes"] });

      const previous = queryClient.getQueryData<any>(["battle-pass-prizes"]);

      // Apply optimistic update: toggle is_active on the matching prize(s)
      if (previous?.prizes) {
        const newData = {
          ...previous,
          prizes: previous.prizes.map((p: BattlePassPrize) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        };

        queryClient.setQueryData(["battle-pass-prizes"], newData);
      }

      return { previous };
    },
    onError: (err: unknown, variables, context: any) => {
      // rollback
      if (context?.previous) {
        queryClient.setQueryData(["battle-pass-prizes"], context.previous);
      }
      console.error("useUpdatePrize error:", err);
    },
    onSuccess: (response) => {
      // Update cache with server response for the single prize to avoid flicker
      try {
        const serverPrize = response?.data;
        const current = queryClient.getQueryData<any>(["battle-pass-prizes"]);
        if (current?.prizes && serverPrize) {
          const newData = {
            ...current,
            prizes: current.prizes.map((p: BattlePassPrize) => (p.id === serverPrize.id ? serverPrize : p)),
          };
          queryClient.setQueryData(["battle-pass-prizes"], newData);
        }
      } catch (e) {
        // ignore cache update errors
      }

      queryClient.invalidateQueries({ queryKey: ["battle-pass-prizes"] });
    },
    meta: {
      onError: (err: unknown) => {
        console.error("useUpdatePrize error (meta):", err);
      },
    },
  });
}

// Delete prize mutation
export function useDeletePrize() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prizeId: number) => {
      return fetchJSON<{ success: true }>(`/api/admin/battle-pass/prizes/${prizeId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battle-pass-prizes"] });
    },
    meta: {
      onError: (err: unknown) => {
        console.error("useDeletePrize error:", err);
      },
    },
  });
}

// Reorder prizes mutation
export function useReorderPrizes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Array<{ id: number; display_order: number }>) => {
      return fetchJSON<{ success: true }>("/api/admin/battle-pass/prizes/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battle-pass-prizes"] });
    },
    meta: {
      onError: (err: unknown) => {
        console.error("useReorderPrizes error:", err);
      },
    },
  });
}