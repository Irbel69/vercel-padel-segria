-- Migration: Add DNI field to season_request_participants
-- Date: 2025-09-07

ALTER TABLE public.season_request_participants
  ADD COLUMN IF NOT EXISTS dni text; -- DNI / NIF del participant (pot ser null per registres antics)

COMMENT ON COLUMN public.season_request_participants.dni IS 'DNI / NIF del participant de la sol·licitud.';
