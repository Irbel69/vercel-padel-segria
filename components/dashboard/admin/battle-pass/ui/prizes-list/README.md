Prizes List components
======================

This folder contains smaller presentational components split from `PrizesList.tsx` to improve maintainability and readability.

Components
- Header.tsx: Top header with title and actions (view toggle, create button).
- Filters.tsx: Search and filter controls; relies on callbacks to update parent state.
- Results.tsx: Renders error/loading/empty states and the grid view. Emits custom events for pagination changes.
- Modals.tsx: Dialogs and confirmation modals for create/edit/delete/toggle actions. Uses `PrizeForm` when appropriate.

Usage
-----
Import from the folder index:

import { Header, Filters, Results, Modals } from './prizes-list';

Pass the necessary props from the parent (`PrizesList.tsx`) — these components are intentionally presentational and do not manage API calls or routing.

Notes
-----
- The `Results` component dispatches `CustomEvent('prizes:page-change', { detail: newPage })` for pagination actions. The parent should listen for this event or provide an alternative handler.
- Keep business logic (API calls, state, handlers) in the parent to avoid duplication.
