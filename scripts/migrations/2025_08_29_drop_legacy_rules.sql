-- Drop legacy rules-based scheduling artifacts
DO $$
BEGIN
  -- Drop FKs referencing lesson_availability_rules if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage ccu
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'lesson_slots'
      AND ccu.column_name = 'created_from_rule_id'
  ) THEN
    -- Drop FK constraint safely
    ALTER TABLE public.lesson_slots
    DROP CONSTRAINT IF EXISTS lesson_slots_created_from_rule_id_fkey;
  END IF;

  -- Drop column created_from_rule_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lesson_slots'
      AND column_name = 'created_from_rule_id'
  ) THEN
    ALTER TABLE public.lesson_slots
    DROP COLUMN created_from_rule_id;
  END IF;

  -- Drop lesson_availability_rules table if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'lesson_availability_rules'
  ) THEN
    DROP TABLE public.lesson_availability_rules;
  END IF;

  -- Drop lesson_availability_overrides table if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'lesson_availability_overrides'
  ) THEN
    DROP TABLE public.lesson_availability_overrides;
  END IF;
END $$;
