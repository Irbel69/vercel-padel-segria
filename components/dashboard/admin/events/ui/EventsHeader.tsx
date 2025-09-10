import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

interface EventsHeaderProps {
  onCreateClick: () => void;
}

export function EventsHeader({ onCreateClick }: EventsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-padel-primary/20 rounded-lg">
          <Calendar className="h-6 w-6 text-padel-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
            Gestió d&apos;Esdeveniments
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Administra tornejos i competicions
          </p>
        </div>
      </div>
      <Button
        onClick={onCreateClick}
        className="bg-padel-primary text-black hover:bg-padel-primary/90 w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        <span className="sm:hidden">Nou</span>
        <span className="hidden sm:inline">Nou Esdeveniment</span>
      </Button>
    </div>
  );
}