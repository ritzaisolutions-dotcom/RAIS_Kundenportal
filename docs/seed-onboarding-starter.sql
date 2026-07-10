-- Post-Call Starter-Paket für neue Kunden
-- Ersetze CLIENT_SLUG_PLACEHOLDER durch den echten Slug (z. B. haller).

insert into portal.status_reports (client_id, title, body_md, status, published_at)
select
  c.id,
  'So liefern Sie Ihre Unterlagen',
  E'## Willkommen im RAIS Portal\n\nNach unserem Onboarding-Call finden Sie hier Ihre nächsten Schritte.\n\n### Priorität 1 (bitte bis zum vereinbarten Datum)\n- M365-Administrator & Tenant-ID\n- Postfach-Adressen bestätigen\n\n### Priorität 2 (in den nächsten Tagen)\n- Dashboard-Nutzer\n- Aktive Inserate\n\nBei Fragen: Mo–Fr 9–17 Uhr telefonisch oder per E-Mail.\n',
  'published',
  now()
from portal.clients c
where c.slug = 'CLIENT_SLUG_PLACEHOLDER'
  and not exists (
    select 1 from portal.status_reports sr
    where sr.client_id = c.id and sr.title = 'So liefern Sie Ihre Unterlagen'
  );

insert into portal.input_requests (client_id, title, kind, form_schema, status, due_date, description_md)
select
  c.id,
  seed.title,
  seed.kind,
  seed.form_schema::jsonb,
  seed.status,
  seed.due_date::date,
  seed.description_md
from portal.clients c
join (
  values
    (
      'M365-Administrator & Tenant-ID',
      'form',
      '[{"key":"admin_kontakt","label":"Admin-Kontakt (Name + E-Mail)","type":"text","required":true},{"key":"tenant_id","label":"Tenant-ID","type":"text","required":true}]',
      'open',
      (current_date + interval '7 days')::text,
      'Bitte den M365-Administrator benennen und die Tenant-ID liefern.'
    ),
    (
      'Postfach-Adressen bestätigen',
      'form',
      '[{"key":"postfach_vertrieb","label":"Postfach Vertrieb","type":"email","required":true},{"key":"postfach_verwaltung","label":"Postfach Verwaltung","type":"email","required":true}]',
      'open',
      (current_date + interval '7 days')::text,
      'Bitte die produktiven Postfach-Adressen für Vertrieb und Verwaltung bestätigen.'
    ),
    (
      'Dashboard-Nutzer',
      'freetext',
      null,
      'draft',
      null,
      'Alle Dashboard-Nutzer mit E-Mail und Rolle — nach den prioritären Inputs.'
    )
) as seed(title, kind, form_schema, status, due_date, description_md) on true
where c.slug = 'CLIENT_SLUG_PLACEHOLDER'
  and not exists (
    select 1 from portal.input_requests ir where ir.client_id = c.id and ir.title = seed.title
  );
