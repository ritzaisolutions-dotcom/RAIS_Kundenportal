# RAIS Ship Audit Checklist (Portal)

- [x] `portal` Schema + RLS aktiv, anon hat keinen Zugriff (2026-07-09: anon-Grants zusätzlich komplett entzogen, siehe Ship-Audit v1.0)
- [x] Auth Signups deaktiviert
- [x] Admin-Only Zugriff auf `/admin/*` geprüft
- [x] Kunde sieht nur eigene Status-Reports und Input-Anfragen (IDOR-Check)
- [x] n8n Webhooks prüfen Secret-Header und blocken ungültige Requests (2026-07-09: live verifiziert, Secret war im Klartext exponiert -> rotiert, Response Mode auf "Using Respond to Webhook Node" umgestellt)
- [x] Entwürfe von Reports/Requests lösen keine Kundenmails aus
- [x] `/impressum` und `/datenschutz` sind öffentlich ohne Login erreichbar (2026-07-09 gefixt, waren zuvor hinter der Auth-Middleware)
- [x] Deployment Protection für Previews aktiv
- [ ] Login Rate-Limits in Supabase dokumentiert (Test aus docs/operations.md Punkt 4 noch nicht durchgeführt)
- [x] Löschkonzept inklusive Storage-Cleanup dokumentiert (weiterhin nur konzeptionell, nicht automatisiert - siehe Ship-Audit LOW-Finding)
- [x] Domain `portal.ritz-ai.solutions` auf produktives Deployment gesetzt (Vercel-Projekt `rais-kundenportal`, DNS verifiziert)
- [ ] Haller Seed-Daten angelegt und mit Thomas abgestimmt
- [ ] Impressum mit finalen Stammdaten ergänzt (Anschrift, Vertretungsberechtigte, Registerangaben) - Platzhalter sind weiterhin live
- [x] n8n Smoke-Test 2026-07-09: alle drei Workflows aktiv, POST konfiguriert, Secret-Check + Response-Mode live geprüft und korrigiert
- [x] Webhook-Trigger auf Vault+pg_net Migration umgestellt (2026-07-10: Vault-Secret angelegt, Migration `portal_webhooks_vault` live, keine Klartext-Secrets mehr in Trigger-Metadaten)
- [x] `input_requested` benachrichtigt nur bei Transition nach `open` (2026-07-10: DB-Trigger-Guard live; n8n-Workflow-Guard in Repo, Import in n8n prüfen)

## Offen aus Ship-Audit v1.0 (2026-07-09)

- [ ] Verwaistes Vercel-Projekt `rais-portal` (Duplikat ohne Custom Domain) - löschen oder Zweck klären
- [ ] Geteiltes Supabase-Projekt (`qdywaenmojdxhfxqbvun`) mit unabhängigem CRM/Lead-System - bewusste Entscheidung nötig
- [ ] Sign-in Rate-Limiting app-seitig ergänzen bzw. Supabase-Default verifizieren
