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