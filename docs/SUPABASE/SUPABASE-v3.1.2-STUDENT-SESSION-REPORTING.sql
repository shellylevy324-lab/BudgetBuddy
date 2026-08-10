-- Buddy Skills v3.1.2
-- Secure reporting for permanent QR / student-access sessions.
-- Run this file once in the Supabase SQL Editor after the existing reporting
-- and permanent student-access migrations.
--
-- Student devices remain anonymous. They can write reporting rows only when
-- they present a valid, active permanent access code, and only for the student
-- attached to that code. Teachers continue to read reports through the
-- authenticated RLS policies already on student_sessions/student_trials.

create or replace function public.start_student_access_session(
  p_access_code text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_student_id uuid;
  v_session_id uuid;
  v_phase text;
  v_reinforcement_id uuid;
begin
  select l.owner_id, l.student_id
    into v_owner_id, v_student_id
  from public.student_access_links l
  join public.students s
    on s.id = l.student_id
   and s.owner_id = l.owner_id
  where upper(l.access_code) = upper(trim(p_access_code))
    and l.revoked_at is null
    and s.active = true
  order by l.created_at desc
  limit 1;

  if v_student_id is null then
    raise exception 'Student access link is invalid or inactive.';
  end if;

  -- Never allow a caller to use an access code to write for another student.
  if nullif(p_payload->>'student_id', '') is not null
     and (p_payload->>'student_id')::uuid <> v_student_id then
    raise exception 'Student does not match this access link.';
  end if;

  v_phase := coalesce(nullif(p_payload->>'teaching_phase', ''), 'other');
  if v_phase not in ('baseline','intervention','prompt-fading','maintenance','generalization','other') then
    v_phase := 'other';
  end if;

  begin
    v_reinforcement_id := nullif(p_payload->>'reinforcement_package_id', '')::uuid;
  exception when invalid_text_representation then
    v_reinforcement_id := null;
  end;

  if v_reinforcement_id is not null and not exists (
    select 1 from public.reinforcement_packages rp
    where rp.id = v_reinforcement_id and rp.owner_id = v_owner_id
  ) then
    v_reinforcement_id := null;
  end if;

  insert into public.student_sessions (
    owner_id,
    student_id,
    activity_key,
    activity_name,
    teaching_phase,
    session_type,
    prompting_mode,
    reinforcement_package_id,
    staff_name,
    started_at,
    module_version
  ) values (
    v_owner_id,
    v_student_id,
    coalesce(nullif(p_payload->>'activity_key', ''), 'unknown'),
    coalesce(nullif(p_payload->>'activity_name', ''), 'Buddy Skills Activity'),
    v_phase,
    nullif(p_payload->>'session_type', ''),
    nullif(p_payload->>'prompting_mode', ''),
    v_reinforcement_id,
    nullif(p_payload->>'staff_name', ''),
    coalesce(nullif(p_payload->>'started_at', '')::timestamptz, now()),
    nullif(p_payload->>'module_version', '')
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.record_student_access_trial(
  p_access_code text,
  p_session_id uuid,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_student_id uuid;
  v_phase text;
begin
  select l.owner_id, l.student_id
    into v_owner_id, v_student_id
  from public.student_access_links l
  join public.students s
    on s.id = l.student_id
   and s.owner_id = l.owner_id
  where upper(l.access_code) = upper(trim(p_access_code))
    and l.revoked_at is null
    and s.active = true
  order by l.created_at desc
  limit 1;

  if v_student_id is null then
    raise exception 'Student access link is invalid or inactive.';
  end if;

  select teaching_phase into v_phase
  from public.student_sessions
  where id = p_session_id
    and owner_id = v_owner_id
    and student_id = v_student_id;

  if v_phase is null then
    raise exception 'Reporting session does not belong to this student access link.';
  end if;

  insert into public.student_trials (
    owner_id,
    session_id,
    student_id,
    trial_number,
    target,
    student_response,
    result,
    correct,
    independent,
    prompt_level,
    latency_seconds,
    token_earned,
    error_correction,
    rapid_response,
    teaching_phase,
    recorded_at,
    task_data
  ) values (
    v_owner_id,
    p_session_id,
    v_student_id,
    greatest(1, coalesce((p_payload->>'trial_number')::integer, 1)),
    nullif(p_payload->>'target', ''),
    nullif(p_payload->>'student_response', ''),
    case
      when p_payload->>'result' in ('independent','prompted','incorrect','no-response','skipped')
        then p_payload->>'result'
      else 'incorrect'
    end,
    coalesce((p_payload->>'correct')::boolean, false),
    coalesce((p_payload->>'independent')::boolean, false),
    nullif(p_payload->>'prompt_level', ''),
    case when nullif(p_payload->>'latency_seconds', '') is null then null
         else greatest(0, (p_payload->>'latency_seconds')::numeric) end,
    coalesce((p_payload->>'token_earned')::boolean, false),
    nullif(p_payload->>'error_correction', ''),
    coalesce((p_payload->>'rapid_response')::boolean, false),
    v_phase,
    coalesce(nullif(p_payload->>'recorded_at', '')::timestamptz, now()),
    coalesce(p_payload->'task_data', '{}'::jsonb)
  )
  on conflict (session_id, trial_number) do update set
    target = excluded.target,
    student_response = excluded.student_response,
    result = excluded.result,
    correct = excluded.correct,
    independent = excluded.independent,
    prompt_level = excluded.prompt_level,
    latency_seconds = excluded.latency_seconds,
    token_earned = excluded.token_earned,
    error_correction = excluded.error_correction,
    rapid_response = excluded.rapid_response,
    recorded_at = excluded.recorded_at,
    task_data = excluded.task_data;

  return true;
end;
$$;

create or replace function public.end_student_access_session(
  p_access_code text,
  p_session_id uuid,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_student_id uuid;
begin
  select l.owner_id, l.student_id
    into v_owner_id, v_student_id
  from public.student_access_links l
  join public.students s
    on s.id = l.student_id
   and s.owner_id = l.owner_id
  where upper(l.access_code) = upper(trim(p_access_code))
    and l.revoked_at is null
    and s.active = true
  order by l.created_at desc
  limit 1;

  if v_student_id is null then
    raise exception 'Student access link is invalid or inactive.';
  end if;

  update public.student_sessions
  set
    ended_at = coalesce(nullif(p_payload->>'ended_at', '')::timestamptz, now()),
    duration_seconds = greatest(0, round(coalesce(nullif(p_payload->>'duration_seconds', '')::numeric, 0))::integer),
    total_trials = greatest(0, coalesce(nullif(p_payload->>'total_trials', '')::integer, 0)),
    correct_trials = greatest(0, coalesce(nullif(p_payload->>'correct_trials', '')::integer, 0)),
    independent_trials = greatest(0, coalesce(nullif(p_payload->>'independent_trials', '')::integer, 0)),
    prompted_trials = greatest(0, coalesce(nullif(p_payload->>'prompted_trials', '')::integer, 0)),
    incorrect_trials = greatest(0, coalesce(nullif(p_payload->>'incorrect_trials', '')::integer, 0)),
    average_latency_seconds = case
      when nullif(p_payload->>'average_latency_seconds', '') is null then null
      else greatest(0, (p_payload->>'average_latency_seconds')::numeric)
    end,
    notes = nullif(p_payload->>'notes', '')
  where id = p_session_id
    and owner_id = v_owner_id
    and student_id = v_student_id;

  if not found then
    raise exception 'Reporting session does not belong to this student access link.';
  end if;

  return true;
end;
$$;

revoke all on function public.start_student_access_session(text,jsonb) from public;
revoke all on function public.record_student_access_trial(text,uuid,jsonb) from public;
revoke all on function public.end_student_access_session(text,uuid,jsonb) from public;

grant execute on function public.start_student_access_session(text,jsonb) to anon, authenticated;
grant execute on function public.record_student_access_trial(text,uuid,jsonb) to anon, authenticated;
grant execute on function public.end_student_access_session(text,uuid,jsonb) to anon, authenticated;
