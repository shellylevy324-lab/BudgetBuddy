-- Buddy Skills v2.4.7: Community Signs answer level
alter table public.student_instructional_settings
  add column if not exists community_signs_response_level integer not null default 1;

alter table public.student_instructional_settings drop constraint if exists community_signs_response_level_check;
alter table public.student_instructional_settings add constraint community_signs_response_level_check
  check (community_signs_response_level in (1,2));
