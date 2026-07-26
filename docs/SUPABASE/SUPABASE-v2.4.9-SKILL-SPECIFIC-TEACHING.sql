-- Buddy Skills v2.4.9: per-skill teaching activities
alter table public.student_instructional_settings
  add column if not exists activity_teaching_settings jsonb not null default '{"communitySigns":{"enabled":false,"type":"built-in","url":null},"shoppingBudget":{"enabled":false,"type":"built-in","url":null}}'::jsonb;
