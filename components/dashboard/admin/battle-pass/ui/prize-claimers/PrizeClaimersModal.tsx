"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X, Phone, Mail, User, Calendar, ShirtIcon, Filter } from "lucide-react";
import { toast } from "sonner";
import type { PrizeClaimersResponse, PrizeClaimer, DeliveryStatus, UpdateDeliveryStatusRequest } from "@/types";

// Fetch claimers with optional filtering
async function fetchClaimers(prizeId: number, status?: DeliveryStatus, search?: string): Promise<PrizeClaimer[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  
  const res = await fetch(`/api/admin/battle-pass/prizes/${prizeId}/claimers?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch claimers");
  const json: PrizeClaimersResponse = await res.json();
  return json.claimers ?? [];
}

// Update delivery status
async function updateDeliveryStatus(prizeId: number, claimId: number, status: DeliveryStatus): Promise<void> {
  const body: UpdateDeliveryStatusRequest & { claim_id: number } = {
    claim_id: claimId,
    delivery_status: status,
    delivered_at: status === "delivered" ? new Date().toISOString() : null,
  };

  const res = await fetch(`/api/admin/battle-pass/prizes/${prizeId}/claimers`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update delivery status");
  }
}

// Status badge variants
const getStatusBadgeProps = (status: DeliveryStatus) => {
  switch (status) {
    case "pending_delivery":
      return { variant: "secondary" as const, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" };
    case "delivered":
      return { variant: "secondary" as const, className: "bg-green-500/10 text-green-500 border-green-500/20" };
    case "delivery_failed":
      return { variant: "destructive" as const };
    default:
      return { variant: "outline" as const };
  }
};

const getStatusLabel = (status: DeliveryStatus) => {
  switch (status) {
    case "pending_delivery":
      return "Pendent d'entrega";
    case "delivered":
      return "Entregat";
    case "delivery_failed":
      return "Entrega fallida";
    default:
      return status;
  }
};

interface PrizeClaimersModalProps {
  prizeId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrizeClaimersModal({ prizeId, open, onOpenChange }: PrizeClaimersModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Local state for filters
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusUpdate, setStatusUpdate] = useState<{
    claimId: number;
    currentStatus: DeliveryStatus;
    newStatus: DeliveryStatus;
  } | null>(null);

  // Capture full location for navigation back
  const currentLocation = typeof window !== "undefined" 
    ? window.location.pathname + window.location.search + window.location.hash 
    : "";

  // Query for claimers data
  const { data: allClaimers, isLoading, error } = useQuery<PrizeClaimer[], Error>({
    queryKey: ["admin", "prize-claimers", prizeId],
    queryFn: () => fetchClaimers(prizeId as number),
    enabled: !!prizeId && open,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Filter claimers based on local filters
  const filteredClaimers = useMemo(() => {
    if (!allClaimers) return [];

    let filtered = [...allClaimers];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(claimer => claimer.delivery_status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(claimer => {
        const name = `${claimer.name || ""} ${claimer.surname || ""}`.toLowerCase();
        const email = (claimer.email || "").toLowerCase();
        const phone = (claimer.phone || "").toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query);
      });
    }

    return filtered;
  }, [allClaimers, statusFilter, searchQuery]);

  // Mutation for updating delivery status
  const updateStatusMutation = useMutation({
    mutationFn: ({ claimId, status }: { claimId: number; status: DeliveryStatus }) =>
      updateDeliveryStatus(prizeId as number, claimId, status),
    onSuccess: () => {
      toast.success("Estat d'entrega actualitzat correctament");
      queryClient.invalidateQueries({ queryKey: ["admin", "prize-claimers", prizeId] });
      setStatusUpdate(null);
    },
    onError: (error: Error) => {
      toast.error(`Error actualitzant l'estat: ${error.message}`);
    },
  });

  const handleStatusChange = (claimId: number, currentStatus: DeliveryStatus, newStatus: DeliveryStatus) => {
    setStatusUpdate({ claimId, currentStatus, newStatus });
  };

  const confirmStatusUpdate = () => {
    if (statusUpdate) {
      updateStatusMutation.mutate({
        claimId: statusUpdate.claimId,
        status: statusUpdate.newStatus,
      });
    }
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  // Get stats for display
  const stats = useMemo(() => {
    if (!allClaimers) return null;
    const total = allClaimers.length;
    const pending = allClaimers.filter(c => c.delivery_status === "pending_delivery").length;
    const delivered = allClaimers.filter(c => c.delivery_status === "delivered").length;
    const failed = allClaimers.filter(c => c.delivery_status === "delivery_failed").length;
    return { total, pending, delivered, failed };
  }, [allClaimers]);

  if (!prizeId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-black/90 border-white/20 text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">Reclamacions del premi</DialogTitle>
            {stats && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="bg-white/5">
                  Total: {stats.total}
                </Badge>
                <Badge {...getStatusBadgeProps("pending_delivery")}>
                  Pendents: {stats.pending}
                </Badge>
                <Badge {...getStatusBadgeProps("delivered")}>
                  Entregats: {stats.delivered}
                </Badge>
                <Badge {...getStatusBadgeProps("delivery_failed")}>
                  Fallides: {stats.failed}
                </Badge>
              </div>
            )}
          </DialogHeader>

          {/* Filters Section */}
          <div className="flex-shrink-0 border-b border-white/10 pb-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Cercar per nom, email o telèfon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-white/40 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DeliveryStatus | "all")}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/20 text-white">
                    <SelectItem value="all">Tots els estats</SelectItem>
                    <SelectItem value="pending_delivery">Pendent d'entrega</SelectItem>
                    <SelectItem value="delivered">Entregat</SelectItem>
                    <SelectItem value="delivery_failed">Entrega fallida</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(statusFilter !== "all" || searchQuery) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="border-white/20 text-white hover:bg-white/5"
                  >
                    Netejar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full bg-white/5" />
                ))}
              </div>
            )}

            {error && (
              <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-4">
                Error carregant reclamacions: {error.message}
              </div>
            )}

            {!isLoading && !error && filteredClaimers.length === 0 && (
              <div className="text-white/60 text-center py-8">
                {allClaimers?.length === 0 
                  ? "Encara no hi ha reclamacions" 
                  : "No es troben reclamacions amb els filtres aplicats"}
              </div>
            )}

            {!isLoading && !error && filteredClaimers.length > 0 && (
              <div className="space-y-3">
                {filteredClaimers.map((claimer) => (
                  <div
                    key={claimer.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-white flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {claimer.name} {claimer.surname}
                            </h3>
                            {claimer.email && (
                              <p className="text-sm text-white/60 flex items-center gap-2 mt-1">
                                <Mail className="h-3 w-3" />
                                {claimer.email}
                              </p>
                            )}
                          </div>
                          <Badge {...getStatusBadgeProps(claimer.delivery_status)}>
                            {getStatusLabel(claimer.delivery_status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-white/40">
                          {claimer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {claimer.phone}
                            </div>
                          )}
                          {claimer.shirt_size && (
                            <div className="flex items-center gap-1">
                              <ShirtIcon className="h-3 w-3" />
                              Talla: {claimer.shirt_size}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Reclamat: {new Date(claimer.claimed_at).toLocaleDateString()}
                          </div>
                          {claimer.delivered_at && (
                            <div className="flex items-center gap-1 text-green-400">
                              <Calendar className="h-3 w-3" />
                              Entregat: {new Date(claimer.delivered_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {/* Status Update */}
                        <Select
                          value={claimer.delivery_status}
                          onValueChange={(newStatus: DeliveryStatus) =>
                            handleStatusChange(claimer.id, claimer.delivery_status, newStatus)
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-44 bg-white/5 border-white/20 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 border-white/20 text-white">
                            <SelectItem value="pending_delivery">Pendent d'entrega</SelectItem>
                            <SelectItem value="delivered">Entregat</SelectItem>
                            <SelectItem value="delivery_failed">Entrega fallida</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* View User */}
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/dashboard/users/${claimer.user_id}?from=${encodeURIComponent(currentLocation)}`}
                            onClick={() => onOpenChange(false)}
                            aria-label={`Veure usuari ${claimer.name ?? ""} ${claimer.surname ?? ""}`}
                            className="text-white/60 hover:text-white"
                          >
                            Veure usuari
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-white/10 pt-4">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="border-white/20 text-white">
              Tancar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={!!statusUpdate} onOpenChange={() => setStatusUpdate(null)}>
        <AlertDialogContent className="bg-black/90 border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar canvi d'estat</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {statusUpdate && (
                <>
                  Estàs segur que vols canviar l'estat d'entrega de{" "}
                  <span className="font-medium">
                    "{getStatusLabel(statusUpdate.currentStatus)}"
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    "{getStatusLabel(statusUpdate.newStatus)}"
                  </span>
                  ?
                  {statusUpdate.newStatus === "delivered" && (
                    <div className="mt-2 text-green-400">
                      S'establirà automàticament la data d'entrega actual.
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-white/20 text-white hover:bg-white/5"
              disabled={updateStatusMutation.isPending}
            >
              Cancel·lar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusUpdate}
              disabled={updateStatusMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {updateStatusMutation.isPending ? "Actualitzant..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}