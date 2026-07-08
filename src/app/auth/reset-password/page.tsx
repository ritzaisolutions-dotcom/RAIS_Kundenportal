export default function ResetPasswordPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl mb-2">Passwort setzen</h1>
        <p className="text-muted mb-6">Bitte vergeben Sie ein neues Passwort fuer Ihren ersten Login.</p>
        <form action="/auth/reset-password/submit" method="post" className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              Neues Passwort
            </label>
            <input id="password" name="password" type="password" required minLength={10} />
          </div>
          {searchParams?.error ? <p className="text-red-600 text-sm">{searchParams.error}</p> : null}
          <button className="w-full bg-brand-orange text-white rounded-lg py-2.5 font-semibold" type="submit">
            Passwort speichern
          </button>
        </form>
      </div>
    </main>
  );
}
