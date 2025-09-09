"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { BattlePassPrize } from "../hooks/use-battle-pass-prizes";

interface StatusBadgeProps {
  prize: BattlePassPrize;
  variant?: "default" | "compact";
}

export function StatusBadge({ prize, variant = "default" }: StatusBadgeProps) {
  const hasStock = prize.stock_quantity !== undefined && prize.stock_quantity !== null;
  const isOutOfStock = hasStock && prize.stock_quantity <= 0;
  const stockWarning = hasStock && prize.stock_quantity <= 5 && prize.stock_quantity > 0;

  if (!prize.is_active) {
    return (
      <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
        <EyeOff className="h-3 w-3 mr-1" />
        {variant === "compact" ? "Inactiu" : "Premi inactiu"}
      </Badge>
    );
  }

  if (isOutOfStock) {
    return (
      <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {variant === "compact" ? "Esgotat" : "Estoc esgotat"}
      </Badge>
    );
  }

  if (stockWarning) {
    return (
      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {variant === "compact" ? "Poc estoc" : "Estoc baix"}
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
      <CheckCircle className="h-3 w-3 mr-1" />
      {variant === "compact" ? "Actiu" : "Disponible"}
    </Badge>
  );
}