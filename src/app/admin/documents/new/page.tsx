import Link from "next/link";

const defaultSchema = JSON.stringify(
  [{ key: "KUNDE_FIRMA", label: "Kunde Firma" }],
  null,
  2,
);

export default async function AdminNewDocumentTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const resolvedSearch = await searchParams;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/documents" className="text-sm text-grey-500 hover:text-grey-900">
          ← Zurück
        </Link>
        <h2 className="text-xl">Neue Dokumentvorlage</h2>
      </div>

      <form
        action="/admin/documents/new/create"
        method="post"
        encType="multipart/form-data"
        className="card card-content space-y-4"
      >
        <div>
          <label htmlFor="name" className="block text-xs text-grey-600 mb-1">
            Name
          </label>
          <input id="name" name="name" required />
        </div>
        <div>
          <label htmlFor="category" className="block text-xs text-grey-600 mb-1">
            Kategorie
          </label>
          <select id="category" name="category" required defaultValue="Rechnung">
            <option value="Rechnung">Rechnung</option>
            <option value="Vertrag">Vertrag</option>
            <option value="Angebot">Angebot</option>
            <option value="Testimonial">Testimonial</option>
            <option value="Sonstiges">Sonstiges</option>
          </select>
        </div>
        <div>
          <label htmlFor="template_file" className="block text-xs text-grey-600 mb-1">
            Vorlage (.html oder .docx)
          </label>
          <input id="template_file" name="template_file" type="file" accept=".html,.htm,.docx" required />
        </div>
        <div>
          <label htmlFor="variable_schema" className="block text-xs text-grey-600 mb-1">
            Variablen-Schema (JSON, optional – wird sonst automatisch erkannt)
          </label>
          <textarea id="variable_schema" name="variable_schema" rows={8} defaultValue={defaultSchema} className="font-mono text-xs" />
        </div>
        {resolvedSearch.error ? <p className="chip chip-error">{resolvedSearch.error}</p> : null}
        {resolvedSearch.success ? <p className="chip chip-success">{resolvedSearch.success}</p> : null}
        <button type="submit" className="btn btn-primary">
          Vorlage speichern
        </button>
      </form>
    </section>
  );
}
