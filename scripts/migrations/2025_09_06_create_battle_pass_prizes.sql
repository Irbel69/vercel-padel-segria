-- Migration: Create battle_pass_prizes table and supporting functions
-- Date: 2025-09-06
-- Description: Create a Battle Pass system for tournament point rewards

-- First, create the is_admin helper function if it doesn't exist
-- This function is used by RLS policies to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND is_admin = true
  );
$$;

-- Create the battle_pass_prizes table
CREATE TABLE IF NOT EXISTS public.battle_pass_prizes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text,
  points_required integer NOT NULL CHECK (points_required >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_battle_pass_prizes_active_order 
  ON public.battle_pass_prizes (is_active, display_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_battle_pass_prizes_points_required 
  ON public.battle_pass_prizes (points_required);

CREATE INDEX IF NOT EXISTS idx_battle_pass_prizes_created_by 
  ON public.battle_pass_prizes (created_by);

-- Add unique constraint to prevent duplicate display orders for active prizes
CREATE UNIQUE INDEX IF NOT EXISTS uq_battle_pass_prizes_active_display_order
  ON public.battle_pass_prizes (display_order)
  WHERE is_active = true;

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_battle_pass_prizes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at on row changes
DROP TRIGGER IF EXISTS tr_battle_pass_prizes_updated_at ON public.battle_pass_prizes;
CREATE TRIGGER tr_battle_pass_prizes_updated_at
  BEFORE UPDATE ON public.battle_pass_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_battle_pass_prizes_updated_at();

-- Enable Row Level Security
ALTER TABLE public.battle_pass_prizes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy 1: Public can read active prizes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'battle_pass_prizes_public_read' 
    AND schemaname = 'public' 
    AND tablename = 'battle_pass_prizes'
  ) THEN
    CREATE POLICY battle_pass_prizes_public_read
      ON public.battle_pass_prizes
      FOR SELECT
      TO public
      USING (is_active = true);
  END IF;
END$$;

-- Policy 2: Authenticated users can read all prizes (for admin interface)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'battle_pass_prizes_authenticated_read' 
    AND schemaname = 'public' 
    AND tablename = 'battle_pass_prizes'
  ) THEN
    CREATE POLICY battle_pass_prizes_authenticated_read
      ON public.battle_pass_prizes
      FOR SELECT
      TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;
END$$;

-- Policy 3: Only admins can insert prizes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'battle_pass_prizes_admin_insert' 
    AND schemaname = 'public' 
    AND tablename = 'battle_pass_prizes'
  ) THEN
    CREATE POLICY battle_pass_prizes_admin_insert
      ON public.battle_pass_prizes
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END$$;

-- Policy 4: Only admins can update prizes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'battle_pass_prizes_admin_update' 
    AND schemaname = 'public' 
    AND tablename = 'battle_pass_prizes'
  ) THEN
    CREATE POLICY battle_pass_prizes_admin_update
      ON public.battle_pass_prizes
      FOR UPDATE
      TO authenticated
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END$$;

-- Policy 5: Only admins can delete prizes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'battle_pass_prizes_admin_delete' 
    AND schemaname = 'public' 
    AND tablename = 'battle_pass_prizes'
  ) THEN
    CREATE POLICY battle_pass_prizes_admin_delete
      ON public.battle_pass_prizes
      FOR DELETE
      TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;
END$$;

-- Insert some sample data for testing
INSERT INTO public.battle_pass_prizes (title, description, points_required, display_order, is_active) 
VALUES 
  ('Padel Racket', 'Professional padel racket for tournament winners', 1000, 1, true),
  ('Tournament T-Shirt', 'Official tournament commemorative t-shirt', 250, 2, true),
  ('Water Bottle', 'Premium sports water bottle with club logo', 100, 3, true),
  ('Padel Balls Set', 'Set of 3 professional padel balls', 50, 4, true),
  ('Training Session', 'Free 1-hour training session with a professional coach', 500, 5, true)
ON CONFLICT DO NOTHING;

-- Create a view for easily getting available prizes for users
CREATE OR REPLACE VIEW public.available_battle_pass_prizes AS
SELECT 
  id,
  title,
  description,
  points_required,
  image_url,
  display_order
FROM public.battle_pass_prizes
WHERE is_active = true
ORDER BY display_order ASC, points_required ASC;

-- Grant appropriate permissions for the view
GRANT SELECT ON public.available_battle_pass_prizes TO public;
GRANT SELECT ON public.available_battle_pass_prizes TO authenticated;

-- Create a function to get user progress towards prizes
CREATE OR REPLACE FUNCTION public.get_user_battle_pass_progress(user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  prize_id bigint,
  title text,
  description text,
  points_required integer,
  image_url text,
  display_order integer,
  user_points integer,
  can_claim boolean,
  progress_percentage numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH user_score AS (
    SELECT COALESCE(score, 0) as points
    FROM public.users 
    WHERE id = user_id
  )
  SELECT 
    bp.id,
    bp.title,
    bp.description,
    bp.points_required,
    bp.image_url,
    bp.display_order,
    us.points as user_points,
    (us.points >= bp.points_required) as can_claim,
    LEAST(100.0, (us.points::numeric / NULLIF(bp.points_required, 0) * 100.0))::numeric(5,2) as progress_percentage
  FROM public.battle_pass_prizes bp
  CROSS JOIN user_score us
  WHERE bp.is_active = true
  ORDER BY bp.display_order ASC, bp.points_required ASC;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_battle_pass_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_battle_pass_progress() TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.battle_pass_prizes IS 'Stores battle pass prizes that users can earn with tournament points';
COMMENT ON COLUMN public.battle_pass_prizes.points_required IS 'Minimum tournament points required to claim this prize';
COMMENT ON COLUMN public.battle_pass_prizes.display_order IS 'Order in which prizes should be displayed (lower numbers first)';
COMMENT ON COLUMN public.battle_pass_prizes.is_active IS 'Whether this prize is currently available for claiming';
COMMENT ON FUNCTION public.get_user_battle_pass_progress(uuid) IS 'Returns user progress towards all available battle pass prizes';
COMMENT ON VIEW public.available_battle_pass_prizes IS 'View showing only active battle pass prizes for public consumption';