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
    approval_status text default 'pending', -- pending, approved, rejected
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