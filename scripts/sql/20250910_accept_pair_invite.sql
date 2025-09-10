-- Migration: Create accept_pair_invite RPC to atomically accept a pair invite
-- IMPORTANT: Run this as a database ADMIN (Supabase SQL editor runs as admin).
-- The function is SECURITY DEFINER and must be owned by a role that can bypass RLS
-- (typically the db owner). After creating, GRANT EXECUTE to the `authenticated` role.

/*
 * Usage (from supabase-js with authenticated user):
 * const { data, error } = await supabase.rpc('accept_pair_invite', { token: '...' });
 */

CREATE OR REPLACE FUNCTION public.accept_pair_invite(
  token_text text,
  actor_user_id uuid DEFAULT NULL,
  actor_email text DEFAULT NULL
)
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
  -- Try to get actor from parameters first, then fallback to JWT claims
  IF actor_user_id IS NOT NULL THEN
    v_actor_id := actor_user_id;
    v_actor_email := actor_email;
  ELSE
    -- Fallback: Read actor claims from JWT injected by Supabase
    BEGIN
      v_actor_id := current_setting('request.jwt.claims.sub', true)::uuid;
      v_actor_email := current_setting('request.jwt.claims.email', true);
    EXCEPTION WHEN OTHERS THEN
      -- JWT claims not available
      v_actor_id := NULL;
      v_actor_email := NULL;
    END;
  END IF;

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

  -- Debug: Log invite data
  RAISE NOTICE 'Invite data: id=%, inviter_id=%, invitee_id=%, invitee_email=%, status=%', 
    v_invite.id, v_invite.inviter_id, v_invite.invitee_id, v_invite.invitee_email, v_invite.status;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_expired');
  END IF;

  -- Authorize actor is the invitee (by id or email)
  RAISE NOTICE 'Authorization check: actor_id=%, actor_email=%, invitee_id=%, invitee_email=%',
    v_actor_id, v_actor_email, v_invite.invitee_id, v_invite.invitee_email;

  IF v_invite.invitee_id IS NOT NULL THEN
    -- ID-targeted invite: only that user may accept
    RAISE NOTICE 'Checking ID-based invite authorization';
    IF v_invite.invitee_id::text <> v_actor_id::text THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_invitee');
    END IF;
  ELSE
    -- No invitee_id set. There are two cases:
    -- 1) invitee_email is set -> email-targeted invite (accept only if emails match)
    -- 2) invitee_email is NULL -> open invite (any authenticated user may accept)
    RAISE NOTICE 'No invitee_id set; checking email or open invite';
    IF v_invite.invitee_email IS NOT NULL THEN
      -- Email-targeted invite
      IF lower(v_invite.invitee_email) <> lower(coalesce(v_actor_email, '')) THEN
        RAISE NOTICE 'Email mismatch: invite_email=%, actor_email=%', v_invite.invitee_email, v_actor_email;
        RETURN jsonb_build_object('ok', false, 'error', 'email_mismatch');
      END IF;
    ELSE
      -- Open invite: no specific target, allow any authenticated user to accept
      RAISE NOTICE 'Open invite: proceeding without mutating pair_invites; treating actor % as invitee for this operation', v_actor_id;
      -- Do NOT mutate the pair_invites row here (RLS/permissions may prevent it).
      -- For the purpose of registration and capacity checks treat actor as the invitee locally.
      v_invite.invitee_id := v_actor_id;
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
    INSERT INTO public.registrations (user_id, event_id, status, pair_id, registered_at)
    VALUES (v_invite.inviter_id, v_event.id, 'confirmed', v_pair_id, now());
  ELSE
    UPDATE public.registrations
    SET pair_id = v_pair_id
    WHERE id = v_existing_inviter_reg.id;
  END IF;

  -- Upsert invitee registration
  INSERT INTO public.registrations (user_id, event_id, status, pair_id, registered_at)
  VALUES (v_actor_id, v_event.id, 'confirmed', v_pair_id, now())
  ON CONFLICT (user_id, event_id) DO UPDATE
    SET pair_id = EXCLUDED.pair_id,
        status = EXCLUDED.status;

  -- Mark invite accepted
  UPDATE public.pair_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'message', 'accepted', 'pair_id', v_pair_id::text);

EXCEPTION WHEN others THEN
  -- Return the SQL error and SQLSTATE for easier debugging in dev environments.
  -- WARNING: this can leak internal DB details; remove or sanitize before deploying to production.
  RAISE NOTICE 'accept_pair_invite error: % (SQLSTATE=%)', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object(
    'ok', false,
    'error', 'internal_error',
    'reason', COALESCE(SQLERRM, ''),
    'sqlstate', COALESCE(SQLSTATE, '')
  );
END;
$$;

-- IMPORTANT: run as admin to set function owner to a privileged role if possible
-- Example (run as admin):
-- ALTER FUNCTION public.accept_pair_invite(text) OWNER TO postgres;

-- Grant execute to authenticated role so regular logged users can call RPC
GRANT EXECUTE ON FUNCTION public.accept_pair_invite(text, uuid, text) TO authenticated;
