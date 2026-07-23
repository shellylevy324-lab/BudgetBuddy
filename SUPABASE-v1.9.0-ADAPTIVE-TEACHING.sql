-- Buddy Skills v1.9.0: adaptive teaching settings
-- Run once in Supabase SQL Editor after the earlier Buddy Skills migrations.

alter table public.student_instructional_settings
  add column if not exists adaptive_teaching_enabled boolean not null default false,
  add column if not exists mastery_threshold integer not null default 50,
  add column if not exists teaching_lesson_type text not null default 'built-in',
  add column if not exists teaching_lesson_url text,
  add column if not exists retry_trial_count text not null default 'same',
  add column if not exists maximum_reteaching_cycles integer not null default 1,
  add column if not exists lesson_rights_confirmed boolean not null default false;

alter table public.student_instructional_settings
  drop constraint if exists student_instructional_settings_mastery_threshold_check;
alter table public.student_instructional_settings
  add constraint student_instructional_settings_mastery_threshold_check
  check (mastery_threshold between 0 and 100);

alter table public.student_instructional_settings
  drop constraint if exists student_instructional_settings_teaching_lesson_type_check;
alter table public.student_instructional_settings
  add constraint student_instructional_settings_teaching_lesson_type_check
  check (teaching_lesson_type in ('built-in', 'youtube', 'external-link', 'teacher-upload'));

alter table public.student_instructional_settings
  drop constraint if exists student_instructional_settings_retry_trial_count_check;
alter table public.student_instructional_settings
  add constraint student_instructional_settings_retry_trial_count_check
  check (retry_trial_count in ('same', '5', '10'));

alter table public.student_instructional_settings
  drop constraint if exists student_instructional_settings_maximum_reteaching_cycles_check;
alter table public.student_instructional_settings
  add constraint student_instructional_settings_maximum_reteaching_cycles_check
  check (maximum_reteaching_cycles between 1 and 2);
