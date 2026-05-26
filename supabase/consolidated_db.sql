-- -- Enable Row Level Security
-- alter table auth.users enable row level security;

-- Enums
create type user_role as enum ('organizer', 'coach', 'admin');

create type event_type as enum ('tournament', 'seminar', 'test');

create type event_level as enum ('district', 'state', 'national', 'international');

create type entry_status as enum ('draft', 'submitted', 'approved', 'rejected');

-- Profiles (extends Supabase Auth)
create table profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    role user_role default 'coach',
    full_name text,
    created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Dojos (Managed by Coaches)
create table dojos (
    id uuid default gen_random_uuid () primary key,
    coach_id uuid references profiles (id) not null,
    name text not null,
    created_at timestamptz default now()
);

alter table dojos enable row level security;

-- Students (Belong to a Dojos)
create table students (
    id uuid default gen_random_uuid () primary key,
    dojo_id uuid references dojos (id) on delete cascade,
    name text not null,
    gender text not null, -- 'male', 'female'
    date_of_birth date,
    weight numeric, -- in kg
    rank text, -- 'white', 'yellow', 'brown_3', etc.
    generic_checked boolean not null default false,
    created_at timestamptz default now()
);

alter table students enable row level security;

-- Events (Managed by Organizers)
create table events (
    id uuid default gen_random_uuid () primary key,
    organizer_id uuid references profiles (id) not null,
    title text not null,
    description text,
    event_type event_type not null,
    event_level event_level,
    start_date date not null,
    end_date date not null,
    location text,
    is_public boolean default false,
    created_at timestamptz default now()
);

alter table events enable row level security;

-- Event Days (For multi-day events)
create table event_days (
    id uuid default gen_random_uuid () primary key,
    event_id uuid references events (id) on delete cascade,
    date date not null,
    name text -- e.g., "Day 1 - Kata"
);

alter table event_days enable row level security;

-- Categories (For Tournaments)
create table categories (
    id uuid default gen_random_uuid () primary key,
    event_id uuid references events (id) on delete cascade,
    name text not null, -- e.g., "Boys 10-12yrs White-Green"
    gender text, -- 'male', 'female', 'mixed'
    min_age int,
    max_age int,
    min_weight numeric,
    max_weight numeric,
    min_rank text, -- simple text for matching or int if we formalize ranks
    max_rank text
);

alter table categories enable row level security;

-- Coach Requests (Permission to join event)
create table event_applications (
    id uuid default gen_random_uuid () primary key,
    event_id uuid references events (id) on delete cascade,
    coach_id uuid references profiles (id) on delete cascade,
    status text default 'pending', -- pending, approved, rejected
    created_at timestamptz default now(),
    unique (event_id, coach_id)
);

alter table event_applications enable row level security;

-- Entries (The core participation record)
create table entries (
    id uuid default gen_random_uuid () primary key,
    event_id uuid references events (id) on delete cascade,
    coach_id uuid references profiles (id) not null,
    student_id uuid references students (id) not null,
    category_id uuid references categories (id), -- Nullable for Seminars
    event_day_id uuid references event_days (id),
    participation_type text, -- 'kata', 'kumite', 'both'
    status entry_status default 'draft',
    created_at timestamptz default now()
);

alter table entries enable row level security;

-- POLICIES --

-- Profiles:
-- Public read for now (or restricted to auth users)
create policy "Public profiles are viewable by everyone" on profiles for
select using (true);
-- Users can insert their own profile
create policy "Users can insert their own profile" on profiles for
insert
with
    check (
        auth.uid () = id
        and role = 'coach'
    );
-- Users can update own profile
create policy "Users can update own profile" on profiles for
update using (auth.uid () = id)
with
    check (
        auth.uid () = id
        and role = (
            select role
            from profiles
            where
                id = auth.uid ()
        )
    );

-- Dojos:
-- Coaches can view/edit their own dojos.
create policy "Coaches view own dojos" on dojos for
select using (
        auth.uid () = coach_id
        and exists (
            select 1
            from profiles
            where
                id = auth.uid ()
                and role in ('coach', 'admin')
        )
    );

create policy "Coaches insert own dojos" on dojos for
insert
with
    check (
        auth.uid () = coach_id
        and exists (
            select 1
            from profiles
            where
                id = auth.uid ()
                and role in ('coach', 'admin')
        )
    );

create policy "Coaches update own dojos" on dojos for
update using (
    auth.uid () = coach_id
    and exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and role in ('coach', 'admin')
    )
);

create policy "Coaches delete own dojos" on dojos for delete using (
    auth.uid () = coach_id
    and exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and role in ('coach', 'admin')
    )
);

-- Students:
-- Coaches can manage students in their dojos.
-- Need a join check or simple helper if possible, but standard RLS relies on direct relationship or subquery.
create policy "Coaches manage their students" on students using (
    exists (
        select 1
        from dojos
        where
            dojos.id = students.dojo_id
            and dojos.coach_id = auth.uid ()
    )
    and exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and role in ('coach', 'admin')
    )
);

-- Events:
-- Public events are viewable by everyone.
create policy "Public events are viewable by everyone" on events for
select using (is_public = true);
-- Organizers can manage their own events.
create policy "Organizers manage own events" on events using (
    auth.uid () = organizer_id
    and exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and role in ('organizer', 'admin')
    )
)
with
    check (
        auth.uid () = organizer_id
        and exists (
            select 1
            from profiles
            where
                id = auth.uid ()
                and role in ('organizer', 'admin')
        )
    );

-- Categories/EventDays:
-- Viewable by everyone (if event is visible/public).
create policy "View categories" on categories for
select using (true);
-- Organizers manage.
create policy "Organizers manage categories" on categories using (
    exists (
        select 1
        from events
        where
            events.id = categories.event_id
            and events.organizer_id = auth.uid ()
            and exists (
                select 1
                from profiles
                where
                    id = auth.uid ()
                    and role in ('organizer', 'admin')
            )
    )
);

create policy "View event days" on event_days for
select using (true);

create policy "Organizers manage event days" on event_days using (
    exists (
        select 1
        from events
        where
            events.id = event_days.event_id
            and events.organizer_id = auth.uid ()
            and exists (
                select 1
                from profiles
                where
                    id = auth.uid ()
                    and role in ('organizer', 'admin')
            )
    )
);

-- Entries:
-- Coaches can view/create entries for their students.
create policy "Coaches manage own entries" on entries using (
    auth.uid () = coach_id
    and exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and role in ('coach', 'admin')
    )
);
-- Organizers can view entries for their events.
create policy "Organizers view entries for their events" on entries for
select using (
        exists (
            select 1
            from events
            where
                events.id = entries.event_id
                and events.organizer_id = auth.uid ()
                and exists (
                    select 1
                    from profiles
                    where
                        id = auth.uid ()
                        and role in ('organizer', 'admin')
                )
        )
    );
-- Organizers can update status of entries.
create policy "Organizers update entries" on entries for
update using (
    exists (
        select 1
        from events
        where
            events.id = entries.event_id
            and events.organizer_id = auth.uid ()
            and exists (
                select 1
                from profiles
                where
                    id = auth.uid ()
                    and role in ('organizer', 'admin')
            )
    )
);

-- Event Applications:
-- Coaches can create applications.
create policy "Coaches apply" on event_applications for
insert
with
    check (
        auth.uid () = coach_id
        and exists (
            select 1
            from profiles
            where
                id = auth.uid ()
                and role in ('coach', 'admin')
        )
    );

create policy "Coaches view own applications" on event_applications for
select using (
        auth.uid () = coach_id
        and exists (
            select 1
            from profiles
            where
                id = auth.uid ()
                and role in ('coach', 'admin')
        )
    );
-- Organizers manage applications.
create policy "Organizers manage applications" on event_applications using (
    exists (
        select 1
        from events
        where
            events.id = event_applications.event_id
            and events.organizer_id = auth.uid ()
            and exists (
                select 1
                from profiles
                where
                    id = auth.uid ()
                    and role in ('organizer', 'admin')
            )
    )
);

-- Views
-- Create a specific view for Organizers to see all entry details for their events
create or replace view organizer_entries_view as
select e.id as entry_id, e.event_id, e.status, e.participation_type, e.created_at, e.coach_id, e.event_day_id, e.category_id, e.student_id,

-- Student info
s.name as student_name,
s.rank as student_rank,
s.gender as student_gender,
s.weight as student_weight,
s.date_of_birth as student_dob,

-- Dojo info
d.name as dojo_name,

-- Category info
c.name as category_name,

-- Day info
ed.name as event_day_name, ed.date as event_day_date,

-- Coach info
p.full_name as coach_name, p.email as coach_email,

-- Event Organizer ID for filtering
ev.organizer_id
from
    entries e
    join students s on e.student_id = s.id
    left join dojos d on s.dojo_id = d.id
    left join categories c on e.category_id = c.id
    left join event_days ed on e.event_day_id = ed.id
    join profiles p on e.coach_id = p.id
    join events ev on e.event_id = ev.id
where
    ev.organizer_id = auth.uid ()
    and exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and role in ('organizer', 'admin')
    );

-- Grant access to authenticated users
grant select on organizer_entries_view to authenticated;

-- Update-only migration: role-based RLS and organizer view hardening

ALTER TABLE students
ADD COLUMN IF NOT EXISTS generic_checked boolean NOT NULL DEFAULT false;

-- POLICIES: drop old, recreate new
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Coaches view own dojos" ON dojos;

DROP POLICY IF EXISTS "Coaches insert own dojos" ON dojos;

DROP POLICY IF EXISTS "Coaches update own dojos" ON dojos;

DROP POLICY IF EXISTS "Coaches delete own dojos" ON dojos;

DROP POLICY IF EXISTS "Coaches manage their students" ON students;

DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;

DROP POLICY IF EXISTS "Organizers manage own events" ON events;

DROP POLICY IF EXISTS "View categories" ON categories;

DROP POLICY IF EXISTS "Organizers manage categories" ON categories;

DROP POLICY IF EXISTS "View event days" ON event_days;

DROP POLICY IF EXISTS "Organizers manage event days" ON event_days;

DROP POLICY IF EXISTS "Coaches manage own entries" ON entries;

DROP POLICY IF EXISTS "Organizers view entries for their events" ON entries;

DROP POLICY IF EXISTS "Organizers update entries" ON entries;

DROP POLICY IF EXISTS "Coaches apply" ON event_applications;

DROP POLICY IF EXISTS "Coaches view own applications" ON event_applications;

DROP POLICY IF EXISTS "Organizers manage applications" ON event_applications;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR
SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles FOR
INSERT
WITH
    CHECK (
        auth.uid () = id
        AND role = 'coach'
    );

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid () = id)
WITH
    CHECK (
        auth.uid () = id
        AND role = (
            SELECT role
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

-- Dojos
CREATE POLICY "Coaches view own dojos" ON dojos FOR
SELECT USING (
        auth.uid () = coach_id
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('coach', 'admin')
        )
    );

CREATE POLICY "Coaches insert own dojos" ON dojos FOR
INSERT
WITH
    CHECK (
        auth.uid () = coach_id
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('coach', 'admin')
        )
    );

CREATE POLICY "Coaches update own dojos" ON dojos FOR
UPDATE USING (
    auth.uid () = coach_id
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('coach', 'admin')
    )
);

CREATE POLICY "Coaches delete own dojos" ON dojos FOR DELETE USING (
    auth.uid () = coach_id
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('coach', 'admin')
    )
);

-- Students
CREATE POLICY "Coaches manage their students" ON students USING (
    EXISTS (
        SELECT 1
        FROM dojos
        WHERE
            dojos.id = students.dojo_id
            AND dojos.coach_id = auth.uid ()
    )
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('coach', 'admin')
    )
);

-- Events
CREATE POLICY "Public events are viewable by everyone" ON events FOR
SELECT USING (is_public = true);

CREATE POLICY "Organizers manage own events" ON events USING (
    auth.uid () = organizer_id
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('organizer', 'admin')
    )
)
WITH
    CHECK (
        auth.uid () = organizer_id
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('organizer', 'admin')
        )
    );

-- Categories / Event Days
CREATE POLICY "View categories" ON categories FOR
SELECT USING (true);

CREATE POLICY "Organizers manage categories" ON categories USING (
    EXISTS (
        SELECT 1
        FROM events
        WHERE
            events.id = categories.event_id
            AND events.organizer_id = auth.uid ()
            AND EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    id = auth.uid ()
                    AND role IN ('organizer', 'admin')
            )
    )
);

CREATE POLICY "View event days" ON event_days FOR
SELECT USING (true);

CREATE POLICY "Organizers manage event days" ON event_days USING (
    EXISTS (
        SELECT 1
        FROM events
        WHERE
            events.id = event_days.event_id
            AND events.organizer_id = auth.uid ()
            AND EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    id = auth.uid ()
                    AND role IN ('organizer', 'admin')
            )
    )
);

-- Entries
CREATE POLICY "Coaches manage own entries" ON entries USING (
    auth.uid () = coach_id
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('coach', 'admin')
    )
);

CREATE POLICY "Organizers view entries for their events" ON entries FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM events
            WHERE
                events.id = entries.event_id
                AND events.organizer_id = auth.uid ()
                AND EXISTS (
                    SELECT 1
                    FROM profiles
                    WHERE
                        id = auth.uid ()
                        AND role IN ('organizer', 'admin')
                )
        )
    );

CREATE POLICY "Organizers update entries" ON entries FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM events
        WHERE
            events.id = entries.event_id
            AND events.organizer_id = auth.uid ()
            AND EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    id = auth.uid ()
                    AND role IN ('organizer', 'admin')
            )
    )
);

-- Event Applications
CREATE POLICY "Coaches apply" ON event_applications FOR
INSERT
WITH
    CHECK (
        auth.uid () = coach_id
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('coach', 'admin')
        )
    );

CREATE POLICY "Coaches view own applications" ON event_applications FOR
SELECT USING (
        auth.uid () = coach_id
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('coach', 'admin')
        )
    );

CREATE POLICY "Organizers manage applications" ON event_applications USING (
    EXISTS (
        SELECT 1
        FROM events
        WHERE
            events.id = event_applications.event_id
            AND events.organizer_id = auth.uid ()
            AND EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    id = auth.uid ()
                    AND role IN ('organizer', 'admin')
            )
    )
);

-- View update
CREATE OR REPLACE VIEW organizer_entries_view AS
SELECT e.id AS entry_id, e.event_id, e.status, e.participation_type, e.created_at, e.coach_id, e.event_day_id, e.category_id, e.student_id,

-- Student info
s.name AS student_name,
s.rank AS student_rank,
s.gender AS student_gender,
s.weight AS student_weight,
s.date_of_birth AS student_dob,

-- Dojo info
d.name AS dojo_name,

-- Category info
c.name AS category_name,

-- Day info
ed.name AS event_day_name, ed.date AS event_day_date,

-- Coach info
p.full_name AS coach_name, p.email AS coach_email,

-- Event Organizer ID for filtering
ev.organizer_id
FROM
    entries e
    JOIN students s ON e.student_id = s.id
    LEFT JOIN dojos d ON s.dojo_id = d.id
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN event_days ed ON e.event_day_id = ed.id
    JOIN profiles p ON e.coach_id = p.id
    JOIN events ev ON e.event_id = ev.id
WHERE
    ev.organizer_id = auth.uid ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('organizer', 'admin')
    );

GRANT SELECT ON organizer_entries_view TO authenticated;

-- Prevent accidental duplicate event creation for the same organizer.
-- Treats case and NULL/empty location consistently.
CREATE UNIQUE INDEX IF NOT EXISTS events_dedupe_unique_idx ON events (
    organizer_id,
    lower(title),
    event_type,
    start_date,
    end_date,
    lower(coalesce(location, ''))
);

-- Migration to add student registration IDs and entry chest numbers

-- 1. Student Registration IDs
CREATE SEQUENCE IF NOT EXISTS student_reg_seq;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS registration_no TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_student_registration_no()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_val INTEGER;
BEGIN
    year_prefix := 'SK' || to_char(now(), 'YY');
    SELECT nextval('student_reg_seq') INTO next_val;
    NEW.registration_no := year_prefix || '-' || LPAD(next_val::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_student_registration_no ON public.students;
CREATE TRIGGER tr_generate_student_registration_no
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION generate_student_registration_no();

-- 2. Entry Chest Numbers
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS chest_no INTEGER;

CREATE OR REPLACE FUNCTION assign_chest_no_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    next_chest_no INTEGER;
BEGIN
    -- Only assign chest_no if status is changing to 'approved' and chest_no is not already set
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.chest_no IS NULL) THEN
        SELECT COALESCE(MAX(chest_no), 0) + 1
        INTO next_chest_no
        FROM public.entries
        WHERE event_id = NEW.event_id;
        
        NEW.chest_no := next_chest_no;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_assign_chest_no_on_approval ON public.entries;
CREATE TRIGGER tr_assign_chest_no_on_approval
BEFORE UPDATE ON public.entries
FOR EACH ROW
EXECUTE FUNCTION assign_chest_no_on_approval();

-- 3. Update Organizer View to include the new columns
DROP VIEW IF EXISTS organizer_entries_view CASCADE;

CREATE OR REPLACE VIEW organizer_entries_view AS
SELECT 
    e.id AS entry_id, 
    e.event_id, 
    e.status, 
    e.participation_type, 
    e.created_at, 
    e.coach_id, 
    e.event_day_id, 
    e.category_id, 
    e.student_id,
    e.chest_no, -- Added chest_no

    -- Student info
    s.name AS student_name,
    s.rank AS student_rank,
    s.gender AS student_gender,
    s.weight AS student_weight,
    s.date_of_birth AS student_dob,
    s.registration_no AS student_registration_no, -- Added registration_no

    -- Dojo info
    d.name AS dojo_name,

    -- Category info
    c.name AS category_name,

    -- Day info
    ed.name AS event_day_name, 
    ed.date AS event_day_date,

    -- Coach info
    p.full_name AS coach_name, 
    p.email AS coach_email,

    -- Event Organizer ID for filtering
    ev.organizer_id
FROM
    entries e
    JOIN students s ON e.student_id = s.id
    LEFT JOIN dojos d ON s.dojo_id = d.id
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN event_days ed ON e.event_day_id = ed.id
    JOIN profiles p ON e.coach_id = p.id
    JOIN events ev on e.event_id = ev.id
WHERE
    ev.organizer_id = auth.uid ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('organizer', 'admin')
    );

GRANT SELECT ON organizer_entries_view TO authenticated;


ALTER TABLE public.events ADD COLUMN is_registration_open BOOLEAN DEFAULT true;


ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS registration_close_date DATE;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS temporary_registration_closes_at TIMESTAMPTZ;


do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'event_level'
    ) then
        create type event_level as enum ('district', 'state', 'national', 'international');
    end if;
end
$$;

alter table public.events
add column if not exists event_level event_level;

comment on column public.events.event_level is 'Competition scope such as district, state, national, or international.';

-- Create contacts table for contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for contact form)
CREATE POLICY "Allow anonymous inserts to contacts" ON contacts
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow authenticated users to read all contacts
CREATE POLICY "Allow authenticated users to read contacts" ON contacts
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- Add is_active column
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Function to evaluate activity for all students in a dojo
CREATE OR REPLACE FUNCTION evaluate_dojo_students_activity(target_dojo_id uuid)
RETURNS void AS $$
DECLARE
    recent_events_count int;
BEGIN
    -- Check how many distinct events this dojo has participated in (up to 2 most recent)
    SELECT COUNT(*) INTO recent_events_count
    FROM (
        SELECT ev.id
        FROM events ev
        JOIN entries e ON e.event_id = ev.id
        JOIN students s ON e.student_id = s.id
        WHERE s.dojo_id = target_dojo_id
        GROUP BY ev.id, ev.end_date
        ORDER BY ev.end_date DESC
        LIMIT 2
    ) as subquery;

    IF recent_events_count >= 2 THEN
        -- Evaluate students in this dojo
        -- A student is inactive if they have 0 entries in the 2 most recent events of the dojo
        UPDATE students st
        SET is_active = (
            CASE
                -- If the student was created AFTER the start date of the older of the 2 events, 
                -- they haven't had the chance to miss 2 events yet, so keep them active.
                WHEN st.created_at > (
                    SELECT MIN(start_date)::timestamptz
                    FROM (
                        SELECT ev.start_date
                        FROM events ev
                        JOIN entries e2 ON e2.event_id = ev.id
                        JOIN students s2 ON e2.student_id = s2.id
                        WHERE s2.dojo_id = target_dojo_id
                        GROUP BY ev.id, ev.end_date, ev.start_date
                        ORDER BY ev.end_date DESC
                        LIMIT 2
                    ) AS recent_two
                ) THEN true
                -- Otherwise, they must have attended at least 1 of the 2 recent events to remain active.
                ELSE
                    EXISTS (
                        SELECT 1
                        FROM entries my_e
                        WHERE my_e.student_id = st.id
                          AND my_e.event_id IN (
                              SELECT ev.id
                              FROM events ev
                              JOIN entries e2 ON e2.event_id = ev.id
                              JOIN students s2 ON e2.student_id = s2.id
                              WHERE s2.dojo_id = target_dojo_id
                              GROUP BY ev.id, ev.end_date
                              ORDER BY ev.end_date DESC
                              LIMIT 2
                          )
                    )
            END
        )
        WHERE st.dojo_id = target_dojo_id;
    ELSE
        -- If dojo hasn't participated in 2 events, everyone is active
        UPDATE students
        SET is_active = true
        WHERE dojo_id = target_dojo_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function that extracts the dojo_id from the entry's student and calls the evaluation
CREATE OR REPLACE FUNCTION trigger_evaluate_dojo_students_activity()
RETURNS trigger AS $$
DECLARE
    dojo_uuid uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT dojo_id INTO dojo_uuid FROM students WHERE id = OLD.student_id;
    ELSE
        SELECT dojo_id INTO dojo_uuid FROM students WHERE id = NEW.student_id;
    END IF;

    IF dojo_uuid IS NOT NULL THEN
        PERFORM evaluate_dojo_students_activity(dojo_uuid);
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent errors on multiple runs
DROP TRIGGER IF EXISTS evaluate_activity_on_entry ON entries;

-- Create the trigger on entries
CREATE TRIGGER evaluate_activity_on_entry
AFTER INSERT OR UPDATE OR DELETE ON entries
FOR EACH ROW
EXECUTE FUNCTION trigger_evaluate_dojo_students_activity();


-- Add generic_checked to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS generic_checked boolean NOT NULL DEFAULT false;

-- Drop generic_checked from students table
ALTER TABLE students DROP COLUMN IF EXISTS generic_checked;


create or replace function public.prevent_dojo_delete_with_students()
returns trigger
language plpgsql
as $$
begin
    if exists (
        select 1
        from public.students
        where dojo_id = old.id
    ) then
        raise exception using message = 'Cannot delete this dojo while students still belong to it.';
    end if;

    return old;
end;
$$;

drop trigger if exists trg_prevent_dojo_delete_with_students on public.dojos;
create trigger trg_prevent_dojo_delete_with_students
before delete on public.dojos
for each row
execute function public.prevent_dojo_delete_with_students();

create or replace function public.prevent_event_delete_with_entries()
returns trigger
language plpgsql
as $$
begin
    if exists (
        select 1
        from public.entries
        where event_id = old.id
          and (status = 'approved' or chest_no is not null)
    ) then
        raise exception using message = 'Cannot delete this event while approved registrations or assigned chest numbers exist.';
    end if;

    return old;
end;
$$;

drop trigger if exists trg_prevent_event_delete_with_entries on public.events;
create trigger trg_prevent_event_delete_with_entries
before delete on public.events
for each row
execute function public.prevent_event_delete_with_entries();

-- Create Enum
create type collaborator_permission as enum ('read', 'write');

-- Create Tables
create table dojo_collaborators (
    id uuid default gen_random_uuid() primary key,
    dojo_id uuid references dojos(id) on delete cascade not null,
    user_id uuid references profiles(id) on delete cascade not null,
    permission collaborator_permission not null default 'read',
    created_at timestamptz default now(),
    unique(dojo_id, user_id)
);

alter table dojo_collaborators enable row level security;

create table event_collaborators (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references events(id) on delete cascade not null,
    user_id uuid references profiles(id) on delete cascade not null,
    permission collaborator_permission not null default 'read',
    created_at timestamptz default now(),
    unique(event_id, user_id)
);

alter table event_collaborators enable row level security;

-- DOJOS RLS
drop policy "Coaches view own dojos" on dojos;
create policy "Coaches view dojos" on dojos for select using (
    (
        auth.uid() = coach_id
        or exists (select 1 from dojo_collaborators dc where dc.dojo_id = dojos.id and dc.user_id = auth.uid())
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Coaches update own dojos" on dojos;
create policy "Coaches update dojos" on dojos for update using (
    (
        auth.uid() = coach_id
        or exists (select 1 from dojo_collaborators dc where dc.dojo_id = dojos.id and dc.user_id = auth.uid() and dc.permission = 'write')
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

-- STUDENTS RLS
drop policy "Coaches manage their students" on students;

create policy "Coaches view their students" on students for select using (
    exists (
        select 1 from dojos
        where dojos.id = students.dojo_id
        and (
            dojos.coach_id = auth.uid()
            or exists (select 1 from dojo_collaborators dc where dc.dojo_id = dojos.id and dc.user_id = auth.uid())
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

create policy "Coaches insert their students" on students for insert with check (
    exists (
        select 1 from dojos
        where dojos.id = students.dojo_id
        and (
            dojos.coach_id = auth.uid()
            or exists (select 1 from dojo_collaborators dc where dc.dojo_id = dojos.id and dc.user_id = auth.uid() and dc.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

create policy "Coaches update their students" on students for update using (
    exists (
        select 1 from dojos
        where dojos.id = students.dojo_id
        and (
            dojos.coach_id = auth.uid()
            or exists (select 1 from dojo_collaborators dc where dc.dojo_id = dojos.id and dc.user_id = auth.uid() and dc.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

create policy "Coaches delete their students" on students for delete using (
    exists (
        select 1 from dojos
        where dojos.id = students.dojo_id
        and (
            dojos.coach_id = auth.uid()
            or exists (select 1 from dojo_collaborators dc where dc.dojo_id = dojos.id and dc.user_id = auth.uid() and dc.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

-- DOJO COLLABORATORS RLS
create policy "Owners manage dojo collaborators" on dojo_collaborators using (
    exists (select 1 from dojos where dojos.id = dojo_collaborators.dojo_id and dojos.coach_id = auth.uid())
);
create policy "Collaborators view own dojo collaboration" on dojo_collaborators for select using (
    auth.uid() = user_id
);

-- EVENTS RLS
drop policy "Organizers manage own events" on events;

create policy "Organizers insert own events" on events for insert with check (
    auth.uid() = organizer_id
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

create policy "Organizers delete own events" on events for delete using (
    auth.uid() = organizer_id
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

create policy "Organizers view own and shared events" on events for select using (
    (
        auth.uid() = organizer_id
        or exists (select 1 from event_collaborators ec where ec.event_id = events.id and ec.user_id = auth.uid())
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

create policy "Organizers update own and shared events" on events for update using (
    (
        auth.uid() = organizer_id
        or exists (select 1 from event_collaborators ec where ec.event_id = events.id and ec.user_id = auth.uid() and ec.permission = 'write')
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

-- EVENT COLLABORATORS RLS
create policy "Owners manage event collaborators" on event_collaborators using (
    exists (select 1 from events where events.id = event_collaborators.event_id and events.organizer_id = auth.uid())
);
create policy "Collaborators view own event collaboration" on event_collaborators for select using (
    auth.uid() = user_id
);

-- CATEGORIES RLS
drop policy "Organizers manage categories" on categories;
create policy "Organizers manage categories" on categories using (
    exists (
        select 1 from events
        where events.id = categories.event_id
        and (
            events.organizer_id = auth.uid()
            or exists (select 1 from event_collaborators ec where ec.event_id = events.id and ec.user_id = auth.uid() and ec.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

-- EVENT_DAYS RLS
drop policy "Organizers manage event days" on event_days;
create policy "Organizers manage event days" on event_days using (
    exists (
        select 1 from events
        where events.id = event_days.event_id
        and (
            events.organizer_id = auth.uid()
            or exists (select 1 from event_collaborators ec where ec.event_id = events.id and ec.user_id = auth.uid() and ec.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

-- ENTRIES RLS
drop policy "Coaches manage own entries" on entries;

create policy "Coaches view entries" on entries for select using (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid())
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

create policy "Coaches insert entries" on entries for insert with check (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

create policy "Coaches update entries" on entries for update using (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

create policy "Coaches delete entries" on entries for delete using (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Organizers view entries for their events" on entries;
create policy "Organizers view entries for their events" on entries for select using (
    exists (
        select 1 from events
        where events.id = entries.event_id
        and (
            events.organizer_id = auth.uid()
            or exists (select 1 from event_collaborators ec where ec.event_id = events.id and ec.user_id = auth.uid())
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

drop policy "Organizers update entries" on entries;
create policy "Organizers update entries" on entries for update using (
    exists (
        select 1 from events
        where events.id = entries.event_id
        and (
            events.organizer_id = auth.uid()
            or exists (select 1 from event_collaborators ec where ec.event_id = events.id and ec.user_id = auth.uid() and ec.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

-- EVENT_APPLICATIONS RLS
drop policy "Coaches view own applications" on event_applications;
create policy "Coaches view own applications" on event_applications for select using (
    auth.uid() = coach_id
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Organizers manage applications" on event_applications;
create policy "Organizers manage applications" on event_applications using (
    exists (
        select 1 from events
        where events.id = event_applications.event_id
        and (
            events.organizer_id = auth.uid()
            or exists (select 1 from event_collaborators ec where ec.event_id = events.id and ec.user_id = auth.uid() and ec.permission = 'write')
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('organizer', 'admin'))
);

-- VIEW UPDATE
DROP VIEW IF EXISTS organizer_entries_view CASCADE;

CREATE OR REPLACE VIEW organizer_entries_view AS
SELECT 
    e.id AS entry_id, 
    e.event_id, 
    e.status, 
    e.participation_type, 
    e.created_at, 
    e.coach_id, 
    e.event_day_id, 
    e.category_id, 
    e.student_id,
    e.chest_no,
    e.generic_checked,

    -- Student info
    s.name AS student_name,
    s.rank AS student_rank,
    s.gender AS student_gender,
    s.weight AS student_weight,
    s.date_of_birth AS student_dob,
    s.registration_no AS student_registration_no,
    s.is_active AS student_is_active,

    -- Dojo info
    d.name AS dojo_name,

    -- Category info
    c.name AS category_name,

    -- Day info
    ed.name AS event_day_name, 
    ed.date AS event_day_date,

    -- Coach info
    p.full_name AS coach_name, 
    p.email AS coach_email,

    -- Event info
    ev.organizer_id,
    ev.is_registration_open,
    ev.registration_close_date,
    ev.temporary_registration_closes_at,
    ev.event_level

FROM
    entries e
    JOIN students s ON e.student_id = s.id
    LEFT JOIN dojos d ON s.dojo_id = d.id
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN event_days ed ON e.event_day_id = ed.id
    JOIN profiles p ON e.coach_id = p.id
    JOIN events ev ON e.event_id = ev.id
WHERE
    (
        ev.organizer_id = auth.uid ()
        OR EXISTS (
            SELECT 1 FROM event_collaborators ec
            WHERE ec.event_id = ev.id AND ec.user_id = auth.uid()
        )
    )
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('organizer', 'admin')
    );

GRANT SELECT ON organizer_entries_view TO authenticated;


-- Fix infinite recursion in RLS by using security definer functions for ownership checks

-- 1. Helper Functions (security definer bypasses RLS)
create or replace function get_dojo_coach_id(dojo_uuid uuid) 
returns uuid 
language sql 
security definer 
set search_path = public
as $$
    select coach_id from dojos where id = dojo_uuid;
$$;

create or replace function get_event_organizer_id(event_uuid uuid) 
returns uuid 
language sql 
security definer 
set search_path = public
as $$
    select organizer_id from events where id = event_uuid;
$$;

-- 2. Update Dojo Collaborators Policies
drop policy if exists "Owners manage dojo collaborators" on dojo_collaborators;
create policy "Owners manage dojo collaborators" on dojo_collaborators using (
    auth.uid() = get_dojo_coach_id(dojo_id)
);

-- Note: "Collaborators view own access" policy does not query `dojos` so it does not cause recursion.

-- 3. Update Event Collaborators Policies
drop policy if exists "Owners manage event collaborators" on event_collaborators;
create policy "Owners manage event collaborators" on event_collaborators using (
    auth.uid() = get_event_organizer_id(event_id)
);


-- Fix Entries RLS to allow owners of dojos to see entries created by collaborators

drop policy "Coaches view entries" on entries;
create policy "Coaches view entries" on entries for select using (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid()))
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Coaches insert entries" on entries;
create policy "Coaches insert entries" on entries for insert with check (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write'))
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Coaches update entries" on entries;
create policy "Coaches update entries" on entries for update using (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write'))
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Coaches delete entries" on entries;
create policy "Coaches delete entries" on entries for delete using (
    (
        auth.uid() = coach_id
        or exists (
            select 1 from students s
            join dojos d on s.dojo_id = d.id
            where s.id = entries.student_id
            and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write'))
        )
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);


