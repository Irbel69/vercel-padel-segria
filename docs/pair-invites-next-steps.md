# Pair Registration with Invitation — Next Steps & Roadmap

Last updated: 2025-08-20

This document details the remaining work, polish items, and validation plan for the pair-invite feature.

## Quick Wins (Polish)

- Dialog a11y: Provide a short description (`aria-describedby`) on invite/join dialogs to remove warnings.
- Copy to clipboard: Add a copy button next to the generated short code with a confirmation toast.
- Empty states: Show friendly messages when there are no events or no registrations.
- Loading UX: Disable inputs/buttons during in-flight requests consistently; add subtle spinners where helpful.

## Functional Enhancements

1. Strict Atomicity via RPC
   - Implement a PostgreSQL function to perform both registrations and status update in a single transaction.
   - Update `/api/invites/[token]/accept` to call the RPC and remove best-effort rollback code.

2. Pending Invites in Dashboard (Phase 2)
   - UI: Add a section in `dashboard/tournaments` to list pending invites (received/sent) for the current user.
   - API: Add `/api/invites/me` (read-only) with RLS-safe filters and pagination.
   - Actions: From the list, allow accept/decline directly.

3. Resend Email Improvements
   - Add locale-aware content.
   - Add a plain CTA deep link to `/invite/accept` with token.
   - DKIM/SPF verifications in production.

4. Admin Observability
   - Admin-only page to search invites by event (not user/email) for support/debug.
   - Metrics: Counts per status, expirations, accept time delta.

## Edge Cases & Behavior

- Expired invites: Ensure `/invites/join` and `/accept` surface a clear message; offer to request a new invite.
- Capacity race: When full, accept should fail gracefully with an explanatory message.
- Duplicate registrations: Prevent inviter or invitee registering twice; surface friendly errors.
- Event state changes: If event closes or deadline passes, block flows consistently.
- Email not registered: Keep privacy by default; email path should not disclose existence.

## Security & Privacy Checks

- Confirm RLS policies on `pair_invites` match intended access (inviter/invitee-only visibility).
- Verify rate limiting headers and error bodies are generic.
- Sanitize all user inputs and normalize codes (uppercase, trim) on server.
- Validate tokens: length, entropy, and strict expiration handling.

## Testing Plan

- Unit tests
  - Token/code helpers (formatting, normalization).
  - API handlers: happy paths and key error cases.

- Integration tests
  - Invite creation → email/code success path.
  - Join by code → accept → two registrations created or one if inviter already registered; ensure idempotent behavior on re-tries.
  - Decline path.
  - Failure cases: expired, full capacity, already registered, past deadline.

- E2E/Visual (Playwright)
  - Screenshots for dialogs (light/dark), responsive viewport checks.
  - Flow: generate code, join by code, accept, and return to dashboard.

## Operations & Monitoring

- Add structured logs for invite lifecycle events (create/join/accept/decline) with request IDs.
- Add a lightweight audit trail table if needed for admin review.
- Consider Sentry instrumentation for API routes.

## Rollout Plan

- Staging: Enable feature flags to test end-to-end with test events.
- Canary: Limited user set to validate behavior and performance.
- Production: Monitor error rates and rate-limiter counters; add dashboards if available.

## Acceptance Criteria for Completion

- Users can successfully invite by email or code and complete a pair registration, with partner acceptance required.
- Privacy-preserving responses and no public user enumeration.
- RLS enforces row-level access; rate limits protect endpoints.
- UI is responsive, accessible, and provides clear feedback.
- Tests (unit + integration + basic E2E) cover happy paths and critical edge cases.

> **Note**: The accept flow has been updated to improve user experience. Please refer to the latest documentation for detailed information.
> - Clipboard and a11y quick wins have been implemented.
> - Strict atomicity is ensured via RPC transactions.
