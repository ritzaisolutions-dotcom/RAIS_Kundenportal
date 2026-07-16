-- Admin document templates with variable substitution (DOCX/HTML).

create table if not exists portal.document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  format text not null check (format in ('docx', 'html')),
  storage_path text not null,
  variable_schema jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists portal.document_generations (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references portal.document_templates(id) on delete cascade,
  client_id uuid references portal.clients(id) on delete set null,
  filled_values jsonb not null default '{}'::jsonb,
  generated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table portal.document_templates enable row level security;
alter table portal.document_generations enable row level security;

create policy "document_templates_admin_all" on portal.document_templates
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

create policy "document_generations_admin_all" on portal.document_generations
for all to authenticated
using (portal.is_admin())
with check (portal.is_admin());

insert into storage.buckets (id, name, public)
values ('document-templates', 'document-templates', false)
on conflict (id) do nothing;

create policy "document_templates_storage_admin_all" on storage.objects
for all to authenticated
using (bucket_id = 'document-templates' and portal.is_admin())
with check (bucket_id = 'document-templates' and portal.is_admin());
