"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Medal,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRankings } from "@/hooks/use-rankings";
import type { RankingPlayer } from "@/hooks/use-rankings";

const DEFAULT_LIMIT = 10;

export function RankingsSection() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useRankings(page, DEFAULT_LIMIT);
  const players = data?.players ?? [];
  const pagination = data?.pagination ?? null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center justify-center w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-padel-primary text-black font-bold text-xs sm:text-sm">
            1
          </span>
        );
      case 2:
        return <Medal className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" />;
      default:
        return (
          <span className="text-gray-400 font-bold text-xs sm:text-sm">#{rank}</span>
        );
    }
  };

  const getTrendIcon = (trend: RankingPlayer["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-green-400" />;
      case "down":
        return (
          <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-red-400 rotate-180" />
        );
      default:
        return (
          <div className="w-3 sm:w-4 h-3 sm:h-4 bg-gray-400 rounded-full opacity-50" />
        );
    }
  };

  const handlePrev = () => {
    if (!pagination) return;
    const newPage = Math.max(1, page - 1);
    if (newPage !== page) setPage(newPage);
  };

  const handleNext = () => {
    if (!pagination) return;
    const newPage = page + 1;
    if (pagination.hasMore) setPage(newPage);
  };

  return (
    <section>
      <div className="container mx-auto px-3 sm:px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Trophy className="w-6 sm:w-8 h-6 sm:h-8 text-padel-primary" />
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
              Classificació Global
            </h2>
            <Trophy className="w-6 sm:w-8 h-6 sm:h-8 text-padel-primary" />
          </div>
          {pagination && (
            <p className="text-xs sm:text-sm text-gray-300">
              <Badge className="bg-padel-primary/20 text-padel-primary border border-padel-primary/20 text-xs sm:text-sm">
                {pagination.totalPlayers} jugadors
              </Badge>
            </p>
          )}
        </div>

        {/* Rankings */}
        <Card
          className="mb-4 sm:mb-6 border-0 rounded-xl sm:rounded-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-4 sm:p-6 text-center text-white/70 text-sm sm:text-base">
                  Carregant...
                </div>
              ) : error ? (
                <div className="p-4 sm:p-6 text-center text-red-400 text-sm sm:text-base">
                  {String(error)}
                </div>
              ) : (
                <>
                  {/* Mobile card list (<480px) */}
                  <div className="xs:hidden divide-y divide-white/10">
                    {players.map((player: RankingPlayer) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getRankIcon(player.ranking_position)}
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gray-600 text-white flex-shrink-0">
                            {`${player.name?.[0] ?? ""}${player.surname?.[0] ?? ""}`}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate">
                              {player.name} {player.surname}
                            </p>
                            <div className="text-xs text-white/60 flex items-center gap-1">
                              {getTrendIcon(player.trend)}
                              <span>Tendència</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-padel-primary font-bold text-base">
                            {player.total_points}
                          </span>
                          <div className="text-[10px] text-white/50">Punts</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table for >= xs (>=480px) */}
                  <div className="hidden xs:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                          <TableHead className="text-gray-300 font-semibold py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm">
                            Pos
                          </TableHead>
                          <TableHead className="text-gray-300 font-semibold py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">
                            Jugador
                          </TableHead>
                          <TableHead className="text-gray-300 font-semibold py-3 sm:py-4 text-center text-xs sm:text-sm">
                            Punts
                          </TableHead>
                          <TableHead className="text-gray-300 font-semibold py-3 sm:py-4 text-center text-xs sm:text-sm hidden xs:table-cell">
                            Tendència
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player: RankingPlayer) => (
                          <TableRow
                            key={player.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <TableCell className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="flex items-center gap-1 sm:gap-2">
                                {getRankIcon(player.ranking_position)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold bg-gray-600 text-white flex-shrink-0">
                                  {`${player.name?.[0] ?? ""}${player.surname?.[0] ?? ""}`}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white text-xs sm:text-sm truncate">
                                    {player.name} {player.surname}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 sm:py-4 text-center">
                              <span className="text-padel-primary font-bold text-xs sm:text-sm">
                                {player.total_points}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 sm:py-4 text-center hidden xs:table-cell">
                              {getTrendIcon(player.trend)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={pagination.currentPage === 1}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4 mr-1 sm:mr-0" />
              <span className="sm:hidden">Anterior</span>
            </Button>
            <p className="text-white/70 text-xs sm:text-sm text-center">
              Pàgina {pagination.currentPage} de {pagination.totalPages}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!pagination.hasMore}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
            >
              <span className="sm:hidden">Següent</span>
              <ChevronRight className="w-4 h-4 ml-1 sm:ml-0" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
