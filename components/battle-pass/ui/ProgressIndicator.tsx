"use client";

import { BattlePassPrizeProgress } from "../hooks/use-battle-pass-progress";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  prizes: BattlePassPrizeProgress[];
  userPoints: number;
  /**
   * When true, prizes are spaced evenly along the track regardless of point gaps.
   * The progress mapping becomes piecewise-linear so the fill advances faster/slower per segment
   * according to the points required between consecutive prizes. This keeps markers aligned with
   * equally spaced cards while preserving relative difficulty between prizes.
   */
  useEqualSpacing?: boolean;
}

// Helper: compute the min and max points across prizes to map to 0..100%
function computePointRange(prizes: BattlePassPrizeProgress[]) {
  const points = prizes.map((p) => p.points_required);
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 100);
  // ensure non-zero span
  return { min, max: Math.max(max, min + 1) };
}

// Build a piecewise-linear mapping from points to percentage where each consecutive prize occupies
// an equal spatial segment. This prevents visual overlap by distributing markers/cards evenly.
function buildEqualSpacingMapper(prizes: BattlePassPrizeProgress[]) {
  if (prizes.length === 0) {
    return {
      toPercent: (x: number) => 0,
      markerPercents: [] as number[],
    };
  }

  // Sort by points to define segments in ascending order
  const sorted = [...prizes].sort(
    (a, b) => a.points_required - b.points_required
  );
  const P = sorted.map((p) => p.points_required);
  const n = P.length;
  const segment = n > 1 ? 1 / (n - 1) : 1; // equal width for each gap

  // Precompute marker percents for each prize in input order, using its rank in the sorted array
  const rankById = new Map<number, number>();
  sorted.forEach((p, i) => rankById.set(p.id, i));
  // Keep a small inset from both ends so progress visually starts before first marker
  const START_OFFSET_PERCENT = 8;
  const usableSpan = 100 - START_OFFSET_PERCENT * 2;
  const markerPercents = prizes.map((p) => {
    const i = rankById.get(p.id) ?? 0;
    return START_OFFSET_PERCENT + i * segment * usableSpan;
  });

  const toPercent = (x: number) => {
  if (n === 1) return 100 - START_OFFSET_PERCENT; // single prize => treat as end inset
  if (x <= P[0]) return START_OFFSET_PERCENT;
  if (x >= P[n - 1]) return 100 - START_OFFSET_PERCENT;

    // Find segment i where P[i] <= x <= P[i+1]
    let i = 0;
    for (; i < n - 1; i++) {
      if (x <= P[i + 1]) break;
    }

    const a = P[i];
    const b = P[i + 1];
    // Avoid divide-by-zero when consecutive prizes have identical points
    const localT = b === a ? (x >= b ? 1 : 0) : (x - a) / (b - a);
    const pos = i * segment + localT * segment;
    return START_OFFSET_PERCENT + pos * usableSpan;
  };

  return { toPercent, markerPercents };
}

export function ProgressIndicator({
  prizes,
  userPoints,
  useEqualSpacing = true,
}: ProgressIndicatorProps) {
  if (prizes.length === 0) return null;

  const { min, max } = computePointRange(prizes);

  // Mapping strategy
  const linearMap = (pts: number) => {
    const clamped = Math.max(min, Math.min(max, pts));
    return ((clamped - min) / (max - min)) * 100;
  };

  const { toPercent, markerPercents } = useEqualSpacing
    ? buildEqualSpacingMapper(prizes)
    : {
        toPercent: linearMap,
        markerPercents: prizes.map((p) => linearMap(p.points_required)),
      };

  const progressPercent = toPercent(userPoints);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 my-5">
      {/* Full-width track background: respects horizontal padding used by container */}
      <div className="absolute left-[112px] right-[112px] md:left-[128px] md:right-[128px] top-1/2 transform -translate-y-1/2 h-2">
        <div className="relative h-1 bg-gray-700/50 rounded-full overflow-visible">
          {/* Active progress */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              "bg-gradient-to-r from-padel-primary via-yellow-400 to-padel-primary",
              "shadow-md shadow-padel-primary/40"
            )}
            style={{ width: `${progressPercent}%` }}
          />

          {/* Shimmer */}
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full opacity-60",
              "bg-gradient-to-r from-transparent via-white/30 to-transparent",
              "pointer-events-none"
            )}
            style={{
              width: `${progressPercent}%`,
              backgroundSize: "200% 100%",
              animation: progressPercent > 0 ? "shimmer 2s infinite" : "none",
            }}
          />
        </div>

        {/* Prize markers positioned along the track based on mapping strategy */}
        <div className="absolute left-0 right-0 top-0 mt-[-8px] pointer-events-none">
          <div className="relative h-0">
            {prizes.map((prize, idx) => {
              const leftPercent = markerPercents[idx];
              const isReached = userPoints >= prize.points_required;

              return (
                <div
                  key={prize.id}
                  style={{ left: `calc(${leftPercent}% - 8px)` }}
                  className={cn(
                    "absolute top-0 w-4 h-4 rounded-full border-2 transform transition-all duration-300",
                    isReached
                      ? "bg-padel-primary border-padel-primary shadow-lg shadow-padel-primary/40"
                      : prize.progress_percentage > 0
                      ? "bg-yellow-600/60 border-yellow-600 shadow-sm"
                      : "bg-gray-700 border-gray-600"
                  )}
                  aria-hidden
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
