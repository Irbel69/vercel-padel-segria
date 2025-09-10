"use client";

import React from "react";
import { Trophy, Grid3X3, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  viewMode: "grid" | "table";
  toggleViewMode: () => void;
  onCreate: () => void;
}

export function Header({ viewMode, toggleViewMode, onCreate }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-padel-primary/20 rounded-lg">
          <Trophy className="h-6 w-6 text-padel-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gestió del Battle Pass</h1>
          <p className="text-white/60">Administra els premis i recompenses del Battle Pass</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
        </Button>
        <Button onClick={onCreate} className="bg-padel-primary text-black hover:bg-padel-primary/90 font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Nou Premi
        </Button>
      </div>
    </div>
  );
}
