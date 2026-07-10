-- Reconcile live portal permission model with repository baseline.
-- This migration is idempotent and safe to apply on environments where some
-- changes already exist.

alter table portal.client_users
  add column if not exists can_view_reports boolean not null default true,
  add column if not exists can_view_inputs boolean not null default true;

create or replace function portal.can_view_reports() returns boolean
language sql stable security definer
set search_path = portal
as $$
  select coalesce((select can_view_reports from portal.client_users where user_id = auth.uid()), false);
$$;

create or replace function portal.can_view_inputs() returns boolean
language sql stable security definer
set search_path = portal
as $$
  select coalesce((select can_view_inputs from portal.client_users where user_id = auth.uid()), false);
$$;

revoke all on function portal.can_view_reports() from public;
revoke all on function portal.can_view_inputs() from public;
grant execute on function portal.can_view_reports() to authenticated;
grant execute on function portal.can_view_inputs() to authenticated;

drop policy if exists "status_reports_client_select_published_own" on portal.status_reports;
create policy "status_reports_client_select_published_own" on portal.status_reports
for select to authenticated
using (client_id = portal.my_client_id() and status = 'published' and portal.can_view_reports());

drop policy if exists "input_requests_client_select_own" on portal.input_requests;
create policy "input_requests_client_select_own" on portal.input_requests
for select to authenticated
using (
  client_id = portal.my_client_id()
  and status in ('open', 'submitted', 'accepted', 'reopened')
  and portal.can_view_inputs()
);

drop policy if exists "input_submissions_client_insert_own" on portal.input_submissions;
create policy "input_submissions_client_insert_own" on portal.input_submissions
for insert to authenticated
with check (
  client_id = portal.my_client_id()
  and submitted_by = auth.uid()
  and portal.can_view_inputs()
);

drop policy if exists "input_submissions_client_select_own" on portal.input_submissions;
create policy "input_submissions_client_select_own" on portal.input_submissions
for select to authenticated
using (client_id = portal.my_client_id() and portal.can_view_inputs());

revoke usage on schema portal from anon;
revoke all on all tables in schema portal from anon;
revoke all on all sequences in schema portal from anon;
