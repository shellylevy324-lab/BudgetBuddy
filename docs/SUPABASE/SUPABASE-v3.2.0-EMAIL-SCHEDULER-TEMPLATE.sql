-- OPTIONAL EMAIL DELIVERY SETUP for Buddy Skills v3.2.0
-- Do NOT run until the daily-classroom-summary Edge Function is deployed and
-- its BUDDY_DAILY_SUMMARY_SECRET is set.
-- Replace the two PLACEHOLDER values below before running.

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

select vault.create_secret('PASTE_A_LONG_RANDOM_SECRET_HERE', 'buddy_daily_summary_secret', 'Buddy Skills daily summary cron secret');
select vault.create_secret('https://YOUR-PROJECT-REF.supabase.co/functions/v1/daily-classroom-summary', 'buddy_daily_summary_function_url', 'Buddy Skills daily summary Edge Function URL');

do $$
begin
  if exists (select 1 from cron.job where jobname = 'buddy-skills-daily-summary-email') then
    perform cron.unschedule('buddy-skills-daily-summary-email');
  end if;
  perform cron.schedule(
    'buddy-skills-daily-summary-email',
    '5 * * * 1-5',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name='buddy_daily_summary_function_url' limit 1),
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'x-buddy-summary-secret',(select decrypted_secret from vault.decrypted_secrets where name='buddy_daily_summary_secret' limit 1)
        ),
        body := '{}'::jsonb
      );
    $job$
  );
end $$;
