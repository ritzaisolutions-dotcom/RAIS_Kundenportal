-- Read-only checks for webhook trigger semantics.
-- Goal: transition-only notifications, no duplicate mails on open->open edits.

select
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_condition,
  action_statement
from information_schema.triggers
where trigger_schema = 'portal'
  and trigger_name in ('report_published_webhook', 'input_requested_webhook', 'input_submitted_webhook')
order by event_object_table, event_manipulation;

-- Inspect trigger function source for transition logic.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_sql
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'portal'
  and p.proname in (
    'trg_report_published_webhook',
    'trg_input_requested_webhook',
    'trg_input_submitted_webhook'
  )
order by p.proname;
