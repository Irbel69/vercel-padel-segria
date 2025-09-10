-- Migration: Create accept_pair_invite RPC to atomically accept a pair invite
-- IMPORTANT: Run this as a database ADMIN (Supabase SQL editor runs as admin).
-- The function is SECURITY DEFINER and must be owned by a role that can bypass RLS
-- (typically the db owner). After creating, GRANT EXECUTE to the `authenticated` role.

/*
 * Usage (from supabase-js with authenticated user):
 * const { data, error } = await supabase.rpc('accept_pair_invite', { token: '...' });
 */

CREATE OR REPLACE FUNCTION public.accept_pair_invite(token_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_actor_id UUID := NULL;
  v_actor_email TEXT := NULL;
  v_event RECORD;
  v_pair_id UUID := gen_random_uuid();
  v_existing_inviter_reg RECORD;
  v_existing_invitee_reg RECORD;
  v_current_confirmed_count INTEGER;
BEGIN
  -- Read actor claims from JWT injected by Supabase
  v_actor_id := current_setting('request.jwt.claims.sub', true)::uuid;
  v_actor_email := current_setting('request.jwt.claims.email', true);

  IF v_actor_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_auth');
  END IF;

  -- Fetch invite token and validate
  SELECT * INTO v_invite
  FROM public.pair_invites
  WHERE token = token_text
    AND status = 'sent'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_not_found_or_not_sent');
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_expired');
  END IF;

  -- Authorize actor is the invitee (by id or email)
  IF v_invite.invitee_id IS NOT NULL THEN
    IF v_invite.invitee_id::text <> v_actor_id::text THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_invitee');
    END IF;
  ELSE
    IF v_invite.invitee_email IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invite_invalid_no_target');
    END IF;
    IF lower(v_invite.invitee_email) <> lower(coalesce(v_actor_email, '')) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'email_mismatch');
    END IF;
  END IF;

  -- Lock event for capacity check
  SELECT * INTO v_event
  FROM public.events
  WHERE id = v_invite.event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'event_not_found');
  END IF;

  IF v_event.status = 'closed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'event_closed');
  END IF;

  IF v_event.registration_deadline IS NOT NULL AND v_event.registration_deadline <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'registration_deadline_passed');
  END IF;

  SELECT COUNT(*) INTO v_current_confirmed_count
  FROM public.registrations
  WHERE event_id = v_event.id
    AND status = 'confirmed';

  -- Check invitee registration
  SELECT * INTO v_existing_invitee_reg
  FROM public.registrations
  WHERE event_id = v_event.id
    AND user_id = v_actor_id
  LIMIT 1;

  IF v_existing_invitee_reg IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invitee_already_registered');
  END IF;

  -- Check inviter registration
  SELECT * INTO v_existing_inviter_reg
  FROM public.registrations
  WHERE event_id = v_event.id
    AND user_id = v_invite.inviter_id
  LIMIT 1;

  -- Capacity
  IF v_existing_inviter_reg IS NULL THEN
    IF v_current_confirmed_count + 2 > v_event.max_participants THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_enough_capacity');
    END IF;
  ELSE
    IF v_current_confirmed_count + 1 > v_event.max_participants THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_enough_capacity');
    END IF;
  END IF;

  -- Create or update inviter registration
  IF v_existing_inviter_reg IS NULL THEN
    INSERT INTO public.registrations (user_id, event_id, status, pair_id, created_at, updated_at)
    VALUES (v_invite.inviter_id, v_event.id, 'confirmed', v_pair_id, now(), now());
  ELSE
    UPDATE public.registrations
    SET pair_id = v_pair_id, updated_at = now()
    WHERE id = v_existing_inviter_reg.id;
  END IF;

  -- Upsert invitee registration
  INSERT INTO public.registrations (user_id, event_id, status, pair_id, created_at, updated_at)
  VALUES (v_actor_id, v_event.id, 'confirmed', v_pair_id, now(), now())
  ON CONFLICT (user_id, event_id) DO UPDATE
    SET pair_id = EXCLUDED.pair_id,
        status = EXCLUDED.status,
        updated_at = now();

  -- Mark invite accepted
  UPDATE public.pair_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'message', 'accepted', 'pair_id', v_pair_id::text);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'accept_pair_invite error: %', SQLERRM;
  RETURN jsonb_build_object('ok', false, 'error', 'internal_error');
END;
$$;

-- IMPORTANT: run as admin to set function owner to a privileged role if possible
-- Example (run as admin):
-- ALTER FUNCTION public.accept_pair_invite(text) OWNER TO postgres;

-- Grant execute to authenticated role so regular logged users can call RPC
GRANT EXECUTE ON FUNCTION public.accept_pair_invite(text) TO authenticated;
