# RAIS Client Portal

Kundenportal fuer Status-Reports und strukturierte Input-Erfassung.

## Tech Stack

- Next.js App Router (TypeScript)
- Supabase (Auth, Postgres, Storage, RLS)
- Vercel (`fra1`)
- n8n + Resend fuer Portal-Benachrichtigungen

## Lokale Entwicklung

1. Abhaengigkeiten installieren:

```bash
npm install
```

2. `.env.local` anlegen:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
N8N_WEBHOOK_SECRET=...
```

3. Dev-Server starten:

```bash
npm run dev
```

## Datenbank

- Migration: `supabase/migrations/20260708222000_portal_schema_rls.sql`
- Haller Seed: `docs/seed-haller.sql`

## Operations

- Deployment, n8n und Resend Setup: `docs/operations.md`
- Workflows: `n8n/workflows/*.workflow.json`
- Branding: `brand.md`
