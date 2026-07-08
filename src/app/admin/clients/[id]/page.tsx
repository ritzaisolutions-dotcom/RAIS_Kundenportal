import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/portal-queries";
import { formatDate } from "@/lib/utils";

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdminUser();
  const portal = supabase.schema("portal");
  const [{ data: client }, { data: reports }, { data: requests }, { data: users }] = await Promise.all([
    portal.from("clients").select("*").eq("id", id).maybeSingle(),
    portal.from("status_reports").select("id,title,status,published_at,created_at").eq("client_id", id).order("created_at", { ascending: false }),
    portal.from("input_requests").select("id,title,status,due_date,created_at").eq("client_id", id).order("created_at", { ascending: false }),
    portal.from("client_users").select("display_name,user_id,created_at").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  return (
    <section className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-3xl">{client.name}</h2>
        <p className="text-sm text-muted mt-1">Slug: {client.slug}</p>
        <div className="flex gap-3 mt-4">
          <Link className="bg-brand-orange text-white rounded px-3 py-2 text-sm" href={`/admin/clients/${id}/reports/new`}>
            Neuer Report
          </Link>
          <Link className="bg-brand-orange text-white rounded px-3 py-2 text-sm" href={`/admin/clients/${id}/inputs/new`}>
            Neue Input-Anfrage
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xl mb-2">Reports</h3>
          <ul className="space-y-2 text-sm">
            {reports?.map((report) => (
              <li key={report.id}>
                {report.title}
                <br />
                <span className="text-muted">
                  {report.status} · {formatDate(report.published_at ?? report.created_at)}
                </span>
              </li>
            ))}
            {!reports?.length ? <li className="text-muted">Noch keine Reports.</li> : null}
          </ul>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xl mb-2">Inputs</h3>
          <ul className="space-y-2 text-sm">
            {requests?.map((request) => (
              <li key={request.id}>
                {request.title}
                <br />
                <span className="text-muted">
                  {request.status}
                  {request.due_date ? ` · Faellig: ${request.due_date}` : ""}
                </span>
              </li>
            ))}
            {!requests?.length ? <li className="text-muted">Noch keine Input-Anfragen.</li> : null}
          </ul>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xl mb-2">Users</h3>
          <ul className="space-y-2 text-sm">
            {users?.map((user) => (
              <li key={user.user_id}>
                {user.display_name}
                <br />
                <span className="text-muted">{formatDate(user.created_at)}</span>
              </li>
            ))}
            {!users?.length ? <li className="text-muted">Noch keine User.</li> : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
