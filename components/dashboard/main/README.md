This folder contains small, focused components extracted from the dashboard page to improve readability and reuse.

Files
- `stats-grid.tsx` - Renders the mobile and desktop statistics header and summary cards (matches, wins, win % and score).
- `qualities-list.tsx` - Shows user qualities with icons and empty state.
- `contact-info.tsx` - Displays email and phone contact cards.

Usage
Each component expects simple props matching the shapes used by `app/dashboard/page.tsx`. They are intentionally typed as `any` to avoid complex type churn when extracting.

Notes
- Visual styles and tokens are preserved from the original page.
- Components are client components ("use client") as they display dynamic data and use client-only libs like `react-countup`.
