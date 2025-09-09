"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  GripVertical, 
  Package,
  Monitor,
  MapPin,
  Coins,
  Eye,
  EyeOff
} from "lucide-react";
import { BattlePassPrize } from "../hooks/use-battle-pass-prizes";

interface PrizeCardProps {
  prize: BattlePassPrize;
  onEdit: (prize: BattlePassPrize) => void;
  onDelete: (prize: BattlePassPrize) => void;
  onToggleActive: (prize: BattlePassPrize) => void;
  onClick?: (prize: BattlePassPrize) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  index?: number;
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

const tierColors = {
  bronze: "from-amber-500/20 to-amber-600/20 border-amber-500/30",
  silver: "from-slate-400/20 to-slate-500/20 border-slate-400/30", 
  gold: "from-yellow-400/20 to-yellow-500/20 border-yellow-400/30",
  platinum: "from-purple-400/20 to-purple-500/20 border-purple-400/30",
} as const;

// tiers removed; keep function placeholder for compatibility
function getTierInfo(_: number) {
  return { name: "", color: "from-black/0 to-black/0" };
}

export function PrizeCard({ 
  prize, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onClick,
  isDragging = false, 
  dragHandleProps,
  index = 0
  , togglingPrizeId = null
}: PrizeCardProps) {
  const tierInfo = getTierInfo((prize as any).tier);
  const PrizeTypeIcon = prize.prize_type ? prizeTypeIcons[prize.prize_type] : undefined;
  // Resolve image_url which may be either a public URL or a storage path/path-with-bucket
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const BUCKET = "images";
  function resolveImageUrl(raw?: string | null) {
    if (!raw) return null;
    // If already an absolute URL (including blob: previews), return as-is
    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://") ||
      raw.startsWith("blob:")
    )
      return raw;
    // Strip leading slashes
    let path = raw.replace(/^\/+/, "");
    // If stored value already contains the bucket prefix, remove it
    if (path.startsWith(`${BUCKET}/`)) {
      path = path.slice(BUCKET.length + 1);
    } else if (path.startsWith(`storage/v1/object/public/${BUCKET}/`)) {
      // path may already include the storage prefix
      path = path.slice((`storage/v1/object/public/${BUCKET}/`).length);
    }
    if (!SUPABASE_URL) return null;
    return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${path}`;
  }
  
  const hasStock = prize.stock_quantity !== undefined && prize.stock_quantity !== null;
  const isOutOfStock = hasStock && prize.stock_quantity <= 0;
  const stockWarning = hasStock && prize.stock_quantity <= 5 && prize.stock_quantity > 0;

  return (
  <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -4 }}
      className={`group ${isDragging ? "opacity-50 scale-95" : ""}`}
    >
  <Card onClick={() => onClick && onClick(prize)} className={`relative overflow-hidden bg-gradient-to-br ${tierInfo.color} border backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer`}>
        {/* Drag Handle */}
        {dragHandleProps && (
          <div 
            {...dragHandleProps}
            className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <div className="p-1 rounded bg-white/10 backdrop-blur-sm">
              <GripVertical className="h-3 w-3 text-white/60" />
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1">
            {!prize.is_active && (
              <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                <EyeOff className="h-3 w-3 mr-1" />
                Inactiu
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                Esgotat
              </Badge>
            )}
            {stockWarning && (
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Poc estoc
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {/* Prize Image */}
                <div className="relative h-32 md:h-40 bg-white/5 overflow-hidden">
            {prize.image_url ? (
                <Image
                src={resolveImageUrl(prize.image_url) || prize.image_url || ""}
                alt={prize.name || (prize as any).title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-white/10">
                {PrizeTypeIcon ? (
                  <PrizeTypeIcon className="h-8 w-8 md:h-12 md:w-12 text-white/40" />
                ) : (
                  <Package className="h-8 w-8 md:h-12 md:w-12 text-white/40" />
                )}
              </div>
            )}
            
              {/* Tier removed */}
          </div>

          {/* Prize Info */}
          <div className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm md:text-base leading-tight line-clamp-2">
                  {prize.name || (prize as any).title}
                </h3>
                {prize.description && (
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {prize.description}
                  </p>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="text-white/50">Punts requerits</div>
                  <div className="font-medium text-padel-primary">
                    {(
                      (prize as any).required_points ??
                      (prize as any).points_required ??
                      (prize as any).pointsRequired ??
                      0
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-white/50">Reclamats</div>
                  <div className="font-medium text-white">
                    {prize.claimed_count}
                    {hasStock && `/${prize.stock_quantity}`}
                  </div>
                </div>
              </div>

              {/* Prize Details */}
              <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-white/60">
                    {PrizeTypeIcon ? (
                      <PrizeTypeIcon className="h-3 w-3" />
                    ) : (
                      <Package className="h-3 w-3" />
                    )}
                    <span className="capitalize">{prizeTypeLabels[prize.prize_type ?? "physical"] || "desconegut"}</span>
                  </div>
                {prize.prize_value && (
                  <div className="text-white/80 font-medium">
                    {prize.prize_value}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm" 
                  onClick={() => onToggleActive(prize)}
                  className="h-7 px-2 text-white/60 hover:text-white hover:bg-white/10"
                >
                    {togglingPrizeId === prize.id ? (
                      <svg className="h-3 w-3 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : prize.is_active ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-red-400" />
                    )}
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(prize)}
                    className="h-7 px-2 text-white/60 hover:text-padel-primary hover:bg-padel-primary/10"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(prize)}
                    className="h-7 px-2 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}