"use client";

import React from "react";
import { Search, RefreshCw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  filters: any;
  onSearchChange: (v: string) => void;
  onFilterChange: (k: string, v: any) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
  refetch: () => void;
  isLoading: boolean;
}

export function Filters({ filters, onSearchChange, onFilterChange, clearFilters, activeFiltersCount, refetch, isLoading }: Props) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
        <Input
          placeholder="Cerca per nom o descripció..."
          defaultValue={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Select
          value={filters.prize_type || "all"}
          onValueChange={(value) => onFilterChange("prize_type", value === "all" ? undefined : value)}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Tots els tipus" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/20">
            <SelectItem value="all" className="text-white">Tots els tipus</SelectItem>
            <SelectItem value="physical" className="text-white">Físics</SelectItem>
            <SelectItem value="digital" className="text-white">Digitals</SelectItem>
            <SelectItem value="experience" className="text-white">Experiències</SelectItem>
            <SelectItem value="currency" className="text-white">Moneda</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.is_active?.toString() || "all"}
          onValueChange={(value) => onFilterChange("is_active", value === "all" ? undefined : value === "true")}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Tots els estats" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/20">
            <SelectItem value="all" className="text-white">Tots els estats</SelectItem>
            <SelectItem value="true" className="text-white">Actius</SelectItem>
            <SelectItem value="false" className="text-white">Inactius</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={`${filters.sort_by}-${filters.sort_order}`}
          onValueChange={(value) => {
            const [sort_by, sort_order] = value.split("-") as any;
            onFilterChange("sort_by", sort_by);
            onFilterChange("sort_order", sort_order);
          }}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/20">
            <SelectItem value="display_order-asc" className="text-white">Ordre personalitzat</SelectItem>
            <SelectItem value="required_points-asc" className="text-white">Punts (menor a major)</SelectItem>
            <SelectItem value="required_points-desc" className="text-white">Punts (major a menor)</SelectItem>
            <SelectItem value="claimed_count-desc" className="text-white">Més reclamats</SelectItem>
            <SelectItem value="created_at-desc" className="text-white">Més recents</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/60 hover:text-white hover:bg-white/10">
              Netejar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading} className="text-white/60 hover:text-white hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/60" />
          <span className="text-sm text-white/60">{activeFiltersCount} filtre{activeFiltersCount !== 1 ? "s" : ""} actiu{activeFiltersCount !== 1 ? "s" : ""}</span>
          {filters.search && (
            <Badge variant="secondary" className="bg-padel-primary/20 text-padel-primary">&quot;{filters.search}&quot;</Badge>
          )}
        </div>
      )}
    </div>
  );
}
