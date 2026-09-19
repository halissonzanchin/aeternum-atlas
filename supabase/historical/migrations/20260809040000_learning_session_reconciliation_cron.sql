-- Aeternum 26.1: reconciliação automática e idempotente de sessões órfãs.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

DO $aeternum$
DECLARE
  existing_job_id BIGINT;
BEGIN
  FOR existing_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'aeternum-reconcile-learning-sessions'
  LOOP
    PERFORM cron.unschedule(existing_job_id);
  END LOOP;

  PERFORM cron.schedule(
    'aeternum-reconcile-learning-sessions',
    '* * * * *',
    'SELECT public.reconcile_all_stale_learning_sessions(INTERVAL ''3 minutes'');'
  );
END
$aeternum$;
