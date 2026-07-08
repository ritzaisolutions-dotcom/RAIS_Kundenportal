export default async function NewReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Neuen Report erstellen</h2>
      <form action={`/admin/clients/${id}/reports/new/create`} method="post" className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="title">
            Titel
          </label>
          <input id="title" name="title" required />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="body_md">
            Inhalt (Markdown)
          </label>
          <textarea id="body_md" name="body_md" rows={16} required />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue="draft">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        {resolvedSearch.error ? <p className="text-sm text-red-600">{resolvedSearch.error}</p> : null}
        {resolvedSearch.success ? <p className="text-sm text-green-700">{resolvedSearch.success}</p> : null}
        <button type="submit" className="bg-brand-orange text-white rounded-lg px-4 py-2 font-semibold">
          Report speichern
        </button>
      </form>
    </section>
  );
}
