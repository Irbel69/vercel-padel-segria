// Main exports for Battle Pass admin components

// Main components
export { PrizesList } from "./ui/PrizesList";
export { PrizeCard } from "./ui/PrizeCard";
export { PrizeForm } from "./ui/PrizeForm";
export { PrizeTable } from "./ui/PrizeTable";

// Hooks
export { 
  useBattlePassPrizes, 
  useCreatePrize, 
  useUpdatePrize, 
  useDeletePrize,
  useReorderPrizes 
} from "./hooks/use-battle-pass-prizes";
export { usePrizeForm } from "./hooks/use-prize-form";
export { useViewMode } from "./hooks/use-view-mode";

// Types
export type { BattlePassPrize, BattlePassPrizesResponse } from "./hooks/use-battle-pass-prizes";
export type { PrizeFormData } from "./hooks/use-prize-form";
export type { ViewMode } from "./hooks/use-view-mode";