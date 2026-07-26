-- Buddy Skills v3.0.1
-- Fixes student access to assigned custom reinforcement images and audio.
-- Run once in the Supabase SQL Editor.

update storage.buckets set public=true where id='reinforcement-library';

create or replace function public.get_student_reinforcement_package(p_student_id uuid, p_package_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id',rp.id,'name',rp.name,'praise_text',rp.praise_text,
    'token_path',rp.token_path,'completion_path',rp.completion_path,'audio_path',rp.audio_path,
    'active',rp.active
  ) into result
  from public.students s
  join public.reinforcement_packages rp on rp.id=p_package_id and rp.owner_id=s.owner_id
  where s.id=p_student_id and s.active=true and rp.active=true
  limit 1;
  return result;
end;
$$;
revoke all on function public.get_student_reinforcement_package(uuid,uuid) from public;
grant execute on function public.get_student_reinforcement_package(uuid,uuid) to anon,authenticated;
