# RAIS Client Portal Operations

## Deployment checklist

1. Vercel Projekt `rais-portal` mit Root `rais-portal/` verbinden.
2. Region auf `fra1` setzen.
3. Deployment Protection fuer Preview aktivieren.
4. Env Variablen setzen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `N8N_WEBHOOK_SECRET`
5. Domain `portal.ritz-ai.solutions` an das Vercel-Projekt binden.

## Supabase setup

1. Migration `supabase/migrations/20260708222000_portal_schema_rls.sql` anwenden.
2. API Exposed schemas um `portal` ergaenzen.
3. Auth: Self-Signup deaktivieren.
4. Rate-Limit fuer Login in Auth-Einstellungen pruefen.

## n8n and Resend

1. Die drei Workflows aus `n8n/workflows/*.json` importieren.
2. In jedem Workflow zuerst Secret-Check ausfuehren; bei mismatch `401`.
3. Resend Domain `mail.ritz-ai.solutions` verifizieren.
4. Resend API Key als `RESEND_API_KEY` in n8n hinterlegen.
5. Supabase Database Webhooks auf die n8n Webhook-URLs setzen (nur auf `published`/`open`/`insert` Events).

## Storage cleanup concept

Beim Loeschen eines Kunden:
- DB Daten per Cascade entfernen.
- Danach Storage-Pfade `client_id/*` aus Buckets `report-images` und `submissions` loeschen.
- Optional als Edge Function oder n8n Job ausfuehren.
