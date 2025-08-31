# Dashboard Components

This folder contains the page-specific UI components for the Dashboard. The goal is to keep `app/dashboard/page.tsx` minimal and move presentation logic into small, reusable components.

## Files

- `ui/stats-header.tsx` — Header card showing the user's name, badges, membership year, and score. Responsive and uses subtle, consistent styling with bookings.
- `ui/stats-grid.tsx` — Compact 3-tile statistics grid for matches won, played, and win percentage. Uses CountUp animations.
- `ui/qualities.tsx` — Displays up to 3 highlighted player qualities with icons. Includes an empty state.
- `ui/quality-icons.ts` — Maps quality names to lucide-react icons and exports a `getQualityIcon` helper.

## Data Flow

`app/dashboard/page.tsx` passes already-fetched data (user profile, stats, qualities) down to these components via props. No data fetching occurs inside these components.

## Usage

Example (simplified):

```tsx
import StatsHeader from "@/components/dashboard/ui/stats-header";
import StatsGrid from "@/components/dashboard/ui/stats-grid";
import Qualities from "@/components/dashboard/ui/qualities";

// ... inside page component render
<StatsHeader userProfile={userProfile} userScore={userScore} />
<StatsGrid matchesWon={matchesWon} matchesPlayed={matchesPlayed} winPercentage={winPercentage} />
<Qualities userQualities={userQualities} />
```

These components focus on visual consistency (ring, radius, neutral backgrounds) with the bookings section.
