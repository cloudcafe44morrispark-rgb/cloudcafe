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
    body    := '{}'::jsonb
  );
  $$
);

-- Useful checks:
--   select * from cron.job where jobname = 'print-sweep';
--   select * from cron.job_run_details where jobid = (
--     select jobid from cron.job where jobname = 'print-sweep'
--   ) order by start_time desc limit 10;
