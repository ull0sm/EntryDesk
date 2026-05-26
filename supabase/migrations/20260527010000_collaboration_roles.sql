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
