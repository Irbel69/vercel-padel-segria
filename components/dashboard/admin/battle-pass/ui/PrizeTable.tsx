"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Trash2,
  Package,
  Monitor,
  MapPin,
  Coins,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { BattlePassPrize } from "../hooks/use-battle-pass-prizes";

interface PrizeTableProps {
  prizes: BattlePassPrize[];
  onEdit: (prize: BattlePassPrize) => void;
  onDelete: (prize: BattlePassPrize) => void;
  onToggleActive: (prize: BattlePassPrize) => void;
  togglingPrizeId?: number | null;
}

const prizeTypeIcons = {
  physical: Package,
  digital: Monitor,
  experience: MapPin,
  currency: Coins,
} as const;

const prizeTypeLabels = {
  physical: "Físic",
  digital: "Digital",
  experience: "Experiència",
  currency: "Moneda",
} as const;

export function PrizeTable({ prizes, onEdit, onDelete, onToggleActive, togglingPrizeId }: PrizeTableProps) {
  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-white/20 hover:bg-white/5">
            <TableHead className="text-white/70 w-12"></TableHead>
            <TableHead className="text-white/70">Premi</TableHead>
            <TableHead className="text-white/70 text-center">Punts</TableHead>
            <TableHead className="text-white/70 text-center">Tipus</TableHead>
            <TableHead className="text-white/70 text-center">Estoc</TableHead>
            <TableHead className="text-white/70 text-center">Reclamats</TableHead>
            <TableHead className="text-white/70 text-center">Estat</TableHead>
            <TableHead className="text-white/70 text-right">Accions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prizes.map((prize, index) => {
            // tiers removed
            const PrizeTypeIcon = prize.prize_type ? prizeTypeIcons[prize.prize_type] : undefined;
            const hasStock = prize.stock_quantity !== undefined && prize.stock_quantity !== null;
            const isOutOfStock = hasStock && prize.stock_quantity <= 0;
            const stockWarning = hasStock && prize.stock_quantity <= 5 && prize.stock_quantity > 0;

            return (
              <motion.tr
                key={prize.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="border-white/10 hover:bg-white/5 group"
              >
                {/* Drag Handle */}
                <TableCell className="py-4">
                  <div className="opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-white/40" />
                  </div>
                </TableCell>

                {/* Prize Info */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                      {prize.image_url ? (
                        <Image
                          src={prize.image_url}
                          alt={prize.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          {PrizeTypeIcon ? (
                            <PrizeTypeIcon className="h-5 w-5 text-white/40" />
                          ) : (
                            <Package className="h-5 w-5 text-white/40" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white text-sm leading-tight">
                        {prize.name || (prize as any).title}
                      </div>
                      {prize.description && (
                        <div className="text-xs text-white/60 mt-1 line-clamp-1">
                          {prize.description}
                        </div>
                      )}
                      {prize.prize_value && (
                        <div className="text-xs text-padel-primary mt-1 font-medium">
                          {prize.prize_value}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Points */}
                <TableCell className="py-4 text-center">
                  <div className="font-medium text-white">
                    {(
                      (prize as any).required_points ??
                      (prize as any).points_required ??
                      (prize as any).pointsRequired ??
                      0
                    ).toLocaleString()}
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell className="py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {PrizeTypeIcon ? (
                      <PrizeTypeIcon className="h-4 w-4 text-white/60" />
                    ) : (
                      <Package className="h-4 w-4 text-white/60" />
                    )}
                    <span className="text-sm text-white/80">
                      {prizeTypeLabels[prize.prize_type ?? "physical"] || prize.prize_type || "Desconegut"}
                    </span>
                  </div>
                </TableCell>

                {/* Stock */}
                <TableCell className="py-4 text-center">
                  {hasStock ? (
                    <div className="space-y-1">
                      <div className={`font-medium ${
                        isOutOfStock ? "text-red-400" :
                        stockWarning ? "text-yellow-400" : "text-white"
                      }`}>
                        {prize.stock_quantity}
                      </div>
                      {isOutOfStock && (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                          Esgotat
                        </Badge>
                      )}
                      {stockWarning && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
                          Poc estoc
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-white/60 text-sm">Il·limitat</span>
                  )}
                </TableCell>

                {/* Claimed */}
                <TableCell className="py-4 text-center">
                  <div className="font-medium text-white">
                    {prize.claimed_count}
                  </div>
                  {hasStock && (
                    <div className="text-xs text-white/50">
                      {Math.round((prize.claimed_count / (prize.stock_quantity || 1)) * 100)}%
                    </div>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="py-4 text-center">
                  {prize.is_active ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Eye className="h-3 w-3 mr-1" />
                      Actiu
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inactiu
                    </Badge>
                  )}
                </TableCell>

                {/* Actions */}
                  <TableCell className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(prize)}
                      className="h-8 px-2 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      {togglingPrizeId === prize.id ? (
                        <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      ) : (
                        prize.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(prize)}
                      className="h-8 px-2 text-white/60 hover:text-padel-primary hover:bg-padel-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(prize)}
                      className="h-8 px-2 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}