-- Customer-initiated requests (Kunde → RAIS) with event thread and n8n webhooks.

alter table portal.client_users
  add column if not exists can_submit_requests boolean not null default true;

create or replace function portal.can_submit_requests() returns boolean
language sql stable security definer
set search_path = portal
as $$
  select coalesce((select can_submit_requests from portal.client_users where user_id = auth.uid()), false);
$$;

revoke all on function portal.can_submit_requests() from public;
grant execute on function portal.can_submit_requests() to authenticated;

create table if not exists portal.customer_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references portal.clients(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  subject text not null,
  category text not null,
  area text not null,
  project_name text not null,
  description_md text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'acknowledged', 'rejected', 'revision', 'in_progress', 'completed')),
  attachment_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists portal.customer_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references portal.customer_requests(id) on delete cascade,
  kind text not null check (kind in ('status_change', 'message')),
  author_role text not null check (author_role in ('customer', 'admin')),
  author_id uuid not null references auth.users(id),
  body_md text,
  new_status text check (
    new_status is null
    or new_status in ('submitted', 'acknowledged', 'rejected', 'revision', 'in_progress', 'completed')
  ),
  attachment_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table portal.customer_requests enable row level security;
alter table portal.customer_request_events enable row level security;

create policy "customer_requests_admin_all" on portal.customer_requests
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "customer_requests_client_select_own" on portal.customer_requests
for select to authenticated
using (client_id = portal.my_client_id() and portal.can_submit_requests());

create policy "customer_requests_client_insert_own" on portal.customer_requests
for insert to authenticated
with check (
  client_id = portal.my_client_id()
  and created_by = auth.uid()
  and portal.can_submit_requests()
);

create policy "customer_requests_client_update_revision" on portal.customer_requests
for update to authenticated
using (
  client_id = portal.my_client_id()
  and status = 'revision'
  and portal.can_submit_requests()
)
with check (
  client_id = portal.my_client_id()
  and status = 'submitted'
  and portal.can_submit_requests()
);

create policy "customer_request_events_admin_all" on portal.customer_request_events
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "customer_request_events_client_select_own" on portal.customer_request_events
for select to authenticated
using (
  portal.can_submit_requests()
  and exists (
    select 1
    from portal.customer_requests cr
    where cr.id = request_id
      and cr.client_id = portal.my_client_id()
  )
);

create policy "customer_request_events_client_insert_message" on portal.customer_request_events
for insert to authenticated
with check (
  portal.can_submit_requests()
  and author_role = 'customer'
  and author_id = auth.uid()
  and kind = 'message'
  and exists (
    select 1
    from portal.customer_requests cr
    where cr.id = request_id
      and cr.client_id = portal.my_client_id()
      and cr.status = 'revision'
  )
);

insert into storage.buckets (id, name, public)
values ('customer-requests', 'customer-requests', false)
on conflict (id) do nothing;

create policy "customer_requests_storage_client_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'customer-requests'
  and (
    portal.is_admin()
    or split_part(name, '/', 1) = portal.my_client_id()::text
  )
);

create policy "customer_requests_storage_client_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'customer-requests'
  and (
    portal.is_admin()
    or (
      split_part(name, '/', 1) = portal.my_client_id()::text
      and portal.can_submit_requests()
    )
  )
);

create policy "customer_requests_storage_admin_manage" on storage.objects
for update to authenticated
using (bucket_id = 'customer-requests' and portal.is_admin())
with check (bucket_id = 'customer-requests' and portal.is_admin());

create policy "customer_requests_storage_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'customer-requests' and portal.is_admin());

create or replace function portal.trg_customer_request_created_webhook()
returns trigger
language plpgsql
security definer
set search_path = portal, pg_temp
as $$
begin
  perform portal.dispatch_n8n_webhook(
    'rais-customer-request-created',
    jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(new),
      'old_record', null
    )
  );

  return new;
end;
$$;

create or replace function portal.trg_customer_request_answered_webhook()
returns trigger
language plpgsql
security definer
set search_path = portal, pg_temp
as $$
begin
  -- Kunde nur benachrichtigen bei einer echten Antwort (body_md gesetzt) oder bei
  -- kundenrelevanten Statuswechseln (Umgesetzt / Abgelehnt / Rückfrage). Rein interne
  -- Übergänge wie acknowledged -> in_progress lösen bewusst KEINE Mail aus.
  if new.author_role = 'admin'
     and (
       new.body_md is not null
       or new.new_status in ('completed', 'rejected', 'revision')
     )
  then
    perform portal.dispatch_n8n_webhook(
      'rais-customer-request-answered',
      jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(new),
        'old_record', null
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists customer_request_created_webhook on portal.customer_requests;
create trigger customer_request_created_webhook
after insert on portal.customer_requests
for each row
execute function portal.trg_customer_request_created_webhook();

drop trigger if exists customer_request_answered_webhook on portal.customer_request_events;
create trigger customer_request_answered_webhook
after insert on portal.customer_request_events
for each row
execute function portal.trg_customer_request_answered_webhook();
