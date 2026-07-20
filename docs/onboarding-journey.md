# RAIS Kunden-Onboarding Journey

**Stand:** 16.07.2026 · **ICP-Referenz:** erfahrener Immobilienmakler / kleine Hausverwaltung (abgeleitet aus [Haller_Onboarding_Input_Requirements.md](../../Haller_Onboarding_Input_Requirements.md))

---

## Strategische Einordnung

**Onboarding bleibt persönlich** — über Präsentation (Slides), Google Meet oder vor Ort. Der Kunde lernt RAIS, den Ablauf und die Ansprechpartner von Mensch zu Mensch. Das Portal ersetzt diesen Schritt **nicht**.

**Das Portal ergänzt** den persönlichen Onboarding-Prozess als dauerhafte, sichere Anlaufstelle danach (und schon ab dem Kickoff):

| Rolle des Portals | Was der Kunde damit macht |
|-------------------|---------------------------|
| **Dokumentation** | Status-Reports, Anleitungen, freigegebene Verträge/Rechnungen nachlesen |
| **Sichere Datenübergabe** | Strukturierte Aufgaben (Formulare, Uploads) statt unverschlüsselte E-Mail-Anhänge |
| **Nachverfolgbarkeit** | Anfragen an RAIS mit sichtbarem Status — kein „Habe ich schon geschrieben?“ |
| **Übersicht** | Startseite „Was brauche ich heute?“ — offene Punkte auf einen Blick |

**Prinzip:** Slides/Call erklären *warum* und *wie*; das Portal ist der Ort, wo Unterlagen *hingehören* und wo der Fortschritt *sichtbar* bleibt.

---

## ICP-Kurzprofil

Typischer Kunde: Inhaber oder GF, 50–65 Jahre, 2–15 Mitarbeiter, stark IS24-lastig, Microsoft 365 vorhanden, IT oft extern betreut. Erwartet einen klaren Vertrags- und Zahlungsweg, einen einfachen Termin und danach **eine** Anlaufstelle für Status und Dateneingabe — ohne Technik-Jargon. Onboarding versteht er als persönliches Gespräch; das Portal als praktisches Werkzeug danach.

---

## Journey-Visualisierung

<style>
  .onboarding-flow {
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    max-width: 960px;
    margin: 1.5rem 0;
  }
  .onboarding-flow h3 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
  }
  .flow-track {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
  }
  .flow-step {
    display: grid;
    grid-template-columns: 140px 1fr auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    background: #fff;
  }
  .flow-step:last-child { border-bottom: none; }
  .flow-step.manual { background: #fffbeb; }
  .flow-step.system { background: #ecfdf5; }
  .flow-step.hybrid { background: #eff6ff; }
  .flow-phase {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .flow-phase.pre { color: #b45309; }
  .flow-phase.portal { color: #047857; }
  .flow-phase.hybrid { color: #1d4ed8; }
  .flow-title { font-weight: 600; color: #0f172a; margin: 0 0 0.25rem; }
  .flow-detail { font-size: 0.875rem; color: #475569; margin: 0; }
  .flow-tool {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #334155;
    white-space: nowrap;
  }
  .flow-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
    font-size: 0.8125rem;
    color: #64748b;
  }
  .flow-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .dot-manual { background: #fbbf24; }
  .dot-system { background: #34d399; }
  .dot-hybrid { background: #60a5fa; }
  @media (max-width: 640px) {
    .flow-step { grid-template-columns: 1fr; gap: 0.5rem; }
  }
</style>

<div class="onboarding-flow">
  <h3>Gesamtprozess</h3>
  <div class="flow-track">
    <div class="flow-step manual">
      <span class="flow-phase pre">Pre-Portal</span>
      <div>
        <p class="flow-title">1. Verbales Ja</p>
        <p class="flow-detail">Angebot bestätigt, Projektstart vereinbart.</p>
      </div>
      <span class="flow-tool">Telefon / Meeting</span>
    </div>
    <div class="flow-step manual">
      <span class="flow-phase pre">Pre-Portal</span>
      <div>
        <p class="flow-title">2. AVV + SA via Skribble</p>
        <p class="flow-detail">Skribble mailt den Kunden von <code>noreply@skribble.*</code> — typisch 2 Mails (AVV + SA).</p>
      </div>
      <span class="flow-tool">Skribble</span>
    </div>
    <div class="flow-step hybrid">
      <span class="flow-phase hybrid">Automatisierung</span>
      <div>
        <p class="flow-title">3. Unterzeichnung → Benachrichtigung an Kevin</p>
        <p class="flow-detail">Skribble Callback → n8n → E-Mail an kevin@ritz-ai.solutions von portal@mail.ritz-ai.solutions.</p>
      </div>
      <span class="flow-tool">n8n + Skribble API</span>
    </div>
    <div class="flow-step manual">
      <span class="flow-phase pre">Pre-Portal</span>
      <div>
        <p class="flow-title">4. Willkommensmail + Stripe-Zahlungslink</p>
        <p class="flow-detail">Manuell nach Signatur-Benachrichtigung — Kunde zahlt Anzahlung / Projektstart.</p>
      </div>
      <span class="flow-tool">Stripe + Outlook</span>
    </div>
    <div class="flow-step manual">
      <span class="flow-phase pre">Pre-Portal</span>
      <div>
        <p class="flow-title">5. Bestätigung + Rechnung + Terminvorschlag</p>
        <p class="flow-detail">Nach Zahlung: Bestätigung, PDF-Rechnung, Cal.com-Link oder konkreter Terminvorschlag.</p>
      </div>
      <span class="flow-tool">Cal.com + Outlook</span>
    </div>
    <div class="flow-step manual">
      <span class="flow-phase pre">Pre-Portal</span>
      <div>
        <p class="flow-title">6. Onboarding-Session (Slides, Meet oder vor Ort)</p>
        <p class="flow-detail">Persönlicher Kickoff: Projekt, Ablauf, Ansprechpartner. Portal-Zugang gemeinsam einrichten — kurze Demo als Ergänzung, nicht Ersatz für das Gespräch.</p>
      </div>
      <span class="flow-tool">Slides + Meet / vor Ort</span>
    </div>
    <div class="flow-step system">
      <span class="flow-phase portal">Portal</span>
      <div>
        <p class="flow-title">7. Post-Call: Starter-Report + priorisierte Inputs</p>
        <p class="flow-detail">Report „So liefern Sie Ihre Unterlagen“ + 2–3 offene Input-Anfragen (Rest als Entwurf).</p>
      </div>
      <span class="flow-tool">RAIS Admin</span>
    </div>
    <div class="flow-step system">
      <span class="flow-phase portal">Portal</span>
      <div>
        <p class="flow-title">8. Kunde füllt Inputs aus</p>
        <p class="flow-detail">Grüne Erfolgsmeldung: <strong>„Daten übermittelt. Vielen Dank!“</strong></p>
      </div>
      <span class="flow-tool">RAIS Portal</span>
    </div>
    <div class="flow-step system">
      <span class="flow-phase portal">Portal</span>
      <div>
        <p class="flow-title">9. Laufende Status-Reports</p>
        <p class="flow-detail">Bei Veröffentlichung: automatische E-Mail an primary_contact_email.</p>
      </div>
      <span class="flow-tool">Portal + n8n</span>
    </div>
  </div>
  <div class="flow-legend">
    <span><i class="dot dot-manual"></i> Manuell (Pre-Portal)</span>
    <span><i class="dot dot-hybrid"></i> Minimal automatisiert</span>
    <span><i class="dot dot-system"></i> Portal-System</span>
  </div>
</div>

---

## Phasen-Playbook

| Phase | Wer | Aktion | Tool | Mail-Betreff (Vorschlag) | Fallback |
|-------|-----|--------|------|--------------------------|----------|
| Verbales Ja | Kevin | Angebot mündlich bestätigen, nächste Schritte nennen | — | — | Schriftliche Zusammenfassung per Mail |
| AVV + SA | Kevin → Skribble | Zwei Signature Requests anlegen (AVV, SA) | Skribble UI/API | *(Skribble sendet Einladung)* | Reminder in Skribble |
| Signatur-Alert | System | Callback → n8n → Mail an Kevin | n8n | `Skribble: AVV/SA unterzeichnet – {{kunde}}` | Skribble-Admin manuell prüfen |
| Stripe | Kevin | Payment Link senden | Stripe Dashboard | `Willkommen bei RAIS – Ihr Projektstart` | Telefonische Nachfrage |
| Bestätigung | Kevin | Zahlung bestätigen, Rechnung, Termin | Outlook + Cal.com | `Bestätigung & Terminvorschlag – {{projekt}}` | Cal.com Self-Booking-Link |
| Live-Session | Kevin + Kunde | Slides/Meet/vor Ort: Projekt, Ablauf, Portal-Kurzdemo | Slides + Meet / vor Ort | — | Rückruf innerhalb 24h |
| Post-Call | Kevin | Starter-Report publishen, Inputs freischalten | Admin | *(Report-Mail automatisch)* | Telefonische Erinnerung |
| Inputs | Kunde | Felder ausfüllen, Dateien hochladen | Portal | *(Alert an Kevin bei Einreichung)* | E-Mail / Anruf Mo–Fr 9–17 |
| Reports | Kevin | Status-Reports veröffentlichen | Admin | `Neuer Status-Report im RAIS Portal` | — |

---

## Mail-Vorlagen-Skelette

### Mail 1 — Hinweis vor Skribble (optional, von Kevin)

**Betreff:** `Vertragsunterlagen zur Unterschrift – {{projektname}}`

```html
<p>Guten Tag {{anrede}},</p>
<p>vielen Dank für Ihr Vertrauen. Im Anschluss erhalten Sie in Kürze zwei E-Mails von Skribble
   (AVV und Servicevereinbarung) zum digitalen Unterzeichnen.</p>
<p>Bitte prüfen Sie auch Ihren Spam-Ordner.</p>
<p>Viele Grüße<br/>Kevin Ritz<br/>RAIS</p>
```

> Skribble versendet die eigentlichen Signing-Links selbst von `noreply@skribble.com` / `noreply@skribble.de`.

### Mail 2 — Willkommen + Stripe (manuell nach Signatur)

**Betreff:** `Willkommen bei RAIS – Projektstart {{projektname}}`

```html
<p>Guten Tag {{anrede}},</p>
<p>vielen Dank für die unterzeichneten Unterlagen. Für den Projektstart bitten wir Sie um die
   Anzahlung über folgenden sicheren Link:</p>
<p><a href="{{stripe_payment_link}}">Jetzt bezahlen</a></p>
<p>Bei Fragen erreichen Sie mich unter {{telefon}}.</p>
<p>Viele Grüße<br/>Kevin Ritz<br/>RAIS</p>
```

### Mail 3 — Bestätigung + Rechnung + Termin

**Betreff:** `Zahlung bestätigt – Terminvorschlag Onboarding-Call`

```html
<p>Guten Tag {{anrede}},</p>
<p>vielen Dank — Ihre Zahlung ist eingegangen. Anbei/finden Sie die Rechnung.</p>
<p>Für das gemeinsame Onboarding (ca. 45 Min) schlage ich vor:</p>
<ul>
  <li>{{termin_option_1}}</li>
  <li>{{termin_option_2}}</li>
</ul>
<p>Alternativ können Sie sich direkt einen Termin buchen:
   <a href="{{cal_com_link}}">Cal.com – RAIS Onboarding</a></p>
<p>Viele Grüße<br/>Kevin Ritz<br/>RAIS</p>
```

### Mail 4 — Neuer Report (automatisch, Portal)

Siehe [email-templates.md](./email-templates.md) — Template `report_published`.

---

## Onboarding-Session — Portal-Kurzdemo (5 Min, am Ende der Session)

> Die eigentliche Onboarding-Arbeit passiert in Slides und Gespräch. Dieser Block ist die **kurze Übergabe** ans Portal als Dokumentations- und Datenkanal.

1. **Login:** `https://portal.ritz-ai.solutions/login` — E-Mail + temporäres Passwort setzen
2. **Übersicht:** „Was brauche ich heute?“ — offene Aufgaben, Anfragen, Dokumente
3. **Aufgaben:** Strukturierte Datenübergabe (Formulare, Fristen, sichere Uploads)
4. **Dokumente:** Freigegebene Verträge/Rechnungen — nicht im Postfach suchen
5. **Anfragen:** Fragen an RAIS mit Status statt lose E-Mails
6. **Reports:** Status-Updates nachlesen, wenn veröffentlicht
7. **Nächster Schritt:** „Bitte die 2–3 prioritären Aufgaben bis {{datum}} im Portal erledigen“

---

## Post-Session-Checkliste (für Kunden)

- [ ] Onboarding-Session (Slides/Meet/vor Ort) abgeschlossen — Ansprechpartner und nächste Schritte klar
- [ ] Portal-Login funktioniert, Passwort geändert
- [ ] Übersicht geöffnet — offene Aufgaben sichtbar
- [ ] Erster Report gelesen („So liefern Sie Ihre Unterlagen“)
- [ ] Priorisierte Aufgaben (z. B. M365-Admin, Postfächer) bis {{datum}} im Portal ausgefüllt
- [ ] IT-Ansprechpartner informiert (falls Graph-Consent nötig)
- [ ] Bei Problemen: {{telefon}} Mo–Fr 9–17 Uhr

---

## Skribble Setup (n8n) — **zurückgestellt (kein ROI bei aktuellem Scale)**

> **Status:** Signatur weiterhin manuell über Skribble UI. Der n8n-Workflow liegt als Vorlage im Repo, wird **nicht** importiert/aktiviert, bis sich Automatisierung lohnt. Bis dahin: manuelle Benachrichtigung an dich nach Unterzeichnung.

### Callback-URL (wenn Production-Key da ist)

Beim Erstellen jeder Signaturanfrage in Skribble:

```
callback_success_url = https://n8n.ritz-ai.solutions/webhook/rais-skribble-signed/{SKRIBBLE_SIGNATURE_REQUEST_ID}/{SKRIBBLE_DOCUMENT_ID}
```

### n8n-Workflow

Datei: [`n8n/workflows/skribble_signed.workflow.json`](../n8n/workflows/skribble_signed.workflow.json)

| Schritt | Aktion |
|---------|--------|
| 1 | Webhook empfangen (POST von Skribble) |
| 2 | `GET https://api.skribble.de/v2/signature-requests/{id}` — Status muss `SIGNED` sein |
| 3 | Optional: PDF mit `document_id` laden |
| 4 | E-Mail an `kevin@ritz-ai.solutions` von `portal@mail.ritz-ai.solutions` |
| 5 | HTTP 200 an Skribble |

### n8n-Umgebungsvariablen

| Variable | Wert |
|----------|------|
| `SKRIBBLE_API_TOKEN` | JWT aus Skribble Admin |
| `SKRIBBLE_API_BASE` | `https://api.skribble.de/v2` |

> Skribble hat kein HMAC — Callback immer per API verifizieren, nicht blind vertrauen.

**AVV + SA:** Zwei Requests → zwei Callbacks → zwei Benachrichtigungs-Mails (oder später: Zähler in n8n, eine Mail wenn beide `SIGNED`).

---

## Post-Session Starter-Paket (Admin)

Nach der Onboarding-Session im Portal bereitstellen:

| # | Aktion | Status |
|---|--------|--------|
| 1 | Report „So liefern Sie Ihre Unterlagen“ veröffentlichen | `published` |
| 2 | Input „M365-Administrator & Tenant-ID“ / „Microsoft Graph / M365 Zugang“ veröffentlichen | `open` |
| 3 | Input „Postfach-Adressen bestätigen“ veröffentlichen | `open` |
| 4 | Weitere Inputs als `draft` vorbereiten (E-Mail-Texte, Logos, Kalibrierung, Termine, Mitarbeiter, KPIs) | `draft` |

Admin kann Vorlagen über den Form-Builder laden (`src/lib/onboarding-input-templates.ts`).

Optionaler SQL-Seed: [`seed-onboarding-starter.sql`](./seed-onboarding-starter.sql) (Client-Slug anpassen). Haller-Vollpaket: [`seed-haller.sql`](./seed-haller.sql).

---

## Anhang A: seed-onboarding-starter.sql

```sql
-- Post-Call Starter-Paket für neue Kunden
-- Ersetze CLIENT_SLUG_PLACEHOLDER durch den echten Slug (z. B. haller).

insert into portal.status_reports (client_id, title, body_md, status, published_at)
select
  c.id,
  'So liefern Sie Ihre Unterlagen',
  E'## Willkommen im RAIS Portal\n\nNach unserem Onboarding-Call finden Sie hier Ihre nächsten Schritte.\n\n### Priorität 1\n- M365-Administrator & Tenant-ID\n- Postfach-Adressen bestätigen\n\n### Priorität 2\n- Dashboard-Nutzer\n- Aktive Inserate\n',
  'published',
  now()
from portal.clients c
where c.slug = 'CLIENT_SLUG_PLACEHOLDER'
  and not exists (
    select 1 from portal.status_reports sr
    where sr.client_id = c.id and sr.title = 'So liefern Sie Ihre Unterlagen'
  );

insert into portal.input_requests (client_id, title, kind, form_schema, status, due_date, description_md)
select c.id, seed.title, seed.kind, seed.form_schema::jsonb, seed.status, seed.due_date::date, seed.description_md
from portal.clients c
join (values
  ('M365-Administrator & Tenant-ID', 'form',
   '[{"key":"admin_kontakt","label":"Admin-Kontakt","type":"text","required":true},{"key":"tenant_id","label":"Tenant-ID","type":"text","required":true}]',
   'open', (current_date + 7)::text, 'M365-Admin und Tenant-ID.'),
  ('Postfach-Adressen bestätigen', 'form',
   '[{"key":"postfach_vertrieb","label":"Postfach Vertrieb","type":"email","required":true},{"key":"postfach_verwaltung","label":"Postfach Verwaltung","type":"email","required":true}]',
   'open', (current_date + 7)::text, 'Produktive Postfächer bestätigen.'),
  ('Dashboard-Nutzer', 'freetext', null, 'draft', null, 'Nutzer und Rollen — später.')
) as seed(title, kind, form_schema, status, due_date, description_md) on true
where c.slug = 'CLIENT_SLUG_PLACEHOLDER'
  and not exists (select 1 from portal.input_requests ir where ir.client_id = c.id and ir.title = seed.title);
```

---

## Anhang B: Skribble-n8n-Workflow (Vorlage, nicht deployen)

Datei: [`n8n/workflows/skribble_signed.workflow.json`](../n8n/workflows/skribble_signed.workflow.json) — erst nach Skribble **Production**-Key importieren.

- Webhook: `POST /webhook/rais-skribble-signed/:requestId/:documentId`
- Verify: `GET {SKRIBBLE_API_BASE}/signature-requests/{requestId}` → Status `SIGNED`
- Mail: `portal@mail.ritz-ai.solutions` → `kevin@ritz-ai.solutions`
- Env: `SKRIBBLE_API_TOKEN`, `SKRIBBLE_API_BASE=https://api.skribble.de/v2`

---

## Lückenregister

| # | Lücke | Status | Priorität |
|---|-------|--------|-----------|
| 1 | Skribble-Signed-Benachrichtigung (n8n) | Vorlage im Repo, **zurückgestellt** | Kein ROI bei aktuellem Scale — manuell in Skribble UI |
| 2 | Mail-Vorlagen Pre-Portal (Stripe, Bestätigung) | Dokumentiert, nicht im Repo | Mittel |
| 3 | Cal.com Event-Type dokumentiert | In Playbook | Niedrig |
| 4 | Kunden-Passwort per Reset-Link (statt nur Admin-Flash) | Backlog | E-Mail an kevin@ritz-ai.solutions reicht vorerst |
| 5 | Post-Call-Starter als Standard-Seed | `docs/seed-onboarding-starter.sql` | Erledigt |
| 6 | Input-Erfolgstext „Daten übermittelt. Vielen Dank!“ | Portal-Fix | Erledigt |
| 7 | Report-Mail bei INSERT-as-published | Migration `20260710113000_*` | Erledigt (Migration live anwenden) |
| 8 | Admin „Veröffentlichen“ für Draft-Reports | Route + UI | Erledigt |
| 9 | Rechnungsprozess (Stripe Receipt vs. PDF) | Manuell | Niedrig |
| 10 | Zweiter Portal-Login (Assistentin) | Manuell über Admin | Niedrig |

---

## Audit-Scorecard (ICP)

| Phase | Prozess | System | Kommentar |
|-------|---------|--------|-----------|
| Skribble AVV+SA | 8/10 | 0/10 → 6/10 mit n8n | Branchenüblich; Alert automatisiert |
| Willkommen + Stripe | 7/10 | 0/10 | Manuell, Vorlagen hier |
| Bestätigung + Termin | 8/10 | 0/10 | Cal.com passt zum ICP |
| Live-Session + Portal | 9/10 | 8/10 | Onboarding persönlich; Portal als Dokumentation & Datenkanal |
| Post-Call-Anleitung | 9/10 | 2/10 → 6/10 mit Starter-Seed | Konzept stark |
| Input + Erfolg | 8/10 | 7/10 → 9/10 nach Fix | Flow vorhanden |
| Reports + E-Mail | 9/10 | 6/10 → 9/10 nach Fix | n8n live |

**Gesamtnote: 7/10 → 8/10** nach minimalen Portal-Fixes und Skribble-n8n.

---

## Verwandte Dokumente

- [email-templates.md](./email-templates.md) — Portal-Transaktionsmails
- [seed-haller.sql](./seed-haller.sql) — Vollständiges Haller-Input-Paket
- [seed-onboarding-starter.sql](./seed-onboarding-starter.sql) — Minimales Post-Call-Paket
- [operations.md](./operations.md) — Deployment & n8n
- [Haller_Onboarding_Input_Requirements.md](../../Haller_Onboarding_Input_Requirements.md) — ICP-Referenz
