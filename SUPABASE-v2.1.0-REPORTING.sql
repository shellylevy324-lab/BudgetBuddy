-- Buddy Skills v2.1.0 - Reporting Infrastructure
-- Run this entire file in the Supabase SQL Editor while signed in as the project owner.
-- This migration is idempotent and may be run more than once.

create extension if not exists pgcrypto;

create table if not exists public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  activity_key text not null,
  activity_name text not null,
  teaching_phase text not null default 'other'
    check (teaching_phase in ('baseline','intervention','prompt-fading','maintenance','generalization','other')),
  session_type text,
  prompting_mode text,
  reinforcement_package_id uuid references public.reinforcement_packages(id) on delete set null,
  staff_name text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  total_trials integer not null default 0 check (total_trials >= 0),
  correct_trials integer not null default 0 check (correct_trials >= 0),
  independent_trials integer not null default 0 check (independent_trials >= 0),
  prompted_trials integer not null default 0 check (prompted_trials >= 0),
  incorrect_trials integer not null default 0 check (incorrect_trials >= 0),
  average_latency_seconds numeric(10,3) check (average_latency_seconds is null or average_latency_seconds >= 0),
  notes text,
  module_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_sessions_counts_fit check (
    correct_trials <= total_trials and
    independent_trials <= total_trials and
    prompted_trials <= total_trials and
    incorrect_trials <= total_trials
  )
);

create table if not exists public.student_trials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null references public.student_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  trial_number integer not null check (trial_number > 0),
  target text,
  student_response text,
  result text not null default 'incorrect'
    check (result in ('independent','prompted','incorrect','no-response','skipped')),
  correct boolean not null default false,
  independent boolean not null default false,
  prompt_level text,
  latency_seconds numeric(10,3) check (latency_seconds is null or latency_seconds >= 0),
  token_earned boolean not null default false,
  error_correction text,
  rapid_response boolean not null default false,
  teaching_phase text not null default 'other'
    check (teaching_phase in ('baseline','intervention','prompt-fading','maintenance','generalization','other')),
  task_data jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (session_id, trial_number)
);

create index if not exists student_sessions_owner_idx on public.student_sessions(owner_id);
create index if not exists student_sessions_student_started_idx on public.student_sessions(student_id, started_at desc);
create index if not exists student_sessions_activity_idx on public.student_sessions(activity_key);
create index if not exists student_sessions_phase_idx on public.student_sessions(teaching_phase);
create index if not exists student_trials_owner_idx on public.student_trials(owner_id);
create index if not exists student_trials_session_trial_idx on public.student_trials(session_id, trial_number);
create index if not exists student_trials_student_recorded_idx on public.student_trials(student_id, recorded_at desc);

create or replace function public.set_buddy_reporting_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_sessions_set_updated_at on public.student_sessions;
create trigger student_sessions_set_updated_at
before update on public.student_sessions
for each row execute function public.set_buddy_reporting_updated_at();

-- Prevent a teacher from attaching reporting rows to another teacher's student or session.
create or replace function public.validate_buddy_session_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.owner_id is null then new.owner_id := auth.uid(); end if;
  if not exists (
    select 1 from public.students s
    where s.id = new.student_id and s.owner_id = new.owner_id
  ) then
    raise exception 'Student does not belong to the reporting owner.';
  end if;
  return new;
end;
$$;

drop trigger if exists student_sessions_validate_owner on public.student_sessions;
create trigger student_sessions_validate_owner
before insert or update on public.student_sessions
for each row execute function public.validate_buddy_session_owner();

create or replace function public.validate_buddy_trial_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare parent_student uuid;
declare parent_owner uuid;
declare parent_phase text;
begin
  select s.student_id, s.owner_id, s.teaching_phase
    into parent_student, parent_owner, parent_phase
  from public.student_sessions s
  where s.id = new.session_id;

  if parent_owner is null then raise exception 'Reporting session was not found.'; end if;
  if new.owner_id is null then new.owner_id := parent_owner; end if;
  if new.owner_id <> parent_owner then raise exception 'Trial owner must match session owner.'; end if;
  if new.student_id <> parent_student then raise exception 'Trial student must match session student.'; end if;
  if new.teaching_phase is null then new.teaching_phase := parent_phase; end if;
  return new;
end;
$$;

drop trigger if exists student_trials_validate_owner on public.student_trials;
create trigger student_trials_validate_owner
before insert or update on public.student_trials
for each row execute function public.validate_buddy_trial_owner();

alter table public.student_sessions enable row level security;
alter table public.student_trials enable row level security;

revoke all on public.student_sessions from anon;
revoke all on public.student_trials from anon;
grant select, insert, update, delete on public.student_sessions to authenticated;
grant select, insert, update, delete on public.student_trials to authenticated;

do $$ declare r record; begin
  for r in select policyname from pg_policies
    where schemaname='public' and tablename in ('student_sessions','student_trials')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "Teachers manage own student sessions"
on public.student_sessions for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Teachers manage own student trials"
on public.student_trials for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Convenience view for readable exports and future reporting queries.
create or replace view public.student_trial_export
with (security_invoker = true)
as
select
  t.id as trial_id,
  t.owner_id,
  t.session_id,
  t.student_id,
  coalesce(nullif(s.preferred_name, ''), nullif(s.first_name, ''), 'Student') as student_name,
  sess.activity_key,
  sess.activity_name,
  sess.started_at as session_started_at,
  sess.ended_at as session_ended_at,
  sess.staff_name,
  sess.session_type,
  t.teaching_phase,
  t.trial_number,
  t.target,
  t.student_response,
  t.result,
  t.correct,
  t.independent,
  t.prompt_level,
  t.latency_seconds,
  t.token_earned,
  t.error_correction,
  t.rapid_response,
  t.recorded_at,
  t.task_data
from public.student_trials t
join public.student_sessions sess on sess.id = t.session_id
join public.students s on s.id = t.student_id;

grant select on public.student_trial_export to authenticated;
