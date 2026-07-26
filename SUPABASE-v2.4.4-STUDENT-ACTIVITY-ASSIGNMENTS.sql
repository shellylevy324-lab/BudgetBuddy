-- Buddy Skills v2.4.4: student activity assignments and Community Signs teacher controls
alter table public.student_instructional_settings
  add column if not exists activity_access jsonb not null default '{"shoppingBudget": true, "communitySigns": true}'::jsonb,
  add column if not exists community_signs_set integer not null default 1,
  add column if not exists community_signs_trial_count integer not null default 10,
  add column if not exists community_signs_prompt_step_seconds integer not null default 5,
  add column if not exists community_signs_audio_enabled boolean not null default true;

alter table public.student_instructional_settings drop constraint if exists community_signs_set_check;
alter table public.student_instructional_settings add constraint community_signs_set_check check (community_signs_set between 1 and 4);
alter table public.student_instructional_settings drop constraint if exists community_signs_trial_count_check;
alter table public.student_instructional_settings add constraint community_signs_trial_count_check check (community_signs_trial_count in (5,10,15,20));
alter table public.student_instructional_settings drop constraint if exists community_signs_prompt_step_check;
alter table public.student_instructional_settings add constraint community_signs_prompt_step_check check (community_signs_prompt_step_seconds in (3,5,8));
