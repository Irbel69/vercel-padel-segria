-- Seasons Module Migration
-- Order: types -> tables -> views -> functions/triggers -> indexes -> RLS policies
-- This module is independent from existing lessons/slots/bookings tables.

-- =============================
--  ENUM TYPES
-- =============================
DO $$ BEGIN
	CREATE TYPE weekly_entry_kind        AS ENUM ('class','break');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE TYPE weekly_request_status    AS ENUM ('pending','approved','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE TYPE weekly_assignment_status AS ENUM ('active','cancelled','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE TYPE weekly_payment_method    AS ENUM ('cash','bizum','direct_debit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================
--  TABLES
-- =============================
CREATE TABLE IF NOT EXISTS public.seasons (
	id              bigserial PRIMARY KEY,
	name            text        NOT NULL UNIQUE,              -- Ej: "Temporada 25-26"
	date_start      date        NOT NULL,
	date_end        date        NOT NULL,
	enrollments_open boolean    NOT NULL DEFAULT false,       -- Abrir / cerrar inscripciones
	timezone        text        NOT NULL DEFAULT 'Europe/Madrid',
	created_by      uuid        REFERENCES public.users(id),
	created_at      timestamptz NOT NULL DEFAULT now(),
	updated_at      timestamptz NOT NULL DEFAULT now(),
	CHECK (date_start <= date_end)
);

COMMENT ON TABLE public.seasons IS 'Temporadas semanales para clases (sistema paralelo a lessons).';

CREATE TABLE IF NOT EXISTS public.season_week_entries (
	id            bigserial PRIMARY KEY,
	season_id     bigint      NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
	day_of_week   smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo .. 6=Sábado
	kind          weekly_entry_kind NOT NULL,           -- class | break
	location      text        NOT NULL DEFAULT 'Soses',
	note          text,                                  -- comentario opcional
	start_time    time        NOT NULL,
	end_time      time        NOT NULL,
	capacity      integer,                               -- solo para kind='class'
	created_at    timestamptz NOT NULL DEFAULT now(),
	updated_at    timestamptz NOT NULL DEFAULT now(),
	CHECK (end_time > start_time),
	CHECK (kind <> 'class' OR (capacity IS NOT NULL AND capacity BETWEEN 1 AND 4)),
	CHECK (kind <> 'break' OR capacity IS NULL),
	UNIQUE (season_id, day_of_week, start_time)
);
COMMENT ON TABLE public.season_week_entries IS 'Patrón semanal modular de una temporada';

CREATE TABLE IF NOT EXISTS public.season_enrollment_requests (
	id              bigserial PRIMARY KEY,
	season_id       bigint   NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
	user_id         uuid     NOT NULL REFERENCES public.users(id),
	group_size      integer  NOT NULL CHECK (group_size BETWEEN 1 AND 4),
	allow_fill      boolean  NOT NULL DEFAULT false,
	payment_method  weekly_payment_method NOT NULL,
	observations    text,
	status          weekly_request_status NOT NULL DEFAULT 'pending',
	created_at      timestamptz NOT NULL DEFAULT now(),
	updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.season_enrollment_requests IS 'Solicitudes de inscripción de usuarios a una temporada.';

-- Un usuario no puede tener más de una solicitud activa (pending/approved) por temporada
CREATE UNIQUE INDEX IF NOT EXISTS season_request_unique_active
	ON public.season_enrollment_requests (season_id, user_id)
	WHERE status IN ('pending','approved');

CREATE TABLE IF NOT EXISTS public.season_request_participants (
	id          bigserial PRIMARY KEY,
	request_id  bigint NOT NULL REFERENCES public.season_enrollment_requests(id) ON DELETE CASCADE,
	name        text   NOT NULL,
	is_primary  boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public.season_request_participants IS 'Participantes adicionales de una solicitud (group_size>1).';

CREATE TABLE IF NOT EXISTS public.season_request_choices (
	id          bigserial PRIMARY KEY,
	request_id  bigint NOT NULL REFERENCES public.season_enrollment_requests(id) ON DELETE CASCADE,
	entry_id    bigint NOT NULL REFERENCES public.season_week_entries(id) ON DELETE CASCADE,
	preference  smallint,
	UNIQUE (request_id, entry_id)
);
COMMENT ON TABLE public.season_request_choices IS 'Entradas (clases) del patrón semanal que un usuario acepta asistir.';

CREATE TABLE IF NOT EXISTS public.season_direct_debit_details (
	id             bigserial PRIMARY KEY,
	request_id     bigint NOT NULL UNIQUE REFERENCES public.season_enrollment_requests(id) ON DELETE CASCADE,
	iban           text,
	holder_name    text,
	holder_address text,
	holder_dni     text,
	created_at     timestamptz NOT NULL DEFAULT now(),
	updated_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.season_direct_debit_details IS 'Datos SEPA para solicitudes con pago por domiciliación.';

CREATE TABLE IF NOT EXISTS public.season_assignments (
	id              bigserial PRIMARY KEY,
	season_id       bigint NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
	entry_id        bigint NOT NULL REFERENCES public.season_week_entries(id) ON DELETE RESTRICT,
	request_id      bigint NOT NULL REFERENCES public.season_enrollment_requests(id) ON DELETE RESTRICT,
	user_id         uuid   NOT NULL REFERENCES public.users(id), -- redundante para fácil acceso
	group_size      integer NOT NULL CHECK (group_size BETWEEN 1 AND 4),
	allow_fill      boolean NOT NULL DEFAULT false,
	payment_method  weekly_payment_method NOT NULL,
	status          weekly_assignment_status NOT NULL DEFAULT 'active',
	assigned_at     timestamptz NOT NULL DEFAULT now(),
	unassigned_at   timestamptz,
	created_at      timestamptz NOT NULL DEFAULT now(),
	updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.season_assignments IS 'Asignaciones de solicitudes a una clase concreta del patrón semanal.';

-- 1 asignación activa por temporada & usuario
CREATE UNIQUE INDEX IF NOT EXISTS season_assignment_unique_active
	ON public.season_assignments(season_id, user_id)
	WHERE status = 'active';

-- =============================
--  VIEWS
-- =============================
CREATE OR REPLACE VIEW public.open_enrollment_season AS
SELECT s.*
FROM public.seasons s
WHERE s.enrollments_open
	AND current_date BETWEEN s.date_start AND s.date_end
ORDER BY s.date_start DESC
LIMIT 1;

-- Vista de carga/capacidad por entrada
CREATE OR REPLACE VIEW public.season_entry_load AS
SELECT e.*,
			 COALESCE(SUM(a.group_size) FILTER (WHERE a.status='active'),0) AS assigned_group_size,
			 CASE WHEN e.kind='class' THEN e.capacity - COALESCE(SUM(a.group_size) FILTER (WHERE a.status='active'),0) END AS remaining_capacity
FROM public.season_week_entries e
LEFT JOIN public.season_assignments a ON a.entry_id = e.id AND a.status='active'
GROUP BY e.id;

-- =============================
--  FUNCTIONS & TRIGGERS
-- =============================
-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;$$;

-- Apply updated_at triggers
DO $$ BEGIN
	CREATE TRIGGER trg_seasons_updated_at BEFORE UPDATE ON public.seasons
		FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE TRIGGER trg_season_week_entries_updated_at BEFORE UPDATE ON public.season_week_entries
		FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE TRIGGER trg_season_enrollment_requests_updated_at BEFORE UPDATE ON public.season_enrollment_requests
		FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE TRIGGER trg_season_direct_debit_details_updated_at BEFORE UPDATE ON public.season_direct_debit_details
		FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE TRIGGER trg_season_assignments_updated_at BEFORE UPDATE ON public.season_assignments
		FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Capacity / integrity enforcement for assignments
CREATE OR REPLACE FUNCTION public.check_season_assignment()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
	v_kind weekly_entry_kind;
	v_capacity integer;
	v_entry_season bigint;
	v_request_season bigint;
	v_current_assigned integer;
	v_request_status weekly_request_status;
BEGIN
	-- Fetch entry details
	SELECT kind, capacity, season_id INTO v_kind, v_capacity, v_entry_season
	FROM public.season_week_entries WHERE id = NEW.entry_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Entry % not found', NEW.entry_id;
	END IF;

	-- Fetch request season & status
	SELECT season_id, status INTO v_request_season, v_request_status
	FROM public.season_enrollment_requests WHERE id = NEW.request_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Request % not found', NEW.request_id;
	END IF;

	-- Cross-season consistency
	IF v_entry_season <> NEW.season_id OR v_request_season <> NEW.season_id THEN
		RAISE EXCEPTION 'Season mismatch between assignment, request y entry';
	END IF;

	-- Ensure entry kind
	IF v_kind <> 'class' THEN
		RAISE EXCEPTION 'Solo se pueden asignar solicitudes a entries kind=class';
	END IF;

	-- Ensure chosen by user
	IF NOT EXISTS (
		SELECT 1 FROM public.season_request_choices c
		WHERE c.request_id = NEW.request_id AND c.entry_id = NEW.entry_id
	) THEN
		RAISE EXCEPTION 'La entrada % no figura entre las elecciones del request %', NEW.entry_id, NEW.request_id;
	END IF;

	-- Capacity check if active
	IF NEW.status = 'active' THEN
		SELECT COALESCE(SUM(a.group_size),0) INTO v_current_assigned
		FROM public.season_assignments a
		WHERE a.entry_id = NEW.entry_id
			AND a.status='active'
			AND (TG_OP = 'INSERT' OR a.id <> NEW.id);

		IF v_current_assigned + NEW.group_size > v_capacity THEN
			RAISE EXCEPTION 'Capacidad excedida para entry %, capacidad %, asignado %, nuevo grupo %', NEW.entry_id, v_capacity, v_current_assigned, NEW.group_size;
		END IF;
	END IF;

	-- Auto-update request status if still pending -> approved
	IF v_request_status = 'pending' THEN
		UPDATE public.season_enrollment_requests
			SET status='approved', updated_at=now()
			WHERE id = NEW.request_id;
	END IF;

	RETURN NEW;
END;$$;

DO $$ BEGIN
	CREATE TRIGGER trg_check_season_assignment
		BEFORE INSERT OR UPDATE ON public.season_assignments
		FOR EACH ROW EXECUTE FUNCTION public.check_season_assignment();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================
--  INDEXES (besides UNIQUE / partial ones already created)
-- =============================
CREATE INDEX IF NOT EXISTS idx_season_week_entries_season_day ON public.season_week_entries(season_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_season_enrollment_requests_season ON public.season_enrollment_requests(season_id);
CREATE INDEX IF NOT EXISTS idx_season_assignments_entry ON public.season_assignments(entry_id);
CREATE INDEX IF NOT EXISTS idx_season_assignments_user ON public.season_assignments(user_id);

-- =============================
--  RLS POLICIES
-- =============================
ALTER TABLE public.seasons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_week_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_request_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_request_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_direct_debit_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_assignments    ENABLE ROW LEVEL SECURITY;

-- Helper expression: admin check via subquery on users
-- Seasons & week entries: read for all authenticated, write only admin
DO $$ BEGIN
	CREATE POLICY seasons_select ON public.seasons
		FOR SELECT USING ( auth.role() = 'authenticated' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE POLICY seasons_write ON public.seasons
		FOR ALL USING (
			EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)
		) WITH CHECK (
			EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
	CREATE POLICY week_entries_select ON public.season_week_entries
		FOR SELECT USING ( auth.role() = 'authenticated' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE POLICY week_entries_write ON public.season_week_entries
		FOR ALL USING (
			EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)
		) WITH CHECK (
			EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Requests & related: owner or admin
DO $$ BEGIN
	CREATE POLICY requests_select ON public.season_enrollment_requests
		FOR SELECT USING (
			auth.role() = 'authenticated' AND (
				user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE POLICY requests_write ON public.season_enrollment_requests
		FOR ALL USING (
			(auth.role()='authenticated' AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)))
		) WITH CHECK (
			(auth.role()='authenticated' AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin)))
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Participants
DO $$ BEGIN
	CREATE POLICY request_participants_select ON public.season_request_participants
		FOR SELECT USING (
			auth.role()='authenticated' AND (
				EXISTS (
					SELECT 1 FROM public.season_enrollment_requests r
					WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
				)
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE POLICY request_participants_write ON public.season_request_participants
		FOR ALL USING (
			EXISTS (
				SELECT 1 FROM public.season_enrollment_requests r
				WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
			)
		) WITH CHECK (
			EXISTS (
				SELECT 1 FROM public.season_enrollment_requests r
				WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Choices
DO $$ BEGIN
	CREATE POLICY request_choices_select ON public.season_request_choices
		FOR SELECT USING (
			auth.role()='authenticated' AND (
				EXISTS (
					SELECT 1 FROM public.season_enrollment_requests r
					WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
				)
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE POLICY request_choices_write ON public.season_request_choices
		FOR ALL USING (
			EXISTS (
				SELECT 1 FROM public.season_enrollment_requests r
				WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
			)
		) WITH CHECK (
			EXISTS (
				SELECT 1 FROM public.season_enrollment_requests r
				WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Direct debit details
DO $$ BEGIN
	CREATE POLICY direct_debit_select ON public.season_direct_debit_details
		FOR SELECT USING (
			auth.role()='authenticated' AND (
				EXISTS (
					SELECT 1 FROM public.season_enrollment_requests r
					WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
				)
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE POLICY direct_debit_write ON public.season_direct_debit_details
		FOR ALL USING (
			EXISTS (
				SELECT 1 FROM public.season_enrollment_requests r
				WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
			)
		) WITH CHECK (
			EXISTS (
				SELECT 1 FROM public.season_enrollment_requests r
				WHERE r.id = request_id AND (r.user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin))
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Assignments: owner (user_id) or admin can view; only admin can modify
DO $$ BEGIN
	CREATE POLICY assignments_select ON public.season_assignments
		FOR SELECT USING (
			auth.role()='authenticated' AND (
				user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin)
			)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
	CREATE POLICY assignments_admin_write ON public.season_assignments
		FOR ALL USING (
			EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin)
		) WITH CHECK (
			EXISTS (SELECT 1 FROM public.users u WHERE u.id=auth.uid() AND u.is_admin)
		);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================
-- END OF MIGRATION
-- =============================

