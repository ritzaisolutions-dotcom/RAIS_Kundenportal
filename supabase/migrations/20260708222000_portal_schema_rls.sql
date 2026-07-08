create extension if not exists pgcrypto;

create schema if not exists portal;

create table if not exists portal.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_path text,
  primary_contact_email text,
  created_at timestamptz default now()
);

create table if not exists portal.client_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid not null references portal.clients(id) on delete cascade,
  display_name text not null,
  avatar_path text,
  created_at timestamptz default now()
);

create table if not exists portal.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists portal.status_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references portal.clients(id) on delete cascade,
  title text not null,
  body_md text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists portal.input_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references portal.clients(id) on delete cascade,
  title text not null,
  description_md text,
  kind text not null check (kind in ('form', 'freetext')),
  form_schema jsonb,
  status text not null default 'open' check (status in ('draft', 'open', 'submitted', 'accepted', 'reopened')),
  due_date date,
  created_at timestamptz default now()
);

create table if not exists portal.input_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references portal.input_requests(id) on delete cascade,
  client_id uuid not null references portal.clients(id),
  submitted_by uuid references auth.users(id),
  data jsonb not null,
  file_paths text[],
  created_at timestamptz default now()
);

create or replace function portal.is_admin() returns boolean
language sql stable security definer
set search_path = portal
as $$
  select exists (select 1 from portal.admins where user_id = auth.uid());
$$;

create or replace function portal.my_client_id() returns uuid
language sql stable security definer
set search_path = portal
as $$
  select client_id from portal.client_users where user_id = auth.uid();
$$;

grant usage on schema portal to authenticated;
grant select, insert, update, delete on all tables in schema portal to authenticated;
grant usage on all sequences in schema portal to authenticated;

alter table portal.clients enable row level security;
alter table portal.client_users enable row level security;
alter table portal.admins enable row level security;
alter table portal.status_reports enable row level security;
alter table portal.input_requests enable row level security;
alter table portal.input_submissions enable row level security;

-- admins
create policy "admins_select_self" on portal.admins
for select to authenticated
using (user_id = auth.uid() or portal.is_admin());

create policy "admins_manage_admins" on portal.admins
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

-- clients
create policy "clients_admin_all" on portal.clients
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "clients_client_select_own" on portal.clients
for select to authenticated
using (id = portal.my_client_id());

-- client_users
create policy "client_users_admin_all" on portal.client_users
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "client_users_select_self" on portal.client_users
for select to authenticated
using (user_id = auth.uid());

-- status_reports
create policy "status_reports_admin_all" on portal.status_reports
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "status_reports_client_select_published_own" on portal.status_reports
for select to authenticated
using (client_id = portal.my_client_id() and status = 'published');

-- input_requests
create policy "input_requests_admin_all" on portal.input_requests
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "input_requests_client_select_own" on portal.input_requests
for select to authenticated
using (
  client_id = portal.my_client_id()
  and status in ('open', 'submitted', 'accepted', 'reopened')
);

-- input_submissions
create policy "input_submissions_admin_all" on portal.input_submissions
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "input_submissions_client_insert_own" on portal.input_submissions
for insert to authenticated
with check (
  client_id = portal.my_client_id()
  and submitted_by = auth.uid()
);

create policy "input_submissions_client_select_own" on portal.input_submissions
for select to authenticated
using (client_id = portal.my_client_id());

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('report-images', 'report-images', false),
  ('submissions', 'submissions', false)
on conflict (id) do nothing;

create policy "logos_public_read" on storage.objects
for select to public
using (bucket_id = 'logos');

create policy "logos_admin_write" on storage.objects
for all to authenticated
using (bucket_id = 'logos' and portal.is_admin())
with check (bucket_id = 'logos' and portal.is_admin());

create policy "report_images_client_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'report-images'
  and (
    portal.is_admin()
    or split_part(name, '/', 1) = portal.my_client_id()::text
  )
);

create policy "report_images_admin_write" on storage.objects
for all to authenticated
using (bucket_id = 'report-images' and portal.is_admin())
with check (bucket_id = 'report-images' and portal.is_admin());

create policy "submissions_client_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'submissions'
  and (
    portal.is_admin()
    or split_part(name, '/', 1) = portal.my_client_id()::text
  )
);

create policy "submissions_client_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'submissions'
  and (
    portal.is_admin()
    or split_part(name, '/', 1) = portal.my_client_id()::text
  )
);

create policy "submissions_admin_manage" on storage.objects
for update to authenticated
using (bucket_id = 'submissions' and portal.is_admin())
with check (bucket_id = 'submissions' and portal.is_admin());

create policy "submissions_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'submissions' and portal.is_admin());
