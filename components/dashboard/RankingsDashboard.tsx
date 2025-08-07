"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUp, ArrowDown, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import type { RankingPlayer, RankingsResponse } from "@/types/rankings";

export function RankingsDashboard() {
  const { user } = useUser();
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<RankingsResponse["pagination"] | null>(null);

  useEffect(() => {
    fetchRankings(currentPage);
  }, [currentPage]);

  const fetchRankings = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/rankings?page=${page}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar el rànking");
      }

      setRankings(data.players);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching rankings:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
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
            <p className="text-red-400">{error}</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">No hi ha jugadors al rànking</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-white/50 text-sm font-medium px-2 mb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-5 sm:col-span-5">Jugador</div>
              <div className="col-span-2 text-center">Partits</div>
              <div className="col-span-2 text-center">Guanyats</div>
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
                  <div className="col-span-5 sm:col-span-5 flex items-center gap-2">
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
                        {getTrendIcon(player.trend)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-white/70">
                    {player.matches_played}
                  </div>
                  <div className="col-span-2 text-center text-white/70">
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
