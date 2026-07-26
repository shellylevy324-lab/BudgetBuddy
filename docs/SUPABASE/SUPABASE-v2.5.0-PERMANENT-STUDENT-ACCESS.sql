-- Buddy Skills v2.5.0: permanent per-student QR/direct access links
-- Run once after the v2.4.6 Student Access SQL.

alter table public.student_access_links
  alter column expires_at drop not null;

-- Keep only the newest active link for each teacher/student pair.
with ranked as (
  select id,
         row_number() over (
           partition by owner_id, student_id
           order by created_at desc, id desc
         ) as position
  from public.student_access_links
  where revoked_at is null
)
update public.student_access_links links
set revoked_at = now()
from ranked
where links.id = ranked.id
  and ranked.position > 1;

create unique index if not exists student_access_links_one_active_per_student_idx
  on public.student_access_links(owner_id, student_id)
  where revoked_at is null;

create or replace function public.redeem_student_access(p_access_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', s.id,
    'firstName', coalesce(s.first_name,''),
    'lastName', coalesce(s.last_name,''),
    'preferredName', coalesce(nullif(s.preferred_name,''),s.first_name,'Student'),
    'gradeLevel', coalesce(s.grade_level,''),
    'jobCoach', coalesce(s.job_coach,''),
    'instructionalSettings', to_jsonb(settings),
    'studentAccessCode', l.access_code
  ) into result
  from public.student_access_links l
  join public.students s on s.id=l.student_id and s.owner_id=l.owner_id
  left join public.student_instructional_settings settings
    on settings.student_id=s.id and settings.owner_id=l.owner_id
  where upper(l.access_code)=upper(trim(p_access_code))
    and l.revoked_at is null
    and s.active=true
  order by l.created_at desc
  limit 1;
  return result;
end; $$;

revoke all on function public.redeem_student_access(text) from public;
grant execute on function public.redeem_student_access(text) to anon, authenticated;
