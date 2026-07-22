-- Buddy Skills v1.4.0 - Cloud Reinforcement Library
-- PILOT SETUP: Run this in the Supabase SQL Editor for the development project.
-- This enables a shared cross-device library using the current anonymous pilot access.
-- Replace these temporary policies with authenticated teacher ownership before multi-teacher use.

create extension if not exists pgcrypto;

create table if not exists public.reinforcement_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  praise_text text not null default 'Nice job!' check (char_length(praise_text) <= 120),
  token_url text,
  completion_url text,
  audio_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reinforcement_packages enable row level security;
grant select, insert, update, delete on table public.reinforcement_packages to anon;

drop policy if exists "Pilot reinforcement package read" on public.reinforcement_packages;
create policy "Pilot reinforcement package read"
on public.reinforcement_packages for select to anon using (true);

drop policy if exists "Pilot reinforcement package insert" on public.reinforcement_packages;
create policy "Pilot reinforcement package insert"
on public.reinforcement_packages for insert to anon with check (true);

drop policy if exists "Pilot reinforcement package update" on public.reinforcement_packages;
create policy "Pilot reinforcement package update"
on public.reinforcement_packages for update to anon using (true) with check (true);

drop policy if exists "Pilot reinforcement package delete" on public.reinforcement_packages;
create policy "Pilot reinforcement package delete"
on public.reinforcement_packages for delete to anon using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reinforcement-library',
  'reinforcement-library',
  true,
  12582912,
  array['image/png','image/jpeg','image/webp','image/gif','audio/mpeg','audio/wav','audio/ogg','audio/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Pilot reinforcement storage read" on storage.objects;
create policy "Pilot reinforcement storage read"
on storage.objects for select to anon
using (bucket_id = 'reinforcement-library');

drop policy if exists "Pilot reinforcement storage insert" on storage.objects;
create policy "Pilot reinforcement storage insert"
on storage.objects for insert to anon
with check (bucket_id = 'reinforcement-library');

drop policy if exists "Pilot reinforcement storage update" on storage.objects;
create policy "Pilot reinforcement storage update"
on storage.objects for update to anon
using (bucket_id = 'reinforcement-library')
with check (bucket_id = 'reinforcement-library');

drop policy if exists "Pilot reinforcement storage delete" on storage.objects;
create policy "Pilot reinforcement storage delete"
on storage.objects for delete to anon
using (bucket_id = 'reinforcement-library');
