import Link from "next/link";
import { redirect } from "next/navigation";
import { CUSTOMER_REQUEST_AREAS, CUSTOMER_REQUEST_CATEGORIES } from "@/lib/customer-request-status";
import { requirePortalUser, resolvePortalHome } from "@/lib/portal-queries";
import { ACCEPT_SUBMISSION_FILES } from "@/lib/upload-validation";

export default async function PortalNewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const { canViewReports, canViewInputs, canSubmitRequests } = await requirePortalUser();
  if (!canSubmitRequests) {
    redirect(resolvePortalHome({ canViewReports, canViewInputs, canSubmitRequests }));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/portal/requests" className="text-sm text-grey-500 hover:text-grey-900">
          ← Zurück
        </Link>
        <h2 className="text-xl">Neue Anfrage</h2>
      </div>

      <form
        action="/portal/requests/new/create"
        method="post"
        encType="multipart/form-data"
        className="bg-surface border border-border rounded-lg p-6 space-y-4"
      >
        <div>
          <label htmlFor="subject" className="block text-sm mb-1">
            Betreff
          </label>
          <input id="subject" name="subject" type="text" required maxLength={200} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm mb-1">
              Kategorie
            </label>
            <select id="category" name="category" required>
              <option value="">Bitte wählen</option>
              {CUSTOMER_REQUEST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="area" className="block text-sm mb-1">
              Bereich
            </label>
            <select id="area" name="area" required>
              <option value="">Bitte wählen</option>
              {CUSTOMER_REQUEST_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="project_name" className="block text-sm mb-1">
            Projekt
          </label>
          <input id="project_name" name="project_name" type="text" required maxLength={200} />
        </div>

        <div>
          <label htmlFor="description_md" className="block text-sm mb-1">
            Beschreibung
          </label>
          <textarea id="description_md" name="description_md" rows={8} required />
        </div>

        <div>
          <label htmlFor="attachments" className="block text-sm mb-1">
            Anhänge (optional)
          </label>
          <input id="attachments" name="attachments" type="file" accept={ACCEPT_SUBMISSION_FILES} multiple />
        </div>

        {resolvedSearch.error ? <p className="text-sm text-red-600">{resolvedSearch.error}</p> : null}

        <button type="submit" className="bg-brand-orange text-white rounded-lg px-4 py-2 font-semibold">
          Anfrage senden
        </button>
      </form>
    </section>
  );
}
