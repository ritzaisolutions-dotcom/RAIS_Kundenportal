# RAIS Client Portal

Kundenportal für Status-Reports und strukturierte Input-Erfassung.

## Tech Stack

- Next.js App Router (TypeScript)
- Supabase (Auth, Postgres, Storage, RLS)
- Vercel (`fra1`)
- n8n mit nativen E-Mail-Nodes für Portal-Benachrichtigungen

## Lokale Entwicklung

1. Abhängigkeiten installieren:

```bash
npm install
```

2. `.env.local` anlegen:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. Dev-Server starten:

```bash
npm run dev
```

## Datenbank

- Migration: `supabase/migrations/20260708222000_portal_schema_rls.sql`
- Haller Seed: `docs/seed-haller.sql`
- Testkunden (Berechtigungen): `npm run seed:test-customers` — legt drei Testkunden mit unterschiedlichen `can_view_reports` / `can_view_inputs`-Profilen an

## Operations

- Deployment und n8n E-Mail-Setup: `docs/operations.md`
- E-Mail-Vorlagen: `docs/email-templates.md`
- Workflows: `n8n/workflows/*.workflow.json`
- Branding: `brand.md`
