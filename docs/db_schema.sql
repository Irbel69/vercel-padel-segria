-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lesson_availability_overrides (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  time_start time without time zone,
  time_end time without time zone,
  kind USER-DEFINED NOT NULL DEFAULT 'closed'::override_kind,
  reason text,
  location text NOT NULL DEFAULT 'Soses'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_availability_overrides_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lesson_availability_rules (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text,
  valid_from date,
  valid_to date,
  days_of_week ARRAY NOT NULL,
  time_start time without time zone NOT NULL,
  time_end time without time zone NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  location text NOT NULL DEFAULT 'Soses'::text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_availability_rules_pkey PRIMARY KEY (id)
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
  status USER-DEFINED NOT NULL DEFAULT 'pending'::booking_status,
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
CREATE TABLE public.lesson_slots (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  max_capacity integer NOT NULL DEFAULT 4 CHECK (max_capacity >= 1 AND max_capacity <= 4),
  location text NOT NULL DEFAULT 'Soses'::text,
  status USER-DEFINED NOT NULL DEFAULT 'open'::lesson_slot_status,
  joinable boolean NOT NULL DEFAULT true,
  locked_by_booking_id bigint,
  created_from_rule_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_slots_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_slots_created_from_rule_id_fkey FOREIGN KEY (created_from_rule_id) REFERENCES public.lesson_availability_rules(id)
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
  CONSTRAINT pair_invites_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT pair_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id),
  CONSTRAINT pair_invites_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.users(id)
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
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
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
  CONSTRAINT users_pkey PRIMARY KEY (id)
);