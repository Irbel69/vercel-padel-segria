-- Migration: create lesson_slot_batches and add created_from_batch_id to lesson_slots

-- Create batches table to store modular schedule templates
CREATE TABLE IF NOT EXISTS public.lesson_slot_batches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text,
  valid_from date,
  valid_to date,
  days_of_week integer[] NOT NULL,
  base_time_start time without time zone NOT NULL,
  location text NOT NULL DEFAULT 'Soses',
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  template jsonb NOT NULL,
  options jsonb,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add reference column on lesson_slots
ALTER TABLE IF EXISTS public.lesson_slots
  ADD COLUMN IF NOT EXISTS created_from_batch_id bigint REFERENCES public.lesson_slot_batches(id);

-- Optional: ensure we don't create exact duplicate slots for the same start and location
-- Note: if your domain requires allowing multiple identical slots (e.g., different courts), extend the uniqueness key
CREATE UNIQUE INDEX IF NOT EXISTS uq_lesson_slots_start_location
  ON public.lesson_slots (start_at, location);
