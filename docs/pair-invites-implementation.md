# Pair Registration with Invitation — Implementation Summary

Last updated: 2025-08-20

This document summarizes what was implemented to support "Inscripció per parella amb invitació" (pair registration with invitation) across backend, security, and dashboard UI.

## Overview

Goal: Allow users to register for a tournament as a pair by inviting a partner via email or by sharing a join code. Acceptance by the partner is required. Privacy by default and strong security constraints are enforced.

## Database

- Table: `pair_invites`
  - Fields: `id`, `event_id`, `inviter_id`, `invitee_email`, `invitee_id` (nullable), `status` (enum: sent, accepted, declined, revoked, expired), `token`, `short_code`, `created_at`, `updated_at`, `expires_at`, `accepted_at`, `declined_at`.
  - Row Level Security enabled with policies to restrict read/write to involved users and system operations.
- `events.registration_deadline` is `timestamptz`.
- Extended `registrations` with `pair_id uuid` (nullable) to associate two registrations created upon acceptance.

Notes: Migration was applied via Supabase MCP; see migration history for exact SQL.

## Types

- Updated `types/index.ts` with:
  - `PairInviteStatus` union type.
  - `PairInvite` interface.
  - `Registration` extended with optional `pair_id?: string | null`.

## Rate Limiting

- `libs/rate-limiter.ts`: Added configs for invite-related endpoints:
  - `invites` (creation), `invites_join` (join by code), `invites_action` (accept/decline).
- `libs/rate-limiter-middleware.ts`: Mapped new API paths to the above configs.

## API Endpoints

All endpoints return privacy-preserving messages to avoid account/email enumeration.

- POST `/api/events/[id]/invite`
  - Auth required. Validates event is open, not over capacity, and inviter not already registered.
  - Generates secure `token` and short `code`; sets expiry.
  - Inserts into `pair_invites` with status `sent` and sends email via Resend if email provided.
  - Response: generic success, returns `short_code` (never returns the long token).

- POST `/api/invites/join`
  - Auth required. Accepts `{ code }`, returns a generic message and the `token` only if valid and not expired.

- POST `/api/invites/[token]/accept`
  - Auth required. Validates invite, expiry, event constraints (deadline/capacity).
  - Ensures invitee (current user) is not already registered.
  - Upserts only the invitee's registration with a generated `pair_id` and status `confirmed` (idempotent).
  - Does not insert the inviter again; avoids duplicates on `(user_id, event_id)`.
  - Adjusts capacity check to +1 (only the invitee is added in this step).
  - Marks invite as `accepted` with `accepted_at`.
  - Future: move to RPC for strict transactionality.

- POST `/api/invites/[token]/decline`
  - Auth required. Marks invite as `declined` after permission checks.

## Email

- `libs/email/templates/pair-invite.tsx`: Minimal, privacy-preserving HTML/text email rendered and dispatched by the invite endpoint using Resend.

## Dashboard UI

- `app/dashboard/tournaments/page.tsx`:
  - Added per-event action “Inscriure'm amb parella” to open a dialog where user can:
    - Enter an email to send an invite, or
    - Generate a join code to share directly.
  - Added header action “Unir-me amb codi” to input a code; on success, redirects to `/invite/accept?token=...`.
  - Uses toasts for success/error feedback; maintains loading states; respects existing styles.

- `app/invite/accept/page.tsx`:
  - Token-based accept/decline UI. Calls accept/decline endpoints and redirects back to tournaments.

## Security & Privacy

- RLS on `pair_invites` and continued RLS on existing tables.
- No public user search; generic API responses; avoids email/account enumeration.
- Rate limiting on all new endpoints with sliding window.
- Sensitive operations only on server; signed/opaque tokens with expirations.
- Middleware enforces CSP/security headers (existing).

## Testing & Validation

- TypeScript compile: clean.
- Visual smoke with Playwright MCP on dashboard tournaments: dialogs render and interact; basic flow works.
- Next steps include adding targeted tests and expanding validation scenarios (see Next Steps doc).

## Known Limitations / Future Improvements

- Strict atomicity for dual registration should be moved to a DB transaction via RPC function.
- Add clipboard button for generated codes and minor a11y improvements (dialog description).
- Pending invites surface in dashboard UI (optional Phase 2).
