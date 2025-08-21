-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.events (
  title text NOT NULL,
  date date NOT NULL,
  location text,
  prizes text,
  max_participants integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::event_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass),
  latitude double precision,
  longitude double precision,
  registration_deadline timestamp with time zone NOT NULL,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.matches (
  event_id integer NOT NULL,
  winner_pair integer CHECK (winner_pair = ANY (ARRAY[1, 2])),
  id integer NOT NULL DEFAULT nextval('matches_id_seq'::regclass),
  match_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.pair_invites (
  event_id integer NOT NULL,
  inviter_id uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  id integer NOT NULL DEFAULT nextval('pair_invites_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  invitee_email text,
  invitee_id uuid,
  token text NOT NULL UNIQUE,
  short_code text NOT NULL UNIQUE,
  status USER-DEFINED NOT NULL DEFAULT 'sent'::pair_invite_status,
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  CONSTRAINT pair_invites_pkey PRIMARY KEY (id),
  CONSTRAINT pair_invites_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT pair_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id),
  CONSTRAINT pair_invites_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.users(id)
);
CREATE TABLE public.qualities (
  name text NOT NULL UNIQUE,
  id integer NOT NULL DEFAULT nextval('qualities_id_seq'::regclass),
  icon text NOT NULL DEFAULT 'Sparkles'::text,
  CONSTRAINT qualities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.registrations (
  user_id uuid NOT NULL,
  event_id integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::registration_status,
  registered_at timestamp with time zone DEFAULT now(),
  id integer NOT NULL DEFAULT nextval('registrations_id_seq'::regclass),
  pair_id uuid,
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.user_matches (
  match_id integer NOT NULL,
  user_id uuid NOT NULL,
  position integer NOT NULL CHECK ("position" >= 1 AND "position" <= 4),
  id integer NOT NULL DEFAULT nextval('user_matches_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_matches_pkey PRIMARY KEY (id),
  CONSTRAINT user_matches_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id),
  CONSTRAINT user_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_qualities (
  user_id uuid NOT NULL,
  quality_id integer NOT NULL,
  id integer NOT NULL DEFAULT nextval('user_qualities_id_seq'::regclass),
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_qualities_pkey PRIMARY KEY (id),
  CONSTRAINT user_qualities_quality_id_fkey FOREIGN KEY (quality_id) REFERENCES public.qualities(id),
  CONSTRAINT user_qualities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  email text NOT NULL UNIQUE,
  name text,
  surname text,
  phone text,
  avatar_url text,
  observations text,
  id uuid NOT NULL DEFAULT auth.uid(),
  is_admin boolean NOT NULL DEFAULT false,
  skill_level integer NOT NULL DEFAULT 0,
  trend USER-DEFINED NOT NULL DEFAULT 'same'::trend_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_rights_accepted boolean NOT NULL DEFAULT false,
  privacy_policy_accepted boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);