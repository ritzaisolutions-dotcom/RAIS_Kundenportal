# RAIS Ship Audit Checklist (Portal)

- [ ] `portal` Schema + RLS aktiv, anon hat keinen Zugriff
- [ ] Auth Signups deaktiviert
- [ ] Admin-Only Zugriff auf `/admin/*` geprueft
- [ ] Kunde sieht nur eigene Reports und Input-Anfragen (IDOR-Check)
- [ ] n8n Webhooks pruefen Secret-Header und blocken ungueltige Requests
- [ ] Draft Reports/Requests loesen keine Kundenmails aus
- [ ] `/datenschutz` und `/impressum` veroeffentlicht
- [ ] Deployment Protection fuer Previews aktiv
- [ ] Login Rate-Limits in Supabase dokumentiert
- [ ] Loeschkonzept inklusive Storage-Cleanup dokumentiert
- [ ] Domain `portal.ritz-ai.solutions` auf produktives Deployment gesetzt
- [ ] Haller Seed-Daten angelegt und mit Thomas abgestimmt
