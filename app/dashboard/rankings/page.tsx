"use client";

import { Trophy } from "lucide-react";
import { RankingsDashboard } from "@/components/dashboard/RankingsDashboard";

export default function RankingsPage() {
  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="p-2 bg-padel-primary/20 rounded-lg">
          <Trophy className="h-6 w-6 text-padel-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Classificació
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            10 punts per partit guanyat, 3 punts per participació
          </p>
        </div>
      </div>

      {/* Rankings component */}
      <RankingsDashboard />
      
      {/* Explanation */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h2 className="text-white text-lg mb-2">Com funciona el sistema de puntuació?</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 text-sm">
          <li>Cada jugador rep <strong className="text-padel-primary">10 punts</strong> per cada partit guanyat</li>
          <li>Cada jugador rep <strong className="text-padel-primary">3 punts</strong> per cada partit jugat (encara que perdi)</li>
          <li>La posició al rànking es determina pel total de punts acumulats</li>
          <li>En cas d'empat a punts, el jugador amb més partits guanyats queda per davant</li>
          <li>Si l'empat persisteix, el jugador amb més partits jugats queda per davant</li>
        </ul>
      </div>
    </div>
  );
}
