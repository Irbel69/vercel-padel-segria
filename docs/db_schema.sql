-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.battle_pass_prizes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text,
  points_required integer NOT NULL CHECK (points_required >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  original_image_url text,
  CONSTRAINT battle_pass_prizes_pkey PRIMARY KEY (id),
  CONSTRAINT battle_pass_prizes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.battle_pass_user_prizes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  prize_id bigint NOT NULL,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  delivery_status text NOT NULL DEFAULT 'pending_delivery'::text CHECK (delivery_status = ANY (ARRAY['pending_delivery'::text, 'delivered'::text, 'delivery_failed'::text])),
  delivered_at timestamp with time zone,
  CONSTRAINT battle_pass_user_prizes_pkey PRIMARY KEY (id),
  CONSTRAINT battle_pass_user_prizes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT battle_pass_user_prizes_prize_id_fkey FOREIGN KEY (prize_id) REFERENCES public.battle_pass_prizes(id)
);
CREATE TABLE public.direct_debit_details (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  booking_id bigint NOT NULL UNIQUE,
  iban text,
  holder_name text,
  holder_address text,
  holder_dni text,
  is_authorized boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT direct_debit_details_pkey PRIMARY KEY (id),
  CONSTRAINT direct_debit_details_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.lesson_bookings(id)
);
CREATE TABLE public.events (
  id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass),
  title text NOT NULL,
  date date NOT NULL,
  location text,
  status USER-DEFINED NOT NULL DEFAULT 'open'::event_status,
  prizes text,
  max_participants integer NOT NULL,
  registration_deadline timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  latitude double precision,
  longitude double precision,
  image_url text,
  pair_required boolean NOT NULL DEFAULT true,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lesson_booking_participants (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  booking_id bigint NOT NULL,
  name text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  CONSTRAINT lesson_booking_participants_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_booking_participants_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.lesson_bookings(id)
);
CREATE TABLE public.lesson_bookings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  slot_id bigint NOT NULL,
  user_id uuid NOT NULL,
  group_size integer NOT NULL CHECK (group_size >= 1 AND group_size <= 4),
  allow_fill boolean NOT NULL DEFAULT false,
  payment_type USER-DEFINED NOT NULL,
  observations text,
  price_total_cents integer NOT NULL CHECK (price_total_cents >= 0),
  status USER-DEFINED NOT NULL DEFAULT 'confirmed'::booking_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_bookings_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.lesson_slots(id),
  CONSTRAINT lesson_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.lesson_pricing (
  group_size integer NOT NULL CHECK (group_size >= 1 AND group_size <= 4),
  price_per_person_cents integer NOT NULL CHECK (price_per_person_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT lesson_pricing_pkey PRIMARY KEY (group_size)
);
CREATE TABLE public.lesson_slot_batches (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text,
  valid_from date,
  valid_to date,
  days_of_week ARRAY NOT NULL,
  base_time_start time without time zone NOT NULL,
  location text NOT NULL DEFAULT 'Soses'::text,
  timezone text NOT NULL DEFAULT 'Europe/Madrid'::text,
  template jsonb NOT NULL,
  options jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_slot_batches_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_slot_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.lesson_slots (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  max_capacity integer NOT NULL DEFAULT 4 CHECK (max_capacity >= 1 AND max_capacity <= 4),
  location text NOT NULL DEFAULT 'Soses'::text,
  status USER-DEFINED NOT NULL DEFAULT 'open'::lesson_slot_status,
  locked_by_booking_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_from_batch_id bigint,
  CONSTRAINT lesson_slots_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_slots_created_from_batch_id_fkey FOREIGN KEY (created_from_batch_id) REFERENCES public.lesson_slot_batches(id)
);
CREATE TABLE public.matches (
  id integer NOT NULL DEFAULT nextval('matches_id_seq'::regclass),
  event_id integer NOT NULL,
  winner_pair integer CHECK (winner_pair = ANY (ARRAY[1, 2])),
  match_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.pair_invites (
  id integer NOT NULL DEFAULT nextval('pair_invites_id_seq'::regclass),
  event_id integer NOT NULL,
  inviter_id uuid NOT NULL,
  invitee_email text,
  invitee_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'sent'::pair_invite_status,
  token text NOT NULL UNIQUE,
  short_code text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  CONSTRAINT pair_invites_pkey PRIMARY KEY (id),
  CONSTRAINT pair_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id),
  CONSTRAINT pair_invites_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.users(id),
  CONSTRAINT pair_invites_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.qualities (
  id integer NOT NULL DEFAULT nextval('qualities_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'Sparkles'::text,
  CONSTRAINT qualities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.registrations (
  id integer NOT NULL DEFAULT nextval('registrations_id_seq'::regclass),
  user_id uuid NOT NULL,
  event_id integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::registration_status,
  registered_at timestamp with time zone DEFAULT now(),
  pair_id uuid,
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.season_assignments (
  id bigint NOT NULL DEFAULT nextval('season_assignments_id_seq'::regclass),
  season_id bigint NOT NULL,
  entry_id bigint NOT NULL,
  request_id bigint NOT NULL,
  user_id uuid NOT NULL,
  group_size integer NOT NULL CHECK (group_size >= 1 AND group_size <= 4),
  allow_fill boolean NOT NULL DEFAULT false,
  payment_method USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'active'::weekly_assignment_status,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  unassigned_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT season_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT season_assignments_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons(id),
  CONSTRAINT season_assignments_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.season_week_entries(id),
  CONSTRAINT season_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT season_assignments_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.season_enrollment_requests(id)
);
CREATE TABLE public.season_direct_debit_details (
  id bigint NOT NULL DEFAULT nextval('season_direct_debit_details_id_seq'::regclass),
  request_id bigint NOT NULL UNIQUE,
  iban text,
  holder_name text,
  holder_address text,
  holder_dni text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT season_direct_debit_details_pkey PRIMARY KEY (id),
  CONSTRAINT season_direct_debit_details_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.season_enrollment_requests(id)
);
CREATE TABLE public.season_enrollment_requests (
  id bigint NOT NULL DEFAULT nextval('season_enrollment_requests_id_seq'::regclass),
  season_id bigint NOT NULL,
  user_id uuid NOT NULL,
  group_size integer NOT NULL CHECK (group_size >= 1 AND group_size <= 4),
  allow_fill boolean NOT NULL DEFAULT false,
  payment_method USER-DEFINED NOT NULL,
  observations text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::weekly_request_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT season_enrollment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT season_enrollment_requests_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons(id),
  CONSTRAINT season_enrollment_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.season_request_choices (
  id bigint NOT NULL DEFAULT nextval('season_request_choices_id_seq'::regclass),
  request_id bigint NOT NULL,
  entry_id bigint NOT NULL,
  preference smallint,
  CONSTRAINT season_request_choices_pkey PRIMARY KEY (id),
  CONSTRAINT season_request_choices_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.season_week_entries(id),
  CONSTRAINT season_request_choices_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.season_enrollment_requests(id)
);
CREATE TABLE public.season_request_participants (
  id bigint NOT NULL DEFAULT nextval('season_request_participants_id_seq'::regclass),
  request_id bigint NOT NULL,
  name text NOT NULL,
  phone text,
  dni text,
  CONSTRAINT season_request_participants_pkey PRIMARY KEY (id),
  CONSTRAINT season_request_participants_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.season_enrollment_requests(id)
);
CREATE TABLE public.season_week_entries (
  id bigint NOT NULL DEFAULT nextval('season_week_entries_id_seq'::regclass),
  season_id bigint NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  kind USER-DEFINED NOT NULL,
  location text NOT NULL DEFAULT 'Soses'::text,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  capacity integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT season_week_entries_pkey PRIMARY KEY (id),
  CONSTRAINT season_week_entries_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons(id)
);
CREATE TABLE public.seasons (
  id bigint NOT NULL DEFAULT nextval('seasons_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  date_start date NOT NULL,
  date_end date NOT NULL,
  enrollments_open boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'Europe/Madrid'::text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT seasons_pkey PRIMARY KEY (id),
  CONSTRAINT seasons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.user_matches (
  id integer NOT NULL DEFAULT nextval('user_matches_id_seq'::regclass),
  match_id integer NOT NULL,
  user_id uuid NOT NULL,
  position integer NOT NULL CHECK ("position" >= 1 AND "position" <= 4),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_matches_pkey PRIMARY KEY (id),
  CONSTRAINT user_matches_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id),
  CONSTRAINT user_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_qualities (
  id integer NOT NULL DEFAULT nextval('user_qualities_id_seq'::regclass),
  user_id uuid NOT NULL,
  quality_id integer NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_qualities_pkey PRIMARY KEY (id),
  CONSTRAINT user_qualities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_qualities_quality_id_fkey FOREIGN KEY (quality_id) REFERENCES public.qualities(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT auth.uid(),
  email text NOT NULL UNIQUE,
  name text,
  surname text,
  phone text,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  skill_level integer NOT NULL DEFAULT 0,
  trend USER-DEFINED NOT NULL DEFAULT 'same'::trend_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  observations text,
  image_rights_accepted boolean NOT NULL DEFAULT false,
  privacy_policy_accepted boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  shirt_size USER-DEFINED,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);