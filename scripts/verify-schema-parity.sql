-- Read-only parity checks between expected portal schema and live database.
-- Execute in Supabase SQL editor or via MCP execute_sql.

-- 1) Ensure feature-permission columns exist.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'portal'
  and table_name = 'client_users'
  and column_name in ('can_view_reports', 'can_view_inputs', 'can_submit_requests')
order by column_name;

-- 2) Ensure helper functions exist.
select
  n.nspname as schema_name,
  p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'portal'
  and p.proname in ('can_view_reports', 'can_view_inputs', 'can_submit_requests')
order by p.proname;

-- 3) Ensure policies include permission functions where expected.
select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'portal'
  and tablename in ('status_reports', 'input_requests', 'input_submissions', 'customer_requests', 'customer_request_events', 'document_templates', 'document_generations')
order by tablename, policyname;

-- 4) Ensure anon no longer has portal access.
select
  n.nspname as schema_name,
  r.rolname as role_name,
  has_schema_privilege(r.rolname, n.nspname, 'USAGE') as has_usage
from pg_namespace n
cross join pg_roles r
where n.nspname = 'portal'
  and r.rolname in ('anon', 'authenticated');

select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'portal'
  and grantee = 'anon'
order by table_name, privilege_type;
