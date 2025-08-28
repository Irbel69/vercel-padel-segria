-- Migration: drop lesson_availability_overrides
-- Idempotent: safe to run multiple times
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lesson_availability_overrides') THEN
    -- Drop any RLS policies related to this table first (if they exist)
    BEGIN
      EXECUTE 'ALTER TABLE public.lesson_availability_overrides DISABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN undefined_table THEN
      -- ignore
      NULL;
    END;
    EXECUTE 'DROP TABLE public.lesson_availability_overrides CASCADE';
  END IF;
END$$;

-- Note: Running this will permanently remove override records. Ensure backups if needed.
