"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Trophy,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  RefreshCw,
  Loader
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBattlePassPrizes, useUpdatePrize, useCreatePrize, useDeletePrize, BattlePassPrize } from "../hooks/use-battle-pass-prizes";
import { useViewMode } from "../hooks/use-view-mode";
import { PrizeCard } from "./PrizeCard";
import { Header, Filters, Results, Modals } from "./prizes-list";
const PrizeClaimersModal = React.lazy(() => import("./prize-claimers/PrizeClaimersModal").then(m => ({ default: m.default })));
// Lazy-load heavier components to reduce initial bundle size for the tab
const PrizeTable = dynamic(() => import("./PrizeTable").then(m => m.PrizeTable), {
  ssr: false,
  loading: () => <div className="py-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 w-full my-2 bg-white/5 rounded" />)}</div>,
});

const PrizeForm = dynamic(() => import("./PrizeForm").then(m => m.PrizeForm), {
  ssr: false,
  loading: () => <div className="p-6">Loading form...</div>,
});
import { usePrizeForm } from "../hooks/use-prize-form";

interface SearchFilters {
  search: string;
  prize_type?: string;
  is_active?: boolean;
  sort_by: "required_points" | "claimed_count" | "display_order" | "created_at";
  sort_order: "asc" | "desc";
}

const defaultFilters: SearchFilters = {
  search: "",
  prize_type: undefined,
  is_active: undefined,
  sort_by: "display_order",
  sort_order: "asc",
};

export function PrizesList() {
  const { toast } = useToast();
  const { viewMode, toggleViewMode } = useViewMode();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<BattlePassPrize | null>(null);
  const [deletingPrize, setDeletingPrize] = useState<BattlePassPrize | null>(null);
  const [confirmTogglePrize, setConfirmTogglePrize] = useState<BattlePassPrize | null>(null);
  // Track which prize is currently being toggled (id), so buttons can show loading per-row/card
  const [togglingPrizeId, setTogglingPrizeId] = useState<number | null>(null);
  
  // Debounced search
  // Use ReturnType<typeof setTimeout> to avoid referencing NodeJS global types which may not be
  // defined in the linting environment.
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Query params
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: viewMode === "grid" ? 12 : 20,
    search: filters.search,
    prize_type: filters.prize_type,
    is_active: filters.is_active,
  }), [currentPage, viewMode, filters]);
  
  // Hooks
  const { data, isLoading, error, refetch } = useBattlePassPrizes(queryParams);
  const updatePrize = useUpdatePrize();
  const createPrize = useCreatePrize();
  const deletePrize = useDeletePrize();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  
  const prizes = data?.prizes || [];
  const pagination = data?.pagination;
  const [selectedPrizeId, setSelectedPrizeId] = useState<number | null>(null);
  const [showClaimersModal, setShowClaimersModal] = useState(false);

  // Prefetch PrizeForm module on mount so dialogs open instantly
  React.useEffect(() => {
    // Dynamically import to warm module cache; ignore errors
    import("./PrizeForm").catch(() => {});
  }, []);

  // Filter handlers
  const handleSearchChange = (value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setCurrentPage(1);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  // CRUD handlers
  const handleCreatePrize = () => {
    // Ensure form module is loaded into the module cache before showing modal
    import("./PrizeForm").then(() => setShowCreateModal(true));
  };

  const handleEditPrize = (prize: BattlePassPrize) => {
    // Load the form module before opening the edit modal so the form is already cached
    console.log("[PrizesList] handleEditPrize ->", prize?.id, prize?.name);
    import("./PrizeForm").then(() => setEditingPrize(prize));
  };

  const handleDeletePrize = (prize: BattlePassPrize) => {
    setDeletingPrize(prize);
  };

  const handleToggleActive = async (prize: BattlePassPrize) => {
    // If we're going to deactivate (hide) the prize, ask for confirmation first
    if (prize.is_active) {
      setConfirmTogglePrize(prize);
      return;
    }

    // Activating - perform directly (optimistic update will make it instant)
    setTogglingPrizeId(prize.id);
    try {
      await updatePrize.mutateAsync({ id: prize.id, is_active: !prize.is_active });
      toast({
        title: "Premi activat",
        description: `${prize.name} ha estat activat correctament.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No s'ha pogut actualitzar l'estat del premi.",
      });
    } finally {
      setTogglingPrizeId(null);
    }
  };

  const handleConfirmToggle = async () => {
    if (!confirmTogglePrize) return;

    const prize = confirmTogglePrize;
    setTogglingPrizeId(prize.id);
    try {
      await updatePrize.mutateAsync({ id: prize.id, is_active: false });
      toast({
        title: "Premi desactivat",
        description: `${prize.name} ha estat desactivat correctament.`,
      });
      setConfirmTogglePrize(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No s'ha pogut desactivar el premi.",
      });
    } finally {
      setTogglingPrizeId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPrize) return;
    
    try {
      await deletePrize.mutateAsync(deletingPrize.id);
      
      toast({
        title: "Premi eliminat",
        description: `${deletingPrize.name} ha estat eliminat correctament.`,
      });
      
      setDeletingPrize(null);
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: "No s'ha pogut eliminar el premi.",
      });
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Listen for Results pagination events (dispatched by Results component)
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'number') handlePageChange(detail);
    };
    // Avoid casting to the global EventListener type which can trigger no-undef in some lint configs.
    window.addEventListener('prizes:page-change', handler as unknown as EventListenerOrEventListenerObject);
    return () => window.removeEventListener('prizes:page-change', handler as unknown as EventListenerOrEventListenerObject);
  }, []);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.prize_type) count++;
    if (filters.is_active !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      <Header viewMode={viewMode} toggleViewMode={toggleViewMode} onCreate={handleCreatePrize} />

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <Filters
            filters={filters}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            clearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
            refetch={refetch}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Results: grid view is rendered here; table view (PrizeTable) still rendered inline below when needed */}
      <Results
        viewMode={viewMode}
        prizes={prizes}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        refetch={refetch}
        onEdit={handleEditPrize}
        onDelete={handleDeletePrize}
        onToggleActive={handleToggleActive}
        togglingPrizeId={togglingPrizeId}
        onPrizeClick={(p) => { setSelectedPrizeId(p.id); setShowClaimersModal(true); }}
      />

      {/* If table view is selected, render PrizeTable below Results so it can be dynamically loaded */}
      {viewMode === 'table' && !isLoading && !error && prizes.length > 0 && (
        <div>
          <PrizeTable
            prizes={prizes}
            onEdit={handleEditPrize}
            onDelete={handleDeletePrize}
            onToggleActive={handleToggleActive}
            togglingPrizeId={togglingPrizeId}
          />
        </div>
      )}

      <Modals
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        editingPrize={editingPrize}
        setEditingPrize={setEditingPrize}
        deletingPrize={deletingPrize}
        setDeletingPrize={setDeletingPrize}
        confirmTogglePrize={confirmTogglePrize}
        setConfirmTogglePrize={setConfirmTogglePrize}
        createPrize={createPrize}
        updatePrize={updatePrize}
        deletePrize={deletePrize}
        isSubmittingForm={isSubmittingForm}
        togglingPrizeId={togglingPrizeId}
      />
      {/* Prize claimers modal */}
      {selectedPrizeId !== null && (
        // Dynamically import to keep initial bundle small
        <React.Suspense fallback={null}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          { /* @ts-ignore-next-line */ }
          <PrizeClaimersModal prizeId={selectedPrizeId} open={showClaimersModal} onOpenChange={(v: boolean) => { if (!v) setSelectedPrizeId(null); setShowClaimersModal(v); }} />
        </React.Suspense>
      )}
    </div>
  );
}