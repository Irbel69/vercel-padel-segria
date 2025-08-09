# Database Schema & Instructions

This document defines the Supabase (PostgreSQL) schema for the Padel Segrià project and provides guidelines for writing queries, migrations, and Copilot context.

## Naming Conventions

- Use snake_case for table and column names.
- Use plural table names (e.g., `users`, `events`).
- Primary keys named `id` (serial or UUID).
- Timestamps: `created_at`, `updated_at` with timezone.
- Define enums for fixed value sets (`event_status`, `registration_status`, `trend_status`, etc.).

## Enum Types

```sql
-- Status of an event or tournament
create type event_status as enum ('open', 'soon', 'closed');

-- Registration lifecycle
create type registration_status as enum ('pending', 'confirmed', 'cancelled');

-- Trend indicator for player rankings
create type trend_status as enum ('up', 'down', 'same');
```

## Tables

### 1. users

Stores authentication and profile information.

```sql
create table users (
	id uuid primary key default auth.uid(),
	email text not null unique,
	name text,
	surname text,
	phone text,
	avatar_url text,
	is_admin boolean not null default false,
	score integer not null default 0,
	skill_level integer not null default 0,
	trend trend_status not null default 'same',
	created_at timestamp with time zone default now(),
	updated_at timestamp with time zone default now(),
	observations text,
	image_rights_accepted boolean not null default false,
	privacy_policy_accepted boolean not null default false
);
```

### 2. events

Stores tournament and event details.

```sql
create table events (
	 id serial primary key,
	 title text not null,
	 date date not null,
	 location text,
	 status event_status not null default 'open',
	 prizes text,
	 max_participants integer not null,
	 registration_deadline date not null,
	 created_at timestamp with time zone default now(),
	 updated_at timestamp with time zone default now(),
	 latitude double precision,
	 longitude double precision
);
```

### 3. registrations

Tracks user registrations to events.

```sql
create table registrations (
	 id serial primary key,
	 user_id uuid not null references users(id) on delete cascade,
	 event_id integer not null references events(id) on delete cascade,
	 status registration_status not null default 'pending',
	 registered_at timestamp with time zone default now(),
	 unique (user_id, event_id)
);
```

### 4. qualities

Stores the list of predefined qualities that can be assigned to users.

```sql
create table qualities (
    id serial primary key,
    name text not null unique
);
```

### 5. user_qualities

Tracks the qualities assigned to each user by administrators.

```sql
create table user_qualities (
    id serial primary key,
    user_id uuid not null references users(id) on delete cascade,
    quality_id integer not null references qualities(id) on delete cascade,
    assigned_at timestamp with time zone default now(),
    unique (user_id, quality_id)
);
```

### 6. matches

Tracks match details including winners and event association.

```sql
create table matches (
    id serial primary key,
    event_id integer not null references events(id) on delete cascade,
    winner_id uuid references users(id),
    match_date timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
```

### 7. user_matches

Links users to matches with their positions.

```sql
create table user_matches (
    id serial primary key,
    user_id uuid not null references users(id) on delete cascade,
    match_id integer not null references matches(id) on delete cascade,
    position integer,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (user_id, match_id)
);
```

### Explanation

- **`qualities` table**: Contains the fixed list of qualities (e.g., Lideratge, Potència, etc.).
- **`user_qualities` table**: Links users to their assigned qualities. Each user can have up to 3 qualities assigned manually by administrators.
- **Flexibility**: Administrators can update or remove qualities as needed. The `assigned_at` field tracks when a quality was assigned.

## Query Guidelines

- Reference this schema when writing SQL or Supabase client calls.
- Use parameterized queries: e.g., `.select('*').eq('status', 'open')`.
- Respect Row-Level Security (RLS): limit `user_id = auth.uid()` for private tables.
- Use explicit `JOIN` clauses and select only required columns.
- Update `updated_at` on every modification.
- Write reversible migrations and include them under `supabase/migrations`.

## Copilot Context

Include this document as context in all Copilot queries related to database operations to ensure consistency with the schema, naming conventions, and policies.

## Current Database Tables

As of August 7, 2025, the database contains the following tables:

1. **users** - User authentication and profile information
2. **events** - Tournament and event details with location coordinates
3. **registrations** - Tracks user registrations to events
4. **qualities** - Predefined qualities that can be assigned to users
5. **user_qualities** - Links between users and their assigned qualities
6. **matches** - Tracks match details including winners and event association
7. **user_matches** - Links users to matches with their positions

All tables have proper Row-Level Security (RLS) enabled for data protection.
