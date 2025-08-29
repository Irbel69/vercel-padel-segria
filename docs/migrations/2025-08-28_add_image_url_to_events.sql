-- Migration: Add image_url column to public.events
-- Safe to run multiple times
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS image_url text;

-- Optional: backfill existing events with NULL (no-op if column just created)
UPDATE public.events SET image_url = COALESCE(image_url, NULL);
