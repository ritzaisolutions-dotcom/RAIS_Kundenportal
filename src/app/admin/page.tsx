import Link from "next/link";
import { requireAdminUser } from "@/lib/portal-queries";

export default async function AdminHomePage() {
  const { supabase } = await requireAdminUser();
  const { data: clients } = await supabase.schema("portal").from("clients").select("id,name,slug,primary_contact_email").order("created_at");

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Kunden</h2>
      {clients?.length ? (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li key={client.id} className="bg-surface border border-border rounded-lg p-4">
              <Link href={`/admin/clients/${client.id}`} className="font-semibold text-lg hover:underline">
                {client.name}
              </Link>
              <p className="text-sm text-muted">
                Slug: {client.slug}
                {client.primary_contact_email ? ` · Primar: ${client.primary_contact_email}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-surface border border-border rounded-lg p-6 text-muted">Noch keine Kunden angelegt.</div>
      )}
    </section>
  );
}
