import Link from "next/link";
import { notFound } from "next/navigation";
import {
  clientPrefillValues,
  parseDocumentVariableSchema,
} from "@/lib/document-template-engine";
import { requireAdminUser } from "@/lib/portal-queries";

export default async function AdminGenerateDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ client_id?: string; error?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const { supabase } = await requireAdminUser();
  const portal = supabase.schema("portal");

  const [{ data: template }, { data: clients }] = await Promise.all([
    portal.from("document_templates").select("*").eq("id", id).maybeSingle(),
    portal.from("clients").select("id,name,primary_contact_email").order("name"),
  ]);

  if (!template) notFound();

  const fields = parseDocumentVariableSchema(template.variable_schema);
  const selectedClient = (clients ?? []).find((client) => client.id === resolvedSearch.client_id) ?? null;
  const prefill = selectedClient ? clientPrefillValues(selectedClient) : {};

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/documents" className="text-sm text-grey-500 hover:text-grey-900">
          ← Vorlagen
        </Link>
        <h2 className="text-xl">{template.name}</h2>
      </div>

      <form method="get" className="card card-content flex flex-wrap gap-3 items-end">
        <div>
          <label htmlFor="client_id" className="block text-xs text-grey-500 mb-1">
            Kunde (Prefill)
          </label>
          <select id="client_id" name="client_id" defaultValue={resolvedSearch.client_id ?? ""}>
            <option value="">— manuell —</option>
            {(clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Felder vorbefüllen
        </button>
      </form>

      <form action={`/admin/documents/${id}/generate/download`} method="post" className="card card-content space-y-4">
        {selectedClient ? <input type="hidden" name="client_id" value={selectedClient.id} /> : null}

        {fields.length ? (
          fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="block text-xs text-grey-600 mb-1">
                {field.label} ({field.key})
              </label>
              <input id={field.key} name={field.key} defaultValue={prefill[field.key] ?? ""} />
            </div>
          ))
        ) : (
          <p className="text-sm text-grey-500">Keine Variablen in dieser Vorlage erkannt.</p>
        )}

        {resolvedSearch.error ? <p className="chip chip-error">{resolvedSearch.error}</p> : null}

        <button type="submit" className="btn btn-primary">
          Dokument generieren &amp; herunterladen
        </button>
      </form>
    </section>
  );
}
