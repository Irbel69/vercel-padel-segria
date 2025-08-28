-- Enable RLS and restrict lesson_slot_batches to admins
ALTER TABLE IF EXISTS public.lesson_slot_batches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'lesson_slot_batches_admin_only' AND schemaname = 'public'
  ) THEN
    CREATE POLICY lesson_slot_batches_admin_only
      ON public.lesson_slot_batches
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END$$;
