# tournaments components

This folder contains small, focused React components and hooks used by the dashboard tournaments page located at `app/dashboard/tournaments/page.tsx`.

Purpose
- Extract visual/UI pieces from the large `page.tsx` to make the page easier to read, test and maintain.
- Keep business logic (data fetching, mutations, and most state) in `page.tsx` while the components focus on presentation and callbacks.

Files
- `TournamentsHeader.tsx` — Header and top controls.
  - Props: `{ totalEvents?: number | null, onOpenJoinCode: () => void }`
  - Renders the page title, description, join-by-code button and optional total events badge.

- `EventList.tsx` — Renders a list of events (mobile + desktop layouts).
  - Props: {
    - `events: Event[]`
    - `processingEvents: Set<number>`
    - `onInvite: (eventId: number) => void`
    - `onUnregister: (eventId: number) => void`
    - `formatDate: (s: string) => string`
    - `formatDateTime: (s: string) => string`
    - `getStatusBadge: (s: string) => React.ReactNode`
    - `getRegistrationStatusBadge: (s: string) => React.ReactNode`
    - `canRegister: (e: Event) => boolean`
    - `canUnregister: (e: Event) => boolean`
    - `isRegistrationUrgent: (s: string) => boolean`
  }
  - Responsibilities: render each event UI and call callbacks for actions (invite/unregister). Keeps markup for responsive UI.

  - Props: {
    - `registrations: Registration[]`
    - `isLoading: boolean`
    - `processingEvents: Set<number>`
    - `onUnregister: (eventId: number) => void`
    - `formatDate: (s: string) => string`
    - `formatDateTime: (s: string) => string`
    - `canUnregister: (e: any) => boolean`
  }
  - Responsibilities: show loading / empty-state / list of registrations and trigger unregister requests.

- `ui/EventCard.tsx` — Mobile-first event card with hero image/map overlay, status badges, capacity pill, chips, progress and CTAs.
  - Props: {
    - `event: Event`
    - `processingEvents: Set<number>`
    - `onInvite(id: number): void` — Primary CTA “Inscriure'm amb parella”.
    - `onUnregister(id: number): void` — Ghost/outline cancel when allowed.
    - `formatDate(s: string): string`
    - `formatDateTime(s: string): string`
    - `canRegister(e: Event): boolean`
    - `canUnregister(e: Event): boolean`
    - `getStatusBadge?(status: string): ReactNode` — Optional, to reuse existing badge styles.
    - `getRegistrationStatusBadge?(status: string): ReactNode` — Optional.
    - `isRegistrationUrgent?(deadline: string): boolean` — Optional; shows “Últimes places”.
    - `onViewDetails?(id: number): void` — Renders “Veure detalls” link when provided.
    - `imageUrl?: string | null` — Optional hero image; otherwise uses a gradient.
  }
  - Notes:
    - Hero is 16:9 with overlay badges (status, capacity) and a quick map button if lat/lon present.
    - Chips: location (tap-to-open maps), participants 6/16, registration deadline, and partner when confirmed.
    - Thin progress bar under header; color reflects occupancy (emerald/amber/slate).
    - Microcopy normalized: “Veure detalls”, “Obert / Aviat / Tancat”, “Confirmat”.
    - Accessible contrast, large tap targets, responsive by default.

- `InviteDialog.tsx` — Dialog UI for creating/sharing/copying invite codes and sending invite by email.
  - Props: {
    - `openForEventId: number | null`
    - `onClose: () => void`
    - `generatedCode: string | null`
    - `autoGeneratingCode: boolean`
    - `copyConfirmed: boolean`
    - `inviteEmail: string`
    - `inviteSubmitting: boolean`
    - `onChangeEmail: (val: string) => void`
    - `onSubmitInvite: (generateOnly?: boolean) => void`
    - `onShare: (code: string) => void`
    - `onCopy: (text: string) => void`
  }
  - Notes: This component is purely presentational.

New hooks (components/tournaments/hooks):
- `useEventsPagination.ts` — Wraps events pagination via `useEventsList` and exposes `{ events, pagination, isEventsLoading, setPage }`.
- `useUserRegistrations.ts` — Loads user registrations and exposes unregister handler and state `{ userRegistrations, isRegistrationsLoading, processingEvents, handleUnregister, error }`.
- `useInviteFlow.ts` — Handles invite creation/regeneration, clipboard and share fallbacks, and dialog lifecycle.
- `useJoinByCode.ts` — Manages join-by-code dialog state, focus retries, and POST to `/api/invites/join`.
- `useDateFormatting.ts` — Exposes `formatDate` and `formatDateTime` using `ca-ES` locale.
- `useEventLogic.ts` — Exposes `canRegister`, `canUnregister`, `isRegistrationUrgent`, and `getShortLocation` helpers.
- `useBadges.tsx` — Returns JSX badge helpers `getStatusBadge` and `getRegistrationStatusBadge` with the same styling as before.

New UI containers (components/tournaments/ui):
- `AvailableEventsSection.tsx` — Card wrapper for the available events list and pagination; composes `EventList` and passes helpers.
- `MyRegistrationsSection.tsx` — Card wrapper for registrations; composes `RegistrationsList` and passes helpers.
- `InviteDialogContainer.tsx` — Bridges page state with `useInviteFlow` and renders `InviteDialog`.
- `JoinByCodeDialogContainer.tsx` — Bridges page with `useJoinByCode` and renders `JoinByCodeDialog`.

Notes
- Visuals and behavior are unchanged; only code organization was improved.
- The page file is now a thin orchestrator that composes hooks and containers.

- `JoinByCodeDialog.tsx` — Dialog UI for entering a 6-character join code and triggering a join action.
  - Props: {
    - `open: boolean`
    - `onOpenChange: (open: boolean) => void`
    - `joinCode: string`
    - `setJoinCode: (v: string) => void`
    - `joinError: string | null`
    - `joining: boolean`
    - `onJoin: () => void`
    - `inputRef: React.RefObject<HTMLInputElement>`
  }

Design decisions and assumptions
- Keep network and mutation logic in `page.tsx` to avoid duplicating side-effects across components.
- Components accept callbacks and minimal state slices (strings, arrays, sets) to remain stateless and easier to unit-test.
- Localization: existing Catalan strings are kept in the components; if you plan to internationalize, move strings to a shared translation layer.

Testing notes
- Unit-test each component rendering given mock props (React Testing Library).
- For `InviteDialog`, mock `onCopy` and `onShare` behaviors. For copy, the page-level function handles multiple fallbacks (Clipboard API, execCommand, textarea). Ensure the UI calls the provided `onCopy`.

How to extend
- If more interactions are needed inside a component (e.g. debounce on input, small local validation), prefer adding minimal local state to the component and keep API calls in `page.tsx`.
- If you want to move auto-generation into the dialog component itself, extract the API call into a shared hook (e.g. `use-create-pair-invite`) and call it from the dialog.

Developer tips
- `page.tsx` is still the source of truth for state such as `inviteForEventId`, `generatedCode`, `joinCodeOpen`, `events` and `userRegistrations`.
- When editing the components, always update the props in `page.tsx` to keep the contract in sync.

Contact
- If you need the behavior changed (for instance moving autogenerate into the dialog), tell me and I can implement a follow-up refactor.
