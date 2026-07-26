-- Buddy Skills v2.4.6: temporary student access links for QR/direct-link launching
create table if not exists public.student_access_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  access_code text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists student_access_links_code_idx on public.student_access_links(access_code);
alter table public.student_access_links enable row level security;
revoke all on public.student_access_links from anon;
grant select, insert, update, delete on public.student_access_links to authenticated;
drop policy if exists "Teachers manage own student access links" on public.student_access_links;
create policy "Teachers manage own student access links" on public.student_access_links for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

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
  left join public.student_instructional_settings settings on settings.student_id=s.id and settings.owner_id=l.owner_id
  where upper(l.access_code)=upper(trim(p_access_code)) and l.revoked_at is null and l.expires_at>now() and s.active=true
  order by l.created_at desc limit 1;
  return result;
end; $$;
revoke all on function public.redeem_student_access(text) from public;
grant execute on function public.redeem_student_access(text) to anon, authenticated;
