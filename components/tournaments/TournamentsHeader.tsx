"use client";

import React from "react";
import { Target, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  totalEvents?: number | null;
  onOpenJoinCode: () => void;
};

export default function TournamentsHeader({ totalEvents, onOpenJoinCode }: Props) {
  return (
    <div className="relative">
      {/* Background decorative element */}
      <div className="absolute inset-0 bg-gradient-to-r from-padel-primary/5 via-transparent to-padel-primary/5 rounded-2xl blur-3xl -z-10" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6 bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-xl">
        <div className="flex flex-row items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-gradient-to-br from-padel-primary/30 to-padel-primary/10 rounded-xl shadow-lg border border-padel-primary/20">
            <Target className="h-6 w-6 md:h-7 md:w-7 text-padel-primary drop-shadow-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-sm bg-gradient-to-r from-white via-white to-padel-primary bg-clip-text text-transparent">
              Tornejos
            </h1>
            <p className="text-gray-300 text-sm md:text-lg font-medium">Participa en competicions i esdeveniments</p>
          </div>
        </div>

        {/* Enhanced CTA with glow effects */}
        <div className="w-full sm:w-auto flex justify-end">
            <Button
              onClick={onOpenJoinCode}
              size="lg"
              className="w-full sm:w-auto rounded-full px-6 py-3 bg-gradient-to-r from-padel-primary via-padel-primary-light to-padel-primary text-black font-bold shadow-[0_12px_30px_rgba(229,240,0,0.3)] hover:shadow-[0_18px_40px_rgba(229,240,0,0.4)] transform-gpu transition-all hover:-translate-y-1 hover:scale-105 motion-safe:animate-btn-float border border-padel-primary/50"
              aria-label="Unir-me amb codi"
            >
              <Key className="h-5 w-5 mr-2 drop-shadow-sm" />
              <span>Unir-me amb codi</span>
            </Button>
        </div>
      </div>

  
    </div>
  );
}
