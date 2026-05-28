-- Fix Entries RLS to strictly enforce dojo permissions and prevent read-only collaborators from modifying entries

drop policy "Coaches view entries" on entries;
create policy "Coaches view entries" on entries for select using (
    exists (
        select 1 from students s
        join dojos d on s.dojo_id = d.id
        where s.id = entries.student_id
        and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid()))
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Coaches insert entries" on entries;
create policy "Coaches insert entries" on entries for insert with check (
    auth.uid() = coach_id
    and exists (
        select 1 from students s
        join dojos d on s.dojo_id = d.id
        where s.id = entries.student_id
        and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write'))
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Coaches update entries" on entries;
create policy "Coaches update entries" on entries for update using (
    exists (
        select 1 from students s
        join dojos d on s.dojo_id = d.id
        where s.id = entries.student_id
        and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write'))
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);

drop policy "Coaches delete entries" on entries;
create policy "Coaches delete entries" on entries for delete using (
    exists (
        select 1 from students s
        join dojos d on s.dojo_id = d.id
        where s.id = entries.student_id
        and (d.coach_id = auth.uid() or exists (select 1 from dojo_collaborators dc where dc.dojo_id = d.id and dc.user_id = auth.uid() and dc.permission = 'write'))
    )
    and exists (select 1 from profiles where id = auth.uid() and role in ('coach', 'admin'))
);
