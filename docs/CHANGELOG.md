# Changelog

All notable changes to this project will be documented in this file.

## 2025-08-20 — React Query for Dashboard Events + Pair invites fixes

Summary:

- Implemented React Query for events management in dashboard (tournaments page)
- Fixed pair invites issues: schema alignment and duplicate registration errors
- Landing page events section kept with manual fetch (no React Query)

Details:

### 1) React Query Implementation for Dashboard Events

- **New hook**: `hooks/use-events.ts`
  - `useEventsList({ page, limit, status, search })` for paginated events listing
  - `useRegisterForEvent()` and `useUnregisterFromEvent()` mutations with automatic query invalidation
  - `useCreatePairInvite()` for pair invitation functionality
  - `usePublicEvents({ limit })` available but not used in landing page
  - Configuration: `staleTime: 2m`, `gcTime: 10m`, `refetchOnWindowFocus: false`

- **Dashboard refactor**: `app/dashboard/tournaments/page.tsx`
  - Replaced manual `fetchEvents()` with `useEventsList()` React Query hook
  - Replaced imperative register/unregister with `useMutation` hooks
  - Maintained all existing UI: pagination, invite dialogs, join-by-code functionality
  - Automatic query invalidation after mutations ensures fresh data without manual re-fetching

- **Landing page unchanged**: `components/sections/events/EventsSection.tsx`
  - Kept original manual fetch implementation as requested
  - No React Query integration for public events display

### 2) Database schema alignment & pair invites fixes

- Fixed inability to create invites due to PostgREST schema cache mismatch (PGRST204)
- Resolved duplicate registration error during accept (Postgres 23505) by making the accept flow idempotent
- Aligned documentation schema with live DB (pair_invites and related fields)

Database schema alignment:

- `pair_invites` columns renamed/ensured:
  - `invitee_email` (nullable text)
  - `invitee_id` (nullable uuid)
  - `token` (text, unique)
  - `short_code` (text, unique)
  - `status` enum values: `sent | accepted | declined | revoked | expired` (default: `sent`)
  - Timestamps: `expires_at`, `accepted_at`, `declined_at`, plus `created_at` / `updated_at`
- `events.registration_deadline` is `timestamptz`
- `registrations.pair_id` is `uuid` (nullable) to group pair signups
- PostgREST schema cache reloaded after DDL

Accept endpoint hardening:

- Endpoint: `POST /api/invites/[token]/accept`
- Behavior change: Now upserts only the invitee's registration (current user) and sets `pair_id`. It does not insert the inviter again. This avoids unique constraint violations (duplicate (user_id, event_id)).
- Capacity check adjusted to +1 (only the invitee is added during this call)
- Invite status updated to `accepted` with `accepted_at`
- Idempotent by design: on re-tries, the upsert does not create duplicates

Operational notes:

- If inviter has not yet registered separately, only one seat is consumed at accept time. Consider a follow-up RPC that atomically ensures both registrations when desired.
- Rate limiting remains enforced across invite endpoints.

Files touched:

- `hooks/use-events.ts` (new) - React Query hooks for events
- `app/dashboard/tournaments/page.tsx` - Refactored to use React Query
- `docs/dashboard-architecture.md` - Updated with React Query events implementation
- `docs/db_schema.sql` - Updated for clarity (context-only schema)
- `docs/pair-invites-implementation.md` - Updated to reflect accept flow change
- `docs/pair-invites-next-steps.md` - Annotated with current behavior note and follow-ups
- `docs/README.md` - Now links to this changelog

## 2025-08-20 — Pair invites fixes & schema alignment (previous entry)

[Previous changelog entry content...]
