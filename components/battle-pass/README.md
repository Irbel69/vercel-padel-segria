# Components del Battle Pass (client)

Aquest directori conté els components per al sistema de Battle Pass orientat al client, dissenyats amb una estètica de tipus joc inspirada en Brawl Stars i Fortnite.

## Resum

El sistema de Battle Pass permet als usuaris veure el seu progrés dins d'una pista de recompenses estacional, consultar els premis disponibles segons els punts acumulats i reclamar les recompenses desbloquejades mitjançant una interfície pensada per a mòbil.

## Components

### Components principals

#### **BattlePassTrack.tsx**
- Contenidor principal amb desplaçament horitzontal per a l'experiència del Battle Pass
- Inclou auto-scroll per posicionar l'usuari al seu progrés actual
- Disseny responsive optimitzat per a interaccions tàctils
- Gestiona estats de càrrega amb esquelets animats

#### **PrizeNode.tsx**
- Estacions de premi individuals al llarg de la pista
- Estil dinàmic per nivells (Bronze/Plata/Or) segons la posició
- Estats visuals: bloquejat, disponible, reclamat
- Reclamació interactiva de premis amb efectes i animacions
- Indicadors de progrés per premis parcialment completats

#### **ProgressIndicator.tsx**
```markdown
# Battle Pass components (client)

This directory contains client-side components for a Battle Pass system. The UI is game-inspired (think vibrant styles similar to Brawl Stars or Fortnite) and is optimized for a mobile-first experience.

## Overview

The Battle Pass lets users view their progress on a seasonal reward track, inspect rewards available for the points they've earned, and claim unlocked rewards using a mobile-friendly interface.

## Components

### Core components

#### **BattlePassTrack.tsx**
- Main horizontally-scrollable container for the Battle Pass experience
- Auto-scrolls to keep the user centered on their current progress
- Responsive layout optimized for touch interactions
- Shows loading skeletons while data loads

#### **PrizeNode.tsx**
- Individual reward nodes along the track
- Visual styles by tier (Bronze / Silver / Gold) based on position
- Visual states: locked, available, claimed
- Interactive prize claiming with animations and effects
- Partial-completion progress indicators for some rewards

#### **ProgressIndicator.tsx**
- Visual progress line that links prize nodes
- Animated fill based on unlocked prizes
- Shimmer/pulse effects to increase visual polish
- Connection points that indicate completion state

#### **ClaimModal.tsx**
- Modal dialog used to confirm claiming a prize
- Animated prize preview with particle effects
- Loading states during the claim process
- Success / error feedback integrated

#### **UserPointsDisplay.tsx**
- Displays the user's current points and a brief progress summary
- Progress stats (completed / total prizes)
- Animated progress bar with completion markers
- Responsive design with subtle glassmorphism styling

## Hooks

### Data hooks

#### **use-battle-pass-progress.ts**
- React Query hook to fetch the user's Battle Pass progress
- Returns user points, prize list with progress info, and completion metadata
- Handles caching, error states and background refetching
- Tuned with stale-time and retry logic

#### **use-claim-prize.ts**
- Mutation hook for claiming available prizes
- Optimistic updates and automatic cache invalidation
- Toast notifications for success / error states
- Loading states exposed for the UI

## Features

### Game-like design
- Vibrant visual style inspired by battle-royale games
- Tier system for visual progression: Bronze, Silver, Gold
- Particle effects and highlights for important moments
- Dynamic gradient backgrounds per tier
- Bold headings and playful typography for prize titles

### User experience
- Auto-scroll that brings the user to their current progress position
- Mobile-first, touch-optimized horizontal scrolling
- Clear visual states for locked / available / claimed
- Smooth micro-interactions to increase engagement
- Multiple progress visualizations available

### Technical qualities
- Performance-minded rendering and smooth scrolling
- Well-defined error states and recovery
- Accessibility considered (WCAG AA+ aims, keyboard navigation)
- Responsive across breakpoints
- Real-time UI updates on prize claims

## Design system integration

### Colors
- Primary: Padel Segrià yellow (#e5f000) for active states
- Tier colors:
  - Bronze: amber / warm tonal variants
  - Silver: slate / gray variants
  - Gold: emphasized yellow variants
- State colors: Green (claimed), Gray (locked), Yellow (available)

### Typography
- Headings: bold, game-style font treatments for prize titles
- Body: clean, readable text for descriptions
- Numbers: emphasized style to highlight points and stats

### Spacing & layout
- 8px base spacing unit for a consistent rhythm
- Horizontal track layout optimized for mobile scrolling
- Card-like prize designs with rounded corners and soft shadows
- Safe-area aware layouts for notches and mobile nav

## Usage example

```tsx
import { BattlePassTrack, UserPointsDisplay, useBattlePassProgress } from "@/components/battle-pass";

function BattlePassPage() {
  const { data, isLoading, error } = useBattlePassProgress();

  return (
    <div className="space-y-6">
      <UserPointsDisplay
        userPoints={data?.user_points || 0}
        totalPrizes={data?.total_prizes || 0}
        completedPrizes={data?.prizes.filter((p) => p.can_claim).length || 0}
      />

      <BattlePassTrack
        prizes={data?.prizes || []}
        userPoints={data?.user_points || 0}
        isLoading={isLoading}
      />
    </div>
  );
}
```

## API integration

### Endpoints
- `GET /api/battle-pass/progress` - Returns the user's current progress
- `POST /api/battle-pass/claim` - Claim a specific prize

Security and storage:
- Claims are stored in `public.battle_pass_user_prizes` with RLS enforcing that users can only read/insert their own claims and only when eligible (active prize and enough points). The API uses the `claim_battle_pass_prize` RPC to create a claim safely.

### Data flow
1. The page mounts and fetches the user's progress
2. Components render according to the returned state
3. Auto-scroll adjusts to the user's position on the track
4. The user can claim available prizes
5. Cache is updated and the UI refreshes

## Mobile optimizations

### Touch interactions
- Thumb-friendly targets and spacing
- Smooth horizontal scrolling
- Tactile feedback on prize nodes
- Gesture-friendly navigation

### Responsive behavior
- Mobile: full-width horizontal track
- Tablet: centered track with touch support
- Desktop: mouse wheel / trackpad support for horizontal scroll
- Safe areas supported for notches and mobile nav

## Performance considerations

- Lazy-load prize images
- Optimized scrolling
- Minimize re-renders via React Query and memoization
- Loading skeletons for async states
- Efficient animation implementations

## Future improvements

- Claim history and receipts
- Seasonal rotation of Battle Pass content
- Achievements integration
- Social sharing of earned prizes
- Advanced tiered unlocks
```