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
