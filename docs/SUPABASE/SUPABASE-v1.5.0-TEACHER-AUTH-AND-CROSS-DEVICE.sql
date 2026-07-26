-- Buddy Skills v1.5.0 - Teacher Authentication and Cross-Device Data
-- Run this entire file in the Supabase SQL Editor before deploying v1.5.0.

create extension if not exists pgcrypto;

-- Ownership columns
alter table public.students add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.student_instructional_settings add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.reinforcement_packages add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.reinforcement_packages add column if not exists token_path text;
alter table public.reinforcement_packages add column if not exists completion_path text;
alter table public.reinforcement_packages add column if not exists audio_path text;

create index if not exists students_owner_id_idx on public.students(owner_id);
create index if not exists settings_owner_id_idx on public.student_instructional_settings(owner_id);
create index if not exists reinforcement_owner_id_idx on public.reinforcement_packages(owner_id);

alter table public.students enable row level security;
alter table public.student_instructional_settings enable row level security;
alter table public.reinforcement_packages enable row level security;

-- Remove old anonymous/pilot policies
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies
    where schemaname='public' and tablename in ('students','student_instructional_settings','reinforcement_packages')
  loop execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

revoke all on public.students from anon;
revoke all on public.student_instructional_settings from anon;
revoke all on public.reinforcement_packages from anon;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.student_instructional_settings to authenticated;
grant select, insert, update, delete on public.reinforcement_packages to authenticated;

create policy "Teachers manage own students" on public.students for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Teachers manage own instructional settings" on public.student_instructional_settings for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Teachers manage own reinforcement packages" on public.reinforcement_packages for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- One-time claim of unowned pilot records by the first authenticated teacher who opens the site.
create or replace function public.claim_buddy_skills_pilot_data() returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.students set owner_id=auth.uid() where owner_id is null;
  update public.student_instructional_settings s set owner_id=auth.uid()
    where owner_id is null and exists (select 1 from public.students st where st.id=s.student_id and st.owner_id=auth.uid());
  update public.reinforcement_packages set owner_id=auth.uid() where owner_id is null;
end; $$;
revoke all on function public.claim_buddy_skills_pilot_data() from public, anon;
grant execute on function public.claim_buddy_skills_pilot_data() to authenticated;

-- Private, teacher-owned reinforcement storage
update storage.buckets set public=false where id='reinforcement-library';
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname ilike '%reinforcement%'
  loop execute format('drop policy if exists %I on storage.objects', r.policyname); end loop;
end $$;
create policy "Teachers read own reinforcement media" on storage.objects for select to authenticated
using (bucket_id='reinforcement-library' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Teachers upload own reinforcement media" on storage.objects for insert to authenticated
with check (bucket_id='reinforcement-library' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Teachers update own reinforcement media" on storage.objects for update to authenticated
using (bucket_id='reinforcement-library' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='reinforcement-library' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Teachers delete own reinforcement media" on storage.objects for delete to authenticated
using (bucket_id='reinforcement-library' and (storage.foldername(name))[1]=auth.uid()::text);
