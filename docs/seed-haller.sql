-- Haller initial seed (Phase G)
-- Fill in thomas_email before running.

with haller as (
  insert into portal.clients (name, slug, primary_contact_email)
  values ('Haller Immobilienberatung', 'haller', 'THOMAS_EMAIL_PLACEHOLDER')
  on conflict (slug) do update set name = excluded.name
  returning id
),
existing_user as (
  select id as user_id from auth.users where email = 'THOMAS_EMAIL_PLACEHOLDER'
)
insert into portal.client_users (user_id, client_id, display_name)
select existing_user.user_id, haller.id, 'Thomas'
from haller, existing_user
on conflict (user_id) do nothing;

insert into portal.input_requests (client_id, title, kind, form_schema, status, due_date, description_md)
select
  c.id,
  seed.title,
  seed.kind,
  seed.form_schema::jsonb,
  'draft',
  seed.due_date::date,
  seed.description_md
from portal.clients c
join (
  values
    (
      'M365-Administrator & Tenant-ID',
      'form',
      '[{"key":"admin_kontakt","label":"Admin-Kontakt","type":"text","required":true},{"key":"tenant_id","label":"Tenant-ID","type":"text","required":true}]',
      '2026-07-10',
      'Bitte M365-Admin-Kontakt und Tenant-ID bestaetigen.'
    ),
    (
      'Postfach-Adressen bestaetigen',
      'form',
      '[{"key":"postfach_vertrieb","label":"Postfach Vertrieb","type":"email","required":true},{"key":"postfach_verwaltung","label":"Postfach Verwaltung","type":"email","required":true},{"key":"postfach_is24_eingang","label":"IS24 Eingangspostfach","type":"email","required":true}]',
      '2026-07-10',
      'Bitte die produktiven Postfach-Adressen bestaetigen.'
    ),
    (
      'Dashboard-Nutzer',
      'freetext',
      null,
      '2026-07-10',
      'Bitte alle Dashboard-Nutzer und Rollen nennen. Optional Datei mit Liste hochladen.'
    ),
    (
      'Aktive Inserate',
      'freetext',
      null,
      null,
      'Liste aktiver Inserate mit Adresse, Kauf/Miete und Expose-Nummer.'
    ),
    (
      'Impressums-/Datenschutzangaben LP1',
      'freetext',
      null,
      null,
      'Bitte die finalen Impressums- und Datenschutzangaben für LP1 liefern.'
    )
) as seed(title, kind, form_schema, due_date, description_md) on true
where c.slug = 'haller'
  and not exists (
    select 1 from portal.input_requests ir where ir.client_id = c.id and ir.title = seed.title
  );
