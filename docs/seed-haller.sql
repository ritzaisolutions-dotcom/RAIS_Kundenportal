-- Haller initial seed (Phase G) + Onboarding-Erweiterung (Form-Vorlagen)
-- Fill in thomas_email before running (client/user bootstrap only).
-- Input inserts are idempotent by (client_id, title).

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
    -- Bestehende Seeds
    (
      'M365-Administrator & Tenant-ID',
      'form',
      '[{"key":"admin_kontakt","label":"Admin-Kontakt","type":"text","required":true},{"key":"tenant_id","label":"Tenant-ID","type":"text","required":true}]',
      '2026-07-10',
      'Bitte M365-Admin-Kontakt und Tenant-ID bestätigen.'
    ),
    (
      'Postfach-Adressen bestätigen',
      'form',
      '[{"key":"postfach_vertrieb","label":"Postfach Vertrieb","type":"email","required":true},{"key":"postfach_verwaltung","label":"Postfach Verwaltung","type":"email","required":true},{"key":"postfach_is24_eingang","label":"IS24 Eingangspostfach","type":"email","required":true}]',
      '2026-07-10',
      'Bitte die produktiven Postfach-Adressen bestätigen.'
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
      'Liste aktiver Inserate mit Adresse, Kauf/Miete und Exposé-Nummer.'
    ),
    (
      'Impressums-/Datenschutzangaben LP1',
      'freetext',
      null,
      null,
      'Bitte die finalen Impressums- und Datenschutzangaben für LP1 liefern.'
    ),
    -- Neue Onboarding-Vorlagen (Portal Form-Builder)
    (
      'E-Mail-Texte freigeben',
      'form',
      '[{"key":"text_usage","label":"Text: Usage / Bestätigung Nutzung","type":"textarea","required":true},{"key":"text_rueckfrage","label":"Text: Rückfrage","type":"textarea","required":true},{"key":"text_absage","label":"Text: Absage","type":"textarea","required":true},{"key":"text_erinnerung","label":"Text: Erinnerung","type":"textarea","required":true}]',
      null,
      'Bitte die vorgeschlagenen Automatik-Texte prüfen und freigeben bzw. anpassen. RAIS liefert Vorschläge; Go-Live erst nach Ihrer Freigabe.'
    ),
    (
      'Microsoft Graph / M365 Zugang',
      'form',
      '[{"key":"admin_kontakt","label":"M365-Administrator (Name + Kontakt)","type":"text","required":true},{"key":"tenant_id","label":"Tenant-ID","type":"text","required":true},{"key":"consent_bestaetigt","label":"Admin-Consent erteilt?","type":"select","required":true,"options":["Ja","Nein","Noch offen"]},{"key":"access_policy_erledigt","label":"Exchange Access Policy eingerichtet?","type":"select","required":true,"options":["Ja","Nein","Noch offen"]}]',
      null,
      'Angaben für den Microsoft-Graph-Zugang (Mail lesen/senden, Kalender). Tenant-ID ist öffentlich — kein Secret.'
    ),
    (
      'Branding-Logos',
      'form',
      '[{"key":"logo_mit_text","label":"Logo mit Text","type":"file","required":true},{"key":"logo_ohne_text","label":"Logo ohne Text (Icon/Mark)","type":"file","required":true}]',
      null,
      'Bitte Logo-Dateien hochladen (SVG/PNG bevorzugt): Variante mit Text und ohne Text.'
    ),
    (
      'Kalibrierungs-Anfragen',
      'form',
      '[{"key":"anfragen_qualifiziert","label":"5 qualifizierte E-Mail-Anfragen (Datei)","type":"file","required":true},{"key":"anfragen_unqualifiziert","label":"5 unqualifizierte E-Mail-Anfragen (Datei)","type":"file","required":true}]',
      null,
      'Jeweils ca. 5 echte Beispiel-Anfragen zur KI-Kalibrierung (z. B. als PDF, EML oder TXT-Export).'
    ),
    (
      'Zuständige Kontakte Miete / Kauf',
      'form',
      '[{"key":"email_miete","label":"E-Mail zuständig Miete","type":"email","required":true},{"key":"email_kauf","label":"E-Mail zuständig Kauf","type":"email","required":true}]',
      null,
      'E-Mail-Adressen der zuständigen Ansprechpartner für Routing und Terminmails.'
    ),
    (
      'Terminregeln Miete / Kauf',
      'form',
      '[{"key":"mindestangaben_miete","label":"Mindestangaben Terminvergabe Miete","type":"textarea","required":true},{"key":"mindestangaben_kauf","label":"Mindestangaben Terminvergabe Kauf","type":"textarea","required":true},{"key":"dauer_kauf","label":"Dauer Kauf-Termin","type":"select","required":true,"options":["1 Stunde","45 Minuten","90 Minuten","Andere (bitte in Mindestangaben notieren)"]},{"key":"dauer_miete","label":"Dauer Miete-Termin","type":"select","required":true,"options":["30 Minuten","45 Minuten","60 Minuten","Andere (bitte in Mindestangaben notieren)"]}]',
      null,
      'Mindestangaben für die Terminvergabe sowie Bestätigung der Slot-Dauer (Kauf 1 Std., Miete 30 Min.).'
    ),
    (
      'Mitarbeiter-Zugänge',
      'form',
      '[{"key":"mitarbeiter_emails","label":"E-Mails aller Mitarbeiter (eine pro Zeile)","type":"textarea","required":true},{"key":"mitarbeiter_csv","label":"Optional: CSV-Liste","type":"file","required":false}]',
      null,
      'E-Mail-Adressen aller Mitarbeiter, für die Dashboard-/Portal-Zugänge angelegt werden sollen. Optional zusätzlich als CSV.'
    ),
    (
      'KPI-Wünsche Waldemar (Overdeliver)',
      'form',
      '[{"key":"kpi_wuensche","label":"Gewünschte KPIs / Report-Inhalte","type":"textarea","required":true}]',
      null,
      'Welche Kennzahlen und Reports soll Waldemar im Portal bzw. in den Status-Reports sehen? (Overdeliver-Abstimmung)'
    )
) as seed(title, kind, form_schema, due_date, description_md) on true
where c.slug = 'haller'
  and not exists (
    select 1 from portal.input_requests ir where ir.client_id = c.id and ir.title = seed.title
  );
