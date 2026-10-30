-- Scheduled safety net for auto-print.
-- Runs the `print-sweep` edge function every minute; that function reprints any
-- paid-but-unprinted order (see supabase/functions/print-sweep/index.ts).
--
-- Prereq: deploy the edge function first:
--   supabase functions deploy print-sweep --project-ref jsldrmudlqtwffwtrcwh
--
-- Run this whole script once in the Supabase SQL editor (project jsldrmudlqtwffwtrcwh).

-- 1. Enable required extensions -------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Store the anon key in Vault so it isn't hardcoded in the cron command ------
--    Replace <ANON_KEY> with the project's anon (publishable) key, then run.
--    Re-running with the same name updates the stored secret.
select vault.create_secret(
  '<ANON_KEY>',
  'print_sweep_anon_key',
  'Anon key used by the print-sweep cron job'
)
where not exists (
  select 1 from vault.secrets where name = 'print_sweep_anon_key'
);

-- 3. (Re)schedule the job -------------------------------------------------------
select cron.unschedule('print-sweep')
where exists (select 1 from cron.job where jobname = 'print-sweep');

select cron.schedule(
  'print-sweep',
  '* * * * *',  -- every minute
  $$
  select net.http_post(
    url     := 'https://jsldrmudlqtwffwtrcwh.supabase.co/functions/v1/print-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'print_sweep_anon_key'
      )
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 8000
  );
  $$
);

-- 4. Keep cron history and pg_net responses from filling the free 500 MB quota.
--    print-sweep runs every minute; without this, job_run_details grows forever
--    and a backlog can stall Auth logins.
select cron.unschedule('prune-db-logs')
where exists (select 1 from cron.job where jobname = 'prune-db-logs');

select cron.schedule(
  'prune-db-logs',
  '15 * * * *',
  $$
  delete from cron.job_run_details
  where start_time < now() - interval '2 days';
  delete from net._http_response
  where created < now() - interval '6 hours';
  $$
);

-- Useful checks:
--   select * from cron.job where jobname = 'print-sweep';
--   select * from cron.job_run_details where jobid = (
--     select jobid from cron.job where jobname = 'print-sweep'
--   ) order by start_time desc limit 10;
