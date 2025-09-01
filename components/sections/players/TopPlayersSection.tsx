"use client";

import { useState } from "react";
import { TopPlayersTicker } from "./TopPlayersTicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Users,
  Star,
  Crown,
  Medal,
  Award,
  Flame,
  Zap,
  Heart,
  Activity,
  Target,
  Shield,
  Swords,
  ArrowUpRight,
  BrainCircuit,
  Wind,
  Gamepad2,
  ChevronRight,
} from "lucide-react";
import { useTopPlayers } from "@/hooks/use-top-players";
import Link from "next/link";

// Map de cualidades -> iconos (para desktop grid)
const qualitiesPool = [
  { name: "Lideratge", icon: Crown },
  { name: "Anticipació", icon: Activity },
  { name: "Potència", icon: Flame },
  { name: "Velocitat", icon: Zap },
  { name: "Resistència", icon: Heart },
  { name: "Reflexos", icon: Activity },
  { name: "Flexibilitat", icon: Wind },
  { name: "Equilibri", icon: Target },
  { name: "Mobilitat", icon: ArrowUpRight },
  { name: "Defensa", icon: Shield },
  { name: "Atac", icon: Swords },
  { name: "Control", icon: BrainCircuit },
  { name: "Col·locació", icon: Target },
  { name: "Volea", icon: Award },
  { name: "Globo", icon: Trophy },
  { name: "Rematada", icon: Flame },
  { name: "Vibora", icon: Zap },
  { name: "Servei", icon: Star },
  { name: "Sortida", icon: ArrowUpRight },
  { name: "Contraatac", icon: Activity },
  { name: "Baixada de pared", icon: Shield },
  { name: "Bandeja", icon: Medal },
  { name: "Comunicació", icon: Users },
  { name: "Adaptació", icon: Wind },
  { name: "X3", icon: Gamepad2 },
];

const getQualityIcon = (qualityName: string) => {
  const quality = qualitiesPool.find((q) => q.name === qualityName);
  return quality ? quality.icon : Star;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <Trophy className="w-5 h-5 text-gray-400" />;
  }
};

const getRankGradient = (rank: number) => {
  switch (rank) {
    case 1:
      return "from-yellow-400/20 to-yellow-600/20 border-yellow-400/30";
    case 2:
      return "from-gray-400/20 to-gray-600/20 border-gray-400/30";
    case 3:
      return "from-amber-400/20 to-amber-600/20 border-amber-400/30";
    default:
      return "from-gray-400/20 to-gray-600/20 border-gray-400/30";
  }
};

export function TopPlayersSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { data: topPlayersData, isLoading, error } = useTopPlayers();
  const topPlayers = topPlayersData?.players || [];

  // Loading
  if (isLoading) {
    return (
      <section id="top-players" className="py-24 relative overflow-visible">
        <div className="container mx-auto px-4 relative z-10">
          <HeaderBlock />
          {/* Mobile skeleton ticker */}
          <div
            className="md:hidden flex gap-3 overflow-hidden mb-10"
            aria-label="Carregant jugadors"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-full bg-white/10 animate-pulse"
              />
            ))}
          </div>
          {/* Desktop skeleton cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-14 md:mx-14">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="relative overflow-hidden border-0"
                style={glassCardStyle}
              >
                <CardContent className="p-6 pt-16">
                  <div className="text-center mb-6">
                    <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-8 w-20 mx-auto" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-10 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="top-players" className="py-24 relative overflow-visible">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <HeaderBlock />
          <p className="text-red-400">
            Error al carregar els jugadors destacats
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="top-players" className="py-24 relative overflow-visible">
      {/* Background decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-padel-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-96 h-96 bg-padel-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-padel-primary/8 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <HeaderBlock />
        {/* Mobile ticker */}
        <div className="md:hidden mb-8">
          <TopPlayersTicker limit={10} />
          <div className="mt-6 text-center">
            <a
              href="#rankings"
              className="inline-block text-sm font-semibold text-padel-primary hover:text-white transition-colors"
            >
              Veure tots els jugadors →
            </a>
          </div>
        </div>
        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-14 md:mx-14">
          {topPlayers.map((player) => {
            const isTop3 = player.rank <= 3;
            const medalClass =
              player.rank === 1
                ? "bg-yellow-400 text-black"
                : player.rank === 2
                ? "bg-slate-300 text-black"
                : "bg-amber-700 text-white";
            const overlayClass =
              player.rank === 1
                ? "bg-yellow-400/6"
                : player.rank === 2
                ? "bg-slate-300/6"
                : "bg-amber-700/6";
            const IconComponent = getRankIcon(player.rank);
            const fullName = `${player.name || ""} ${
              player.surname || ""
            }`.trim();
            const initials = `${player.name?.[0] || ""}${
              player.surname?.[0] || ""
            }`.toUpperCase();
            return (
              <Card
                key={player.id}
                className={`relative overflow-hidden border-0 transition-all duration-500 transform hover:scale-105 cursor-pointer group ${
                  hoveredCard === player.id
                    ? "shadow-2xl shadow-padel-primary/20"
                    : "shadow-lg"
                }`}
                style={glassCardStyle}
                onMouseEnter={() => setHoveredCard(player.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* subtle colored overlay for top3 */}
                {isTop3 && (
                  <div
                    className={`absolute inset-0 pointer-events-none rounded-xl ${overlayClass}`}
                  />
                )}
                {player.isChampion && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-padel-primary/90 text-padel-secondary border-0 font-bold">
                      <Crown className="w-3 h-3 mr-1" /> Campió
                    </Badge>
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getRankGradient(
                      player.rank
                    )} border backdrop-blur-sm`}
                  >
                    {IconComponent}
                  </div>
                </div>
                <CardContent className="p-6 pt-16">
                  <div className="text-center mb-6">
                    <Avatar className="w-20 h-20 mx-auto border-4 border-white/20 shadow-lg mb-4">
                      <AvatarImage
                        src={player.avatar_url || ""}
                        alt={fullName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-padel-primary text-padel-secondary text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {fullName}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Star className="w-4 h-4 text-padel-primary" />
                      <span className="text-2xl font-bold text-padel-primary">
                        {player.score}
                      </span>
                      <span className="text-gray-300 text-sm">punts</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 text-center mb-3">
                      Qualitats destacades
                    </h4>
                    {player.qualities.length > 0 ? (
                      player.qualities.map((quality, idx) => {
                        const QualityIcon = getQualityIcon(quality.name);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 rounded-lg bg-padel-primary/20 flex items-center justify-center flex-shrink-0">
                              <QualityIcon className="w-4 h-4 text-padel-primary" />
                            </div>
                            <span className="text-white text-sm font-medium">
                              {quality.name}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-gray-400 text-sm">
                        No hi ha qualitats assignades
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {/* Bottom CTA (mobile) */}
        <div className="lg:hidden mt-12 text-center">
          <Card className="inline-block border-0" style={bottomCtaStyle}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">
                  Vols ser un top player?
                </h3>
                <p className="text-gray-300 text-lg">
                  Uneix-te als nostres tornejos i demostra el teu talent!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 font-semibold flex-1 py-2"
                  >
                    <Trophy className="w-4 h-4 mr-2" /> Uneix-te
                  </Button>
                  </Link>
                  <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold flex-1 py-2"
                  >
                    <Users className="w-4 h-4 mr-2" /> Veure tots
                  </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Reusable header block
function HeaderBlock() {
  return (
    <div className="text-center mb-12 md:mb-16">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-padel-primary" />
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Top Players
        </h2>
        <Trophy className="w-8 h-8 text-padel-primary" />
      </div>
      <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
        Descobreix els jugadors més destacats de Padel Segrià. Aquests són els
        campions que dominen les pistes amb el seu talent excepcional.
      </p>
    </div>
  );
}

// Shared styles objects
const glassCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "20px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const bottomCtaStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};
