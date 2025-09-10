"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trophy, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrizeCard } from "../PrizeCard";
import type { BattlePassPrize } from "../../hooks/use-battle-pass-prizes";

interface Props {
  viewMode: "grid" | "table";
  prizes: BattlePassPrize[];
  isLoading: boolean;
  error: any;
  pagination: any;
  refetch: () => void;
  onEdit: (p: BattlePassPrize) => void;
  onDelete: (p: BattlePassPrize) => void;
  onToggleActive: (p: BattlePassPrize) => void;
  togglingPrizeId: number | null;
  onPrizeClick?: (p: BattlePassPrize) => void;
}

export function Results({ viewMode, prizes, isLoading, error, pagination, refetch, onEdit, onDelete, onToggleActive, togglingPrizeId, onPrizeClick }: Props) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Premis del Battle Pass</span>
          {pagination && (
            <Badge variant="secondary" className="bg-padel-primary/20 text-padel-primary">{pagination.totalPrizes} premis</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error carregant els premis: {error.message}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-80 w-full" />))}
              </div>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))
            )}
          </div>
        )}

        {!isLoading && !error && prizes.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 mb-2">Encara no hi ha premis creats</p>
            <p className="text-sm text-white/40 mb-4">Crea el primer premi per començar</p>
          </div>
        )}

        {!isLoading && !error && prizes.length > 0 && (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {prizes.map((prize, index) => (
                  <PrizeCard key={prize.id} prize={prize} index={index} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} togglingPrizeId={togglingPrizeId} onClick={onPrizeClick} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* PrizeTable is relatively heavy and is dynamically imported by the parent */}
                {/* Parent should render PrizeTable when viewMode === 'table' */}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-white/10 gap-4">
            <p className="text-white/60 text-sm">Pàgina {pagination.currentPage} de {pagination.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('prizes:page-change', { detail: pagination.currentPage - 1 }))} disabled={pagination.currentPage === 1} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('prizes:page-change', { detail: pagination.currentPage + 1 }))} disabled={!pagination.hasMore} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Següent
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
