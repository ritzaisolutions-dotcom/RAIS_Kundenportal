-- Supabase Database Webhooks (run in SQL editor after creating n8n webhook URLs)
-- Replace the placeholder URLs with the real n8n endpoints.

-- report_published
create trigger report_published_webhook
after update on portal.status_reports
for each row
when (old.status is distinct from new.status and new.status = 'published')
execute function supabase_functions.http_request(
  'https://N8N_HOST/webhook/rais-report-published',
  'POST',
  '{"Content-Type":"application/json","x-portal-secret":"N8N_WEBHOOK_SECRET"}',
  '{}',
  '5000'
);

-- input_requested
create trigger input_requested_webhook
after insert or update on portal.input_requests
for each row
when (new.status = 'open')
execute function supabase_functions.http_request(
  'https://N8N_HOST/webhook/rais-input-requested',
  'POST',
  '{"Content-Type":"application/json","x-portal-secret":"N8N_WEBHOOK_SECRET"}',
  '{}',
  '5000'
);

-- input_submitted
create trigger input_submitted_webhook
after insert on portal.input_submissions
for each row
execute function supabase_functions.http_request(
  'https://N8N_HOST/webhook/rais-input-submitted',
  'POST',
  '{"Content-Type":"application/json","x-portal-secret":"N8N_WEBHOOK_SECRET"}',
  '{}',
  '5000'
);
