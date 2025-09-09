"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";




type Claimer = {
  user_id: string;
  claimed_at: string;
  email?: string | null;
  name?: string | null;
  surname?: string | null;
};

async function fetchClaimers(prizeId: number) {
  const res = await fetch(`/api/admin/battle-pass/prizes/${prizeId}/claimers`);
  if (!res.ok) throw new Error("Failed to fetch claimers");
  const json = await res.json();
  // API returns { claimers: Claimer[] }
  return (json?.claimers ?? []) as Claimer[];
}

export default function PrizeClaimersModal({ prizeId, open, onOpenChange }: { prizeId: number | null; open: boolean; onOpenChange: (v: boolean) => void; }) {
  const router = useRouter();
  // Capture full location (pathname + search + hash) so callers can return to the exact place
  const currentLocation =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search + window.location.hash
      : "";
  const { data, isLoading, error } = useQuery<Claimer[], Error>({
    queryKey: ["admin", "prize-claimers", prizeId],
    queryFn: () => fetchClaimers(prizeId as number),
    enabled: !!prizeId && open,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reclamacions</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {error && <div className="text-red-400">Error carregant reclamacions</div>}
          {!isLoading && data && data.length === 0 && <div className="text-white/60">Encara no hi ha reclamacions</div>}
          {!isLoading && data && data.length > 0 && (
            <div className="space-y-2">
              {data.map((c) => (
                <div key={c.user_id} className="p-2 bg-white/5 rounded flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{c.name} {c.surname}</div>
                    <div className="text-xs text-white/60">{c.email}</div>
                    <div className="text-xs text-white/40">Reclamat: {new Date(c.claimed_at).toLocaleString()}</div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/dashboard/users/${c.user_id ?? ""}?from=${encodeURIComponent(
                          currentLocation
                        )}`}
                        onClick={() => onOpenChange(false)}
                        aria-label={`Veure usuari ${c.name ?? ""} ${c.surname ?? ""}`}
                      >
                        Veure
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tancar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
