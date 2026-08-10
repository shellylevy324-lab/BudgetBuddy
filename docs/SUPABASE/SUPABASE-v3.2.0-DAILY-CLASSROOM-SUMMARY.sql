-- Buddy Skills v3.2.0 - Daily Classroom Summary
-- Run once in Supabase SQL Editor after v3.1.2 reporting SQL.

create extension if not exists pg_cron with schema extensions;

create table if not exists public.daily_summary_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  email_enabled boolean not null default false,
  delivery_email text,
  timezone text not null default 'America/New_York',
  summary_hour integer not null default 15 check (summary_hour between 0 and 23),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_classroom_summaries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  summary_date date not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  generated_at timestamptz not null default now(),
  students_count integer not null default 0,
  sessions_count integer not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  email_status text not null default 'disabled' check (email_status in ('disabled','pending','sent','failed')),
  email_sent_at timestamptz,
  email_error text,
  unique(owner_id, summary_date)
);

alter table public.daily_summary_preferences enable row level security;
alter table public.daily_classroom_summaries enable row level security;

drop policy if exists daily_summary_preferences_owner on public.daily_summary_preferences;
create policy daily_summary_preferences_owner on public.daily_summary_preferences
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists daily_classroom_summaries_owner on public.daily_classroom_summaries;
create policy daily_classroom_summaries_owner on public.daily_classroom_summaries
for select to authenticated using (owner_id = auth.uid());

grant select, insert, update on public.daily_summary_preferences to authenticated;
grant select on public.daily_classroom_summaries to authenticated;

create or replace function public.generate_daily_classroom_summary_for_owner(
  p_owner_id uuid,
  p_summary_date date,
  p_timezone text default 'America/New_York'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_summary jsonb;
  v_students integer := 0;
  v_sessions integer := 0;
  v_email_enabled boolean := false;
  v_id uuid;
begin
  v_start := ((p_summary_date::text || ' 00:00:00')::timestamp at time zone p_timezone);
  v_end := ((p_summary_date::text || ' 15:00:00')::timestamp at time zone p_timezone);

  select coalesce(email_enabled,false) into v_email_enabled
  from public.daily_summary_preferences where owner_id = p_owner_id;

  with skill_rollup as (
    select ss.student_id,
           coalesce(st.preferred_name, st.first_name, 'Student') as student_name,
           ss.activity_key,
           max(ss.activity_name) as activity_name,
           count(*)::integer as sessions,
           sum(coalesce(ss.total_trials,0))::integer as total_trials,
           sum(coalesce(ss.correct_trials,0))::integer as correct_trials,
           sum(coalesce(ss.independent_trials,0))::integer as independent_trials,
           case when sum(coalesce(ss.total_trials,0)) > 0 then
             round(sum(coalesce(ss.average_latency_seconds,0) * greatest(coalesce(ss.total_trials,0),1)) / nullif(sum(greatest(coalesce(ss.total_trials,0),1)),0), 2)
           else null end as average_latency_seconds
    from public.student_sessions ss
    left join public.students st on st.id = ss.student_id and st.owner_id = ss.owner_id
    where ss.owner_id = p_owner_id
      and ss.started_at >= v_start and ss.started_at < v_end
      and ss.ended_at is not null
    group by ss.student_id, coalesce(st.preferred_name, st.first_name, 'Student'), ss.activity_key
  ), student_rollup as (
    select student_id, student_name,
           sum(sessions)::integer as sessions,
           sum(total_trials)::integer as trials,
           jsonb_agg(jsonb_build_object(
             'activity_key', activity_key,
             'activity_name', coalesce(activity_name, activity_key),
             'sessions', sessions,
             'total_trials', total_trials,
             'correct_trials', correct_trials,
             'independent_trials', independent_trials,
             'average_latency_seconds', average_latency_seconds
           ) order by activity_name) as skills
    from skill_rollup
    group by student_id, student_name
  )
  select jsonb_build_object(
           'summary_date', p_summary_date,
           'window_label', '12:00 AM–3:00 PM',
           'students', coalesce(jsonb_agg(jsonb_build_object(
             'student_id', student_id,
             'student_name', student_name,
             'sessions', sessions,
             'trials', trials,
             'skills', skills
           ) order by student_name), '[]'::jsonb)
         ), count(*)::integer, coalesce(sum(sessions),0)::integer
    into v_summary, v_students, v_sessions
  from student_rollup;

  insert into public.daily_classroom_summaries(
    owner_id, summary_date, window_start, window_end, generated_at,
    students_count, sessions_count, summary_json, email_status, email_sent_at, email_error
  ) values (
    p_owner_id, p_summary_date, v_start, v_end, now(),
    v_students, v_sessions, coalesce(v_summary,'{"students":[]}'::jsonb),
    case when v_email_enabled then 'pending' else 'disabled' end, null, null
  )
  on conflict(owner_id, summary_date) do update set
    window_start = excluded.window_start,
    window_end = excluded.window_end,
    generated_at = excluded.generated_at,
    students_count = excluded.students_count,
    sessions_count = excluded.sessions_count,
    summary_json = excluded.summary_json,
    email_status = case
      when daily_classroom_summaries.email_status = 'sent' then 'sent'
      else excluded.email_status
    end,
    email_error = null
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.generate_daily_classroom_summary_for_owner(uuid,date,text) from public;

create or replace function public.generate_my_daily_classroom_summary()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_tz text;
  v_date date;
begin
  if v_owner is null then raise exception 'Sign in required.'; end if;
  select coalesce(timezone,'America/New_York') into v_tz
  from public.daily_summary_preferences where owner_id = v_owner;
  v_tz := coalesce(v_tz,'America/New_York');
  v_date := (now() at time zone v_tz)::date;
  return public.generate_daily_classroom_summary_for_owner(v_owner, v_date, v_tz);
end;
$$;

grant execute on function public.generate_my_daily_classroom_summary() to authenticated;

create or replace function public.generate_due_daily_classroom_summaries()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
  v_local timestamp;
  v_count integer := 0;
begin
  for p in select * from public.daily_summary_preferences where enabled = true loop
    v_local := now() at time zone p.timezone;
    if extract(isodow from v_local) between 1 and 5
       and extract(hour from v_local)::integer = p.summary_hour then
      perform public.generate_daily_classroom_summary_for_owner(p.owner_id, v_local::date, p.timezone);
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

-- Generate saved summaries at the top of every hour; the function itself only
-- writes a summary when that teacher's local time is 3 PM Monday-Friday.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'buddy-skills-daily-summary-generator') then
    perform cron.unschedule('buddy-skills-daily-summary-generator');
  end if;
  perform cron.schedule(
    'buddy-skills-daily-summary-generator',
    '0 * * * 1-5',
    'select public.generate_due_daily_classroom_summaries();'
  );
end $$;
