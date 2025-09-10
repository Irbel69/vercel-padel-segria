# Hooks del Battle Pass

Aquesta carpeta conté hooks client que obtenen i modifiquen dades del Battle Pass.

Hooks:

- use-battle-pass-progress.ts
  - Proporciona `useBattlePassProgress()` utilitzant @tanstack/react-query.
  - Retorna { data, isLoading, error, refetch } amb la forma:
    - data: { user_points: number; prizes: BattlePassPrizeProgress[]; total_prizes: number }

- use-claim-prize.ts
  - Exposa una mutació per reclamar un premi per id; s'utilitza a `PrizeNode` i `ClaimModal`.

## Flux de dades

- `page.tsx` crida `useBattlePassProgress()` i passa el resultat a `BattlePassTrack` i `UserPointsDisplay`.
- `PrizeNode` desencadena `useClaimPrize()` quan l'usuari confirma la reclamació al `ClaimModal`.

## Notes

- Reintents i backoff configurats per robustesa.
- Temps de caché ajustats per l'ús al dashboard.
