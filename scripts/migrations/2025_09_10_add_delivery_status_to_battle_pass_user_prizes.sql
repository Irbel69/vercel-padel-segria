-- Migration: Add delivery status tracking to battle_pass_user_prizes
-- This adds delivery_status and delivered_at fields to track prize delivery

-- Add delivery status column with enum constraint
ALTER TABLE public.battle_pass_user_prizes
ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending_delivery'
CHECK (delivery_status IN ('pending_delivery', 'delivered', 'delivery_failed'));

-- Add delivered_at timestamp column
ALTER TABLE public.battle_pass_user_prizes
ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL;

-- Create index for filtering by delivery status
CREATE INDEX IF NOT EXISTS idx_battle_pass_user_prizes_delivery_status 
ON public.battle_pass_user_prizes(delivery_status);

-- Create composite index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_battle_pass_user_prizes_status_date 
ON public.battle_pass_user_prizes(delivery_status, delivered_at);

-- Update RLS policies to allow admin management of delivery status

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "admin manage delivery status" ON public.battle_pass_user_prizes;

-- Create policy for admins to update delivery status
CREATE POLICY "admin manage delivery status"
ON public.battle_pass_user_prizes
FOR UPDATE
USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true)
WITH CHECK ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

-- Allow admins to select all claims for delivery management
DROP POLICY IF EXISTS "admin select all claims" ON public.battle_pass_user_prizes;
CREATE POLICY "admin select all claims"
ON public.battle_pass_user_prizes
FOR SELECT
USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);

-- Create function to update delivery status (admin only)
CREATE OR REPLACE FUNCTION public.update_prize_delivery_status(
  p_claim_id bigint,
  p_delivery_status text,
  p_delivered_at timestamptz DEFAULT NULL
)
RETURNS public.battle_pass_user_prizes
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
  v_row public.battle_pass_user_prizes;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28P01';
  END IF;

  -- Check if user is admin
  SELECT is_admin INTO v_is_admin
  FROM public.users
  WHERE id = v_user_id;

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: admin privileges required' USING errcode = '42501';
  END IF;

  -- Validate delivery status
  IF p_delivery_status NOT IN ('pending_delivery', 'delivered', 'delivery_failed') THEN
    RAISE EXCEPTION 'Invalid delivery status: %', p_delivery_status USING errcode = '22P02';
  END IF;

  -- Set delivered_at automatically if status is 'delivered' and not provided
  IF p_delivery_status = 'delivered' AND p_delivered_at IS NULL THEN
    p_delivered_at := now();
  END IF;

  -- Update the claim
  UPDATE public.battle_pass_user_prizes
  SET 
    delivery_status = p_delivery_status,
    delivered_at = p_delivered_at
  WHERE id = p_claim_id
  RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Claim not found with id: %', p_claim_id USING errcode = '02000';
  END IF;

  RETURN v_row;
END;
$$;

-- Grant execute permissions to authenticated users (will be filtered by admin check in function)
GRANT EXECUTE ON FUNCTION public.update_prize_delivery_status(bigint, text, timestamptz) TO authenticated;

-- Create function to get delivery statistics (admin only)
CREATE OR REPLACE FUNCTION public.get_delivery_stats()
RETURNS TABLE(
  delivery_status text,
  count bigint
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '28P01';
  END IF;

  -- Check if user is admin
  SELECT is_admin INTO v_is_admin
  FROM public.users
  WHERE id = v_user_id;

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: admin privileges required' USING errcode = '42501';
  END IF;

  -- Return delivery statistics
  RETURN QUERY
  SELECT 
    bpup.delivery_status,
    COUNT(*) as count
  FROM public.battle_pass_user_prizes bpup
  GROUP BY bpup.delivery_status
  ORDER BY bpup.delivery_status;
END;
$$;

-- Grant execute permissions to authenticated users (will be filtered by admin check in function)
GRANT EXECUTE ON FUNCTION public.get_delivery_stats() TO authenticated;