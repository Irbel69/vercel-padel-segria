"use client";

// Card wrapper removed: Page will provide the outer Card
import CountUp from "react-countup";
import { Trophy, Activity, BarChart3, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatsGridProps = {
  userProfile: any;
  matchesPlayed: number;
  matchesWon: number;
  winPercentage: number;
  userScore: number;
};

export default function StatsGrid({
  userProfile,
  matchesPlayed,
  matchesWon,
  winPercentage,
  userScore,
  animate = true,
}: StatsGridProps & { animate?: boolean }) {
  return (
    <>
      {/* Mobile Header */}
      <div className="block md:hidden space-y-4">
        <div className="p-4 px-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-padel-primary/20 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-padel-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">
                {userProfile.name} {userProfile.surname}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {userProfile.is_admin && (
                  <Badge className="bg-padel-primary/20 text-padel-primary border-padel-primary/30 text-xs">Admin</Badge>
                )}
                <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 text-xs">
                  {new Date(userProfile.created_at).getFullYear()}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {animate ? (
                  <CountUp start={0} end={userScore} duration={2.5} delay={0.5} key={String(userScore)} />
                ) : (
                  <span>{userScore}</span>
                )}
              </div>
              <div className="text-xs text-white/60">Punts</div>
            </div>
          </div>
        </div>

        {/* Mobile Stats Grid - 1x3 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Trophy className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">
              {animate ? (
                <CountUp start={0} end={matchesWon} duration={2.5} delay={0.7} key={String(matchesWon)} />
              ) : (
                <span>{matchesWon}</span>
              )}
            </div>
            <div className="text-xs text-white/60">Guanyats</div>
          </div>

          <div className="p-3 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">
              {animate ? (
                <CountUp start={0} end={matchesPlayed} duration={2.5} delay={0.9} key={String(matchesPlayed)} />
              ) : (
                <span>{matchesPlayed}</span>
              )}
            </div>
            <div className="text-xs text-white/60">Jugats</div>
          </div>

          <div className="p-3 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">
              {animate ? (
                <CountUp start={0} end={winPercentage} duration={2.5} delay={1.1} suffix="%" key={String(winPercentage)} />
              ) : (
                <span>{winPercentage}%</span>
              )}
            </div>
            <div className="text-xs text-white/60">Victòries</div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-padel-primary/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-padel-primary" />
            </div>
            <div className="flex-1">
              <div className="text-2xl text-white mb-2 font-semibold">{userProfile.name} {userProfile.surname}</div>
              <div className="flex flex-wrap items-center gap-3">
                {userProfile.is_admin && (
                  <Badge className="bg-padel-primary/20 text-padel-primary border-padel-primary/30">Administrador</Badge>
                )}
                <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30">
                  <Calendar className="w-3 h-3 mr-1" />
                  Membre des de {new Date(userProfile.created_at).getFullYear()}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                <CountUp end={userScore} duration={2.5} delay={0.5} />
              </div>
              <div className="text-sm text-white/60">Puntuació</div>
            </div>
          </div>

          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {animate ? (
                    <CountUp start={0} end={matchesWon} duration={2.5} delay={0.7} key={String(matchesWon)} />
                  ) : (
                    <span>{matchesWon}</span>
                  )}
                </div>
                <div className="text-sm text-white/60">Partits Guanyats</div>
              </div>

              <div className="text-center p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {animate ? (
                    <CountUp start={0} end={matchesPlayed} duration={2.5} delay={0.9} key={String(matchesPlayed)} />
                  ) : (
                    <span>{matchesPlayed}</span>
                  )}
                </div>
                <div className="text-sm text-white/60">Partits Jugats</div>
              </div>

              <div className="text-center p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {animate ? (
                    <CountUp start={0} end={winPercentage} duration={2.5} delay={1.1} suffix="%" key={String(winPercentage)} />
                  ) : (
                    <span>{winPercentage}%</span>
                  )}
                </div>
                <div className="text-sm text-white/60">% Victòries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
