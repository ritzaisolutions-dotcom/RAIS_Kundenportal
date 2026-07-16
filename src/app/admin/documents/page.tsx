import Link from "next/link";
import { requireAdminUser } from "@/lib/portal-queries";

export default async function AdminDocumentsPage() {
  const { supabase } = await requireAdminUser();
  const portal = supabase.schema("portal");

  const { data: templates } = await portal
    .from("document_templates")
    .select("id,name,category,format,created_at")
    .order("category")
    .order("name");

  const grouped = new Map<string, NonNullable<typeof templates>>();
  for (const template of templates ?? []) {
    const list = grouped.get(template.category) ?? [];
    list.push(template);
    grouped.set(template.category, list);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">Dokumentvorlagen</h2>
        <Link href="/admin/documents/new" className="btn btn-primary shrink-0">
          + Vorlage hochladen
        </Link>
      </div>

      {[...grouped.entries()].length ? (
        [...grouped.entries()].map(([category, items]) => (
          <div key={category} className="card">
            <div className="card-header">{category}</div>
            <div>
              {items.map((template) => (
                <Link
                  key={template.id}
                  href={`/admin/documents/${template.id}/generate`}
                  className="table-row flex items-center justify-between gap-4 px-6 py-4 last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-grey-900">{template.name}</p>
                    <p className="text-xs text-grey-500 uppercase">{template.format}</p>
                  </div>
                  <span className="chip chip-primary shrink-0">Generieren</span>
                </Link>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="card card-content text-grey-500">
          Noch keine Vorlagen vorhanden.{" "}
          <Link href="/admin/documents/new" className="text-primary-dark underline">
            Erste Vorlage hochladen
          </Link>
        </div>
      )}
    </section>
  );
}
