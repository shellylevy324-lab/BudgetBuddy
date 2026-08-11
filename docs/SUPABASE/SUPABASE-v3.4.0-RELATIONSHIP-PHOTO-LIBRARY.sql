-- Buddy Skills v3.4.0 - Relationship Photo Library
-- Run once in the Supabase SQL Editor after the existing student-access migrations.
-- Images are resized/compressed in the browser before storage and kept in a protected table.
-- Anonymous student devices can retrieve only photos authorized by their own active access code.

create table if not exists public.relationship_photo_library (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid null references public.students(id) on delete cascade,
  label text null,
  category text not null check (category in ('family','friend','helper','acquaintance','stranger')),
  image_data text not null,
  mime_type text not null default 'image/jpeg',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_photo_library_image_size check (length(image_data) <= 1300000)
);

create index if not exists relationship_photo_library_owner_student_idx
  on public.relationship_photo_library(owner_id, student_id, category);

alter table public.relationship_photo_library enable row level security;

drop policy if exists "Teachers manage own relationship photos" on public.relationship_photo_library;
create policy "Teachers manage own relationship photos"
on public.relationship_photo_library
for all
to authenticated
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and (student_id is null or exists (
    select 1 from public.students s
    where s.id = student_id and s.owner_id = auth.uid()
  ))
);

create or replace function public.get_student_relationship_photos(p_access_code text)
returns table (
  id uuid,
  label text,
  category text,
  image_data text,
  student_specific boolean
)
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
  join public.students s on s.id=l.student_id and s.owner_id=l.owner_id
  where upper(l.access_code)=upper(trim(p_access_code))
    and l.revoked_at is null
    and s.active=true
  order by l.created_at desc
  limit 1;

  if v_student_id is null then
    raise exception 'Student access link is invalid or inactive.';
  end if;

  return query
  select p.id, p.label, p.category, p.image_data, (p.student_id is not null)
  from public.relationship_photo_library p
  where p.owner_id=v_owner_id
    and p.active=true
    and (p.student_id is null or p.student_id=v_student_id)
  order by p.category, p.created_at;
end;
$$;

revoke all on function public.get_student_relationship_photos(text) from public;
grant execute on function public.get_student_relationship_photos(text) to anon, authenticated;

grant select, insert, update, delete on public.relationship_photo_library to authenticated;
