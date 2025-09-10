-- Migration: add shirt_size column to users
-- Run this against your Postgres / Supabase database migration tool.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS shirt_size text;

-- Optionally, you can add a constraint limiting allowed values:
-- ALTER TABLE public.users
-- ADD CONSTRAINT users_shirt_size_check CHECK (shirt_size IN ('XS','S','M','L','XL','XXL') OR shirt_size IS NULL);
