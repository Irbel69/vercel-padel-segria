"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useRankings } from "@/hooks/use-rankings";
import type { RankingsResponseLocal as RankingsResponse } from "@/hooks/use-rankings";

export function RankingsDashboard() {
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useRankings(currentPage, 10);
  const rankings = data?.players ?? [];
  const pagination: RankingsResponse["pagination"] | null = data?.pagination ?? null;

  const renderRecentForm = (form: ("W"|"L")[]) => {
    const max = 5;
    const items = form.slice(0, max);
    const placeholders = Array.from({ length: Math.max(0, max - items.length) });
    return (
      <div className="flex items-center gap-1">
        {items.map((r, i) => (
          <span key={i} className={`w-2.5 h-2.5 rounded-sm ${r === 'W' ? 'bg-green-500' : 'bg-red-500'}`} />
        ))}
        {placeholders.map((_, i) => (
          <span key={`p-${i}`} className="w-2.5 h-2.5 rounded-sm bg-white/20" />
        ))}
      </div>
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-lg md:text-xl">Rànkings</span>
          {pagination && (
            <Badge
              variant="secondary"
              className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto"
            >
              {pagination.totalPlayers} jugadors
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-400">{String(error)}</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">No hi ha jugadors al rànking</p>
          </div>
        ) : (
          <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-white/50 text-sm font-medium px-2 mb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-4 sm:col-span-4">Jugador</div>
              <div className="col-span-2 text-center">Forma</div>
              <div className="col-span-2 text-center">Partits</div>
              <div className="col-span-1 text-center">Guanyats</div>
              <div className="col-span-2 text-center">Punts</div>
            </div>
            
            {rankings.map((player) => {
              const isCurrentUser = user?.id === player.id;
              return (
                <div 
                  key={player.id} 
                  className={`grid grid-cols-12 items-center gap-2 p-3 rounded-lg ${
                    isCurrentUser 
                      ? "bg-padel-primary/10 border border-padel-primary/30" 
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="col-span-1 font-bold text-white">
                    {player.ranking_position}
                  </div>
                  <div className="col-span-4 sm:col-span-4 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar_url || ""} />
                      <AvatarFallback>
                        {((player.name || "")[0] || "") + ((player.surname || "")[0] || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">
                        {player.name} {player.surname}
                      </div>
                      <div className="flex items-center text-xs text-white/50">
                        {renderRecentForm(player.recent_form)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    {renderRecentForm(player.recent_form)}
                  </div>
                  <div className="col-span-2 text-center text-white/70">
                    {player.matches_played}
                  </div>
                  <div className="col-span-1 text-center text-white/70">
                    {player.matches_won}
                  </div>
                  <div className="col-span-2 text-center font-bold text-padel-primary">
                    {player.total_points}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-white/10 gap-4">
                <p className="text-white/60 text-sm text-center sm:text-left">
                  Pàgina {pagination.currentPage} de {pagination.totalPages}
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Anterior</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasMore}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial"
                  >
                    <span className="hidden sm:inline mr-1">Següent</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
