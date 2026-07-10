-- Move webhook dispatch to Vault-backed secret lookup + pg_net.
-- Real secret value must be managed through Supabase Vault UI/SQL and never
-- committed to this repository.

create extension if not exists pg_net with schema extensions;

create or replace function portal.dispatch_n8n_webhook(
  webhook_path text,
  payload jsonb
) returns bigint
language plpgsql
security definer
set search_path = portal, vault, net, pg_temp
as $$
declare
  secret_value text;
begin
  select decrypted_secret
  into secret_value
  from vault.decrypted_secrets
  where name = 'n8n_webhook_secret'
  order by updated_at desc nulls last, created_at desc
  limit 1;

  if secret_value is null then
    raise exception 'Vault secret n8n_webhook_secret is missing';
  end if;

  return net.http_post(
    url := 'https://n8n.ritz-ai.solutions/webhook/' || webhook_path,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-portal-secret', secret_value
    ),
    body := payload
  );
end;
$$;

revoke all on function portal.dispatch_n8n_webhook(text, jsonb) from public;

create or replace function portal.trg_report_published_webhook()
returns trigger
language plpgsql
security definer
set search_path = portal, pg_temp
as $$
begin
  if old.status is distinct from new.status and new.status = 'published' then
    perform portal.dispatch_n8n_webhook(
      'rais-report-published',
      jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(new),
        'old_record', to_jsonb(old)
      )
    );
  end if;

  return new;
end;
$$;

create or replace function portal.trg_input_requested_webhook()
returns trigger
language plpgsql
security definer
set search_path = portal, pg_temp
as $$
begin
  if new.status = 'open'
     and (TG_OP = 'INSERT' or old.status is distinct from new.status) then
    perform portal.dispatch_n8n_webhook(
      'rais-input-requested',
      jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(new),
        'old_record', case when TG_OP = 'UPDATE' then to_jsonb(old) else null end
      )
    );
  end if;

  return new;
end;
$$;

create or replace function portal.trg_input_submitted_webhook()
returns trigger
language plpgsql
security definer
set search_path = portal, pg_temp
as $$
begin
  perform portal.dispatch_n8n_webhook(
    'rais-input-submitted',
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

drop trigger if exists report_published_webhook on portal.status_reports;
create trigger report_published_webhook
after update on portal.status_reports
for each row
execute function portal.trg_report_published_webhook();

drop trigger if exists input_requested_webhook on portal.input_requests;
create trigger input_requested_webhook
after insert or update on portal.input_requests
for each row
execute function portal.trg_input_requested_webhook();

drop trigger if exists input_submitted_webhook on portal.input_submissions;
create trigger input_submitted_webhook
after insert on portal.input_submissions
for each row
execute function portal.trg_input_submitted_webhook();
