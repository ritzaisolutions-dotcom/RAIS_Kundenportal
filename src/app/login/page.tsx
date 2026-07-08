export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl mb-2">RAIS Client Portal</h1>
        <p className="text-muted mb-6">Bitte mit Ihren Zugangsdaten anmelden.</p>
        <form action="/auth/signin" method="post" className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">
              E-Mail
            </label>
            <input id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              Passwort
            </label>
            <input id="password" name="password" type="password" required />
          </div>
          {searchParams?.error ? <p className="text-red-600 text-sm">{searchParams.error}</p> : null}
          <button className="w-full bg-brand-orange text-white rounded-lg py-2.5 font-semibold" type="submit">
            Einloggen
          </button>
        </form>
      </div>
    </main>
  );
}
