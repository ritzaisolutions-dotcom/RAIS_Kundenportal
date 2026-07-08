# RAIS Ship Audit Checklist (Portal)

- [ ] `portal` Schema + RLS aktiv, anon hat keinen Zugriff
- [ ] Auth Signups deaktiviert
- [ ] Admin-Only Zugriff auf `/admin/*` geprüft
- [ ] Kunde sieht nur eigene Status-Reports und Input-Anfragen (IDOR-Check)
- [ ] n8n Webhooks prüfen Secret-Header und blocken ungültige Requests
- [ ] Entwürfe von Reports/Requests lösen keine Kundenmails aus
- [ ] `/datenschutz` und `/impressum` veröffentlicht
- [ ] Deployment Protection für Previews aktiv
- [ ] Login Rate-Limits in Supabase dokumentiert
- [ ] Löschkonzept inklusive Storage-Cleanup dokumentiert
- [ ] Domain `portal.ritz-ai.solutions` auf produktives Deployment gesetzt
- [ ] Haller Seed-Daten angelegt und mit Thomas abgestimmt
- [ ] Impressum mit finalen Stammdaten ergänzt (Anschrift, Vertretungsberechtigte, Registerangaben)
