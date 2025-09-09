# Components UI del Battle Pass

Aquesta carpeta conté components presentacionals per a l'experiència del Battle Pass. Són responsive, accessibles i pensats primer per mòbil amb scroll-snap per la pista horitzontal.

Components:

- BattlePassTrack.tsx
  - Renderitza la pista horitzontal de recompenses amb scroll-snap i navegació per teclat (ArrowLeft/Right, Home/End).
  - Props: { prizes: BattlePassPrizeProgress[]; userPoints: number; isLoading?: boolean }
  - A11y: role="region" amb aria-label, anell de focus visible i instruccions sr-only.
  - Dades: purament presentacionals; l'estat i la càrrega de dades es gestionen a la pàgina.

- PrizeNode.tsx
  - Una targeta de recompensa única amb estil per nivells (bronze/plata/or), estats (bloquejat/reclamable/reclamat) i un botó de reclamació opcional.
  - Accepta atributs HTML de div; l'arrel suporta atributs data- (p.ex. data-prize-node) i snap-center.
  - Props: { prize, index, totalPrizes } & HTMLAttributes<HTMLDivElement>.

- ProgressIndicator.tsx
  - Línia de progrés de fons i punts de premi amb shimmer animat.
  - Props: { prizes, userPoints, useEqualSpacing? }.
  - El padding de la línia coincideix amb el padding responsive de la pista per evitar overflow.

- UserPointsDisplay.tsx
  - Targeta resum compacta que mostra els punts actuals i el percentatge de completat.
  - Props: { userPoints, totalPrizes?, completedPrizes?, className? }.

- ClaimModal.tsx
  - Diàleg de confirmació per reclamar un premi.
  - Props: { isOpen, onClose, onConfirm, prize, isLoading? }.

Notes:
- Les tokens visuals provenen de classes Tailwind i la paleta del projecte (padel-primary).
- Motion: transicions subtils; respecta prefers-reduced-motion evitant animacions pesades.

## Ús

A `app/dashboard/battle-pass/page.tsx` les dades es carreguen mitjançant `useBattlePassProgress()` i es passen a `BattlePassTrack` i `UserPointsDisplay`.

```tsx
// Simplificat
<BattlePassTrack prizes={data.prizes} userPoints={data.user_points} isLoading={isLoading} />
```

## Accessibilitat

- La pista és navegable amb teclat i descrita per lectors de pantalla.
- Els estils de focus són visibles.
- Les imatges tenen alt significatiu; les partícules decoratives no són necessàries per a l'operació.

## Comportament responsive

- Disseny mobile-first; les targetes es fan més estretes per sota de `md` per evitar overflow.
- Scroll-snap a la pista horitzontal amb `snap-center` per a cada node de premi.

## Algorisme de layout (sense solapament, marcadors alineats)

Per evitar solapaments visuals quan diversos premis tenen `points_required` molt propers o idèntics, la pista utilitza un mapeig de separació igual amb una funció de progrés piecewise-linear:

- L'espai horitzontal entre el primer i l'últim premi es divideix en segments iguals per parells consecutius, així les targetes i marcadors es distribueixen de forma uniforme i no xoquen.
- L'omplert de progrés i la posició de l'usuari respecten els punts reals avançant proporcionalment dins de cada segment segons la diferència de punts entre els dos premis del segment.
- Les targetes es centren sota els seus marcadors corresponents amb `left: {percent}%` i `transform: translateX(-50%)`, mantenint el punt alineat amb el centre de la targeta en tots els breakpoints.

Aquesta aproximació preserva la percepció de dificultat entre gaps desiguals mentre garanteix llegibilitat i separació dels objectius.
