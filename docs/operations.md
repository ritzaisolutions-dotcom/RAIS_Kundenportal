# RAIS Client Portal Operations

## Deployment checklist

1. Vercel Projekt `rais-portal` mit Root `rais-portal/` verbinden.
2. Region auf `fra1` setzen.
3. Deployment Protection für Preview aktivieren.
4. Env-Variablen setzen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `N8N_WEBHOOK_SECRET`
5. Domain `portal.ritz-ai.solutions` an das Vercel-Projekt binden.

## Supabase setup

1. Migration `supabase/migrations/20260708222000_portal_schema_rls.sql` anwenden.
2. API Exposed Schemas um `portal` ergänzen.
3. Auth: Self-Signup deaktivieren.
4. Rate-Limits prüfen und dokumentieren:
   - `Auth > Rate Limits > Email sent` und `Auth > Rate Limits > Sign in / Sign up`
   - Test: 6 schnelle Login-Versuche mit falschem Passwort aus gleicher IP
   - Erwartung: Supabase blockt weitere Versuche (429 oder temporäre Sperre)
   - Ergebnis mit Datum in `docs/ship-audit-checklist.md` ergänzen

## n8n and E-Mail Node

1. Die drei Workflows aus `n8n/workflows/*.json` importieren.
2. In jedem Workflow zuerst Secret-Check ausführen; bei mismatch muss der `Unauthorized 401`-Node antworten.
3. In n8n SMTP-Credentials für den Node `Email Send` hinterlegen.
4. `fromEmail` auf `portal@mail.ritz-ai.solutions` setzen und Testmail versenden.
5. In `report_published` und `input_requested` den Postgres-Credential für den Node `Load Client Email` hinterlegen.
6. Supabase Database Webhooks auf die n8n Webhook-URLs setzen (nur auf `published`/`open`/`insert` Events).

## Storage cleanup concept

Beim Löschen eines Kunden:
- DB Daten per Cascade entfernen.
- Danach Storage-Pfade `client_id/*` aus Buckets `report-images` und `submissions` löschen.
- Optional als Edge Function oder n8n Job ausführen.
