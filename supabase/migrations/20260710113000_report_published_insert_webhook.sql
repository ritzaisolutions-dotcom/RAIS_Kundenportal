-- Fire report_published webhook when a report is inserted directly as published,
-- not only when status transitions on UPDATE.

create or replace function portal.trg_report_published_webhook()
returns trigger
language plpgsql
security definer
set search_path = portal, pg_temp
as $$
begin
  if TG_OP = 'INSERT' and new.status = 'published' then
    perform portal.dispatch_n8n_webhook(
      'rais-report-published',
      jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(new),
        'old_record', null
      )
    );
  elsif TG_OP = 'UPDATE' and old.status is distinct from new.status and new.status = 'published' then
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

drop trigger if exists report_published_webhook on portal.status_reports;
create trigger report_published_webhook
after insert or update on portal.status_reports
for each row
execute function portal.trg_report_published_webhook();
