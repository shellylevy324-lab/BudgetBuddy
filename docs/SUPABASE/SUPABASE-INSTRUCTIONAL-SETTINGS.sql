-- Buddy Skills v1.2.2
-- Run in the Supabase SQL Editor for the DEVELOPMENT project first.

create table if not exists public.student_instructional_settings (
  student_id uuid primary key references public.students(id) on delete cascade,
  prompt_hierarchy jsonb not null default '["Independent opportunity","Visual prompt","Gestural prompt","Model prompt","Partial physical prompt","Full physical prompt"]'::jsonb,
  wait_time_seconds integer not null default 10 check (wait_time_seconds between 0 and 120),
  initial_prompt_level text,
  error_correction text,
  avoid_verbal_prompts boolean not null default false,
  reinforcement_type text not null default 'praise',
  token_requirement integer not null default 5 check (token_requirement between 1 and 50),
  praise_text text default 'Nice working!',
  preferred_reinforcers jsonb not null default '[]'::jsonb,
  break_duration_minutes integer not null default 3 check (break_duration_minutes between 0 and 60),
  audio_praise boolean not null default false,
  celebration_animation boolean not null default true,
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_instructional_settings enable row level security;

grant select, insert, update on table public.student_instructional_settings to anon;

drop policy if exists "Temporary development settings read access" on public.student_instructional_settings;
create policy "Temporary development settings read access"
on public.student_instructional_settings
for select
to anon
using (true);

drop policy if exists "Temporary development settings insert access" on public.student_instructional_settings;
create policy "Temporary development settings insert access"
on public.student_instructional_settings
for insert
to anon
with check (true);

drop policy if exists "Temporary development settings update access" on public.student_instructional_settings;
create policy "Temporary development settings update access"
on public.student_instructional_settings
for update
to anon
using (true)
with check (true);
