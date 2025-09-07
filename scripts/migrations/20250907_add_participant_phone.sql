-- Migration: Add phone field to season_request_participants (additional participants only)
-- Date: 2025-09-07

ALTER TABLE public.season_request_participants
  ADD COLUMN IF NOT EXISTS phone text; -- Telèfon (E.164, ex: +34612345678)

COMMENT ON COLUMN public.season_request_participants.phone IS 'Telèfon del participant addicional (+34...).';
