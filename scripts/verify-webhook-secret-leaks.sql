-- Read-only checks to ensure webhook secrets are not embedded in trigger/function SQL.
-- Expected result after migration: zero rows for suspicious patterns.

-- Trigger SQL must not contain x-portal-secret values.
select
  tgname as trigger_name,
  pg_get_triggerdef(t.oid, true) as trigger_sql
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'portal'
  and not t.tgisinternal
  and (
    pg_get_triggerdef(t.oid, true) ilike '%x-portal-secret%'
    or pg_get_triggerdef(t.oid, true) ilike '%N8N_WEBHOOK_SECRET%'
  );

-- Function SQL must not hardcode headers or secret literals.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_sql
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'portal'
  and (
    pg_get_functiondef(p.oid) ilike '%x-portal-secret%'
    or pg_get_functiondef(p.oid) ilike '%N8N_WEBHOOK_SECRET%'
  );
