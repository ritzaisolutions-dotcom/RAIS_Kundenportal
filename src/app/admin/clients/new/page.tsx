export default function NewClientPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; tempPassword?: string };
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Neuen Kunden anlegen</h2>
      <form action="/admin/clients/new/create" method="post" encType="multipart/form-data" className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm mb-1">
            Kundenname
          </label>
          <input id="name" name="name" required />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm mb-1">
            Slug
          </label>
          <input id="slug" name="slug" required />
        </div>
        <div>
          <label htmlFor="primary_contact_email" className="block text-sm mb-1">
            Kontakt-E-Mail (Client-User)
          </label>
          <input id="primary_contact_email" name="primary_contact_email" type="email" required />
        </div>
        <div>
          <label htmlFor="display_name" className="block text-sm mb-1">
            Anzeigename User
          </label>
          <input id="display_name" name="display_name" required />
        </div>
        <div>
          <label htmlFor="logo" className="block text-sm mb-1">
            Kundenlogo
          </label>
          <input id="logo" name="logo" type="file" accept="image/*" />
        </div>
        {searchParams?.error ? <p className="text-sm text-red-600">{searchParams.error}</p> : null}
        {searchParams?.success ? <p className="text-sm text-green-700">{searchParams.success}</p> : null}
        {searchParams?.tempPassword ? (
          <p className="text-sm bg-linen-soft border border-border rounded p-2">
            Temporaeres Passwort fuer den Erstlogin: <code>{searchParams.tempPassword}</code>
          </p>
        ) : null}
        <button type="submit" className="bg-brand-orange text-white rounded-lg px-4 py-2 font-semibold">
          Kunde anlegen
        </button>
      </form>
    </section>
  );
}
