-- Migration: drop is_primary from season_request_participants
BEGIN;

ALTER TABLE public.season_request_participants
    DROP COLUMN IF EXISTS is_primary;

COMMIT;
