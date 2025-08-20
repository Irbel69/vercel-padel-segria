# Changelog

All notable changes to this project will be documented in this file.

## 2025-08-20 — Pair invites fixes & schema alignment

Summary:

- Fixed inability to create invites due to PostgREST schema cache mismatch (PGRST204)
- Resolved duplicate registration error during accept (Postgres 23505) by making the accept flow idempotent
- Aligned documentation schema with live DB (pair_invites and related fields)

Details:

1) Database schema alignment

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

2) Accept endpoint hardening

- Endpoint: `POST /api/invites/[token]/accept`
- Behavior change: Now upserts only the invitee's registration (current user) and sets `pair_id`. It does not insert the inviter again. This avoids unique constraint violations (duplicate (user_id, event_id)).
- Capacity check adjusted to +1 (only the invitee is added during this call)
- Invite status updated to `accepted` with `accepted_at`
- Idempotent by design: on re-tries, the upsert does not create duplicates

3) Operational notes

- If inviter has not yet registered separately, only one seat is consumed at accept time. Consider a follow-up RPC that atomically ensures both registrations when desired.
- Rate limiting remains enforced across invite endpoints.

Files touched (docs):

- `docs/db_schema.sql` updated for clarity (context-only schema)
- `docs/pair-invites-implementation.md` updated to reflect accept flow change
- `docs/pair-invites-next-steps.md` annotated with current behavior note and follow-ups
- `docs/README.md` now links to this changelog
