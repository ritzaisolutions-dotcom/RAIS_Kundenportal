import { redirect } from "next/navigation";
import { getInputRequestForClient, parseFormSchema, requirePortalUser, resolvePortalHome } from "@/lib/portal-queries";
import { ACCEPT_SUBMISSION_FILES } from "@/lib/upload-validation";

export default async function PortalInputDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const { clientId, canViewReports, canViewInputs } = await requirePortalUser();
  if (!canViewInputs) {
    redirect(resolvePortalHome({ canViewReports, canViewInputs }));
  }

  const request = await getInputRequestForClient(id, clientId!);
  const fields = parseFormSchema(request.form_schema);

  return (
    <section className="space-y-4">
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-2xl">{request.title}</h2>
        {request.description_md ? <p className="text-muted mt-2 whitespace-pre-wrap">{request.description_md}</p> : null}
        {request.due_date ? <p className="text-sm mt-3">Fällig am: {request.due_date}</p> : null}
      </div>

      <form
        action={`/portal/inputs/${id}/submit`}
        method="post"
        encType="multipart/form-data"
        className="bg-surface border border-border rounded-lg p-6 space-y-4"
      >
        {request.kind === "freetext" ? (
          <div>
            <label htmlFor="freetext" className="block text-sm mb-1">
              Ihre Antwort
            </label>
            <textarea id="freetext" name="freetext" rows={8} required />
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="block text-sm mb-1">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea id={field.key} name={field.key} required={field.required} rows={5} />
              ) : field.type === "select" ? (
                <select id={field.key} name={field.key} required={field.required}>
                  <option value="">Bitte wählen</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "file" ? (
                <input id={field.key} name={field.key} type="file" accept={ACCEPT_SUBMISSION_FILES} required={field.required} />
              ) : (
                <input id={field.key} name={field.key} type={field.type} required={field.required} />
              )}
            </div>
          ))
        )}

        <div>
          <label htmlFor="attachments" className="block text-sm mb-1">
            Weitere Dateien (optional)
          </label>
          <input id="attachments" name="attachments" type="file" accept={ACCEPT_SUBMISSION_FILES} multiple />
        </div>

        {resolvedSearch.error ? <p className="text-sm text-red-600">{resolvedSearch.error}</p> : null}
        {resolvedSearch.success ? (
          <div className="portal-success-banner" role="status">
            <span className="portal-success-banner-icon" aria-hidden="true">
              ✓
            </span>
            <p className="portal-success-banner-text">{resolvedSearch.success}</p>
          </div>
        ) : null}

        <button type="submit" className="bg-brand-orange text-white rounded-lg px-4 py-2 font-semibold">
          Antwort einreichen
        </button>
      </form>
    </section>
  );
}
