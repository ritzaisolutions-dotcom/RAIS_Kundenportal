import Link from "next/link";
import { PartnerBrand } from "@/components/partner-brand";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearch = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--color-linen)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] portal-card p-8 md:p-10">
        <div className="mb-6">
          <PartnerBrand compact />
        </div>

        <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-charcoal)] mb-2">
          Willkommen zurück
        </h1>
        <p className="text-sm text-[var(--color-stone)] mb-8">
          Bitte mit Ihren Zugangsdaten am RAIS Partner Portal anmelden.
        </p>

        <form action="/auth/signin" method="post" className="space-y-5">
          <div>
            <label className="login-label block mb-2" htmlFor="email">
              E-Mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="login-label block mb-2" htmlFor="password">
              Passwort
            </label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {resolvedSearch?.error ? <p className="chip chip-error">{resolvedSearch.error}</p> : null}

          <button className="btn btn-primary w-full py-2.5 mt-2" type="submit">
            Einloggen
          </button>
        </form>

        <p className="text-xs text-[var(--color-stone)] mt-6 text-center">
          Passwort vergessen?{" "}
          <Link href="/impressum" className="text-[var(--color-orange)] font-medium underline-offset-2 hover:underline">
            Kontaktieren Sie uns
          </Link>
        </p>
      </div>

      <footer className="mt-8 text-center text-xs text-[var(--color-stone)] space-x-3">
        <Link href="/impressum" className="underline-offset-2 hover:underline">
          Impressum
        </Link>
        <Link href="/datenschutz" className="underline-offset-2 hover:underline">
          Datenschutz
        </Link>
      </footer>
    </main>
  );
}
