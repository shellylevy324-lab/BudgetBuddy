-- DEVELOPMENT / PILOT ONLY
-- Required for editing existing student profiles from Teacher Center.
-- Run in Supabase SQL Editor for the DEVELOPMENT project.

grant update on table public.students to anon;

create policy "Temporary development update access"
on public.students
for update
to anon
using (true)
with check (true);
