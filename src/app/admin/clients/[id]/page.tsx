import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/portal-queries";
import { formatDate } from "@/lib/utils";

const VALID_TABS = new Set(["reports", "inputs", "users"]);

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const activeTab = VALID_TABS.has(resolvedSearch.tab ?? "") ? (resolvedSearch.tab as "reports" | "inputs" | "users") : "reports";
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
        <div className="flex flex-wrap gap-3 mt-4">
          <Link className="bg-brand-orange text-white rounded px-3 py-2 text-sm" href={`/admin/clients/${id}/reports/new`}>
            Neuer Report
          </Link>
          <Link className="bg-brand-orange text-white rounded px-3 py-2 text-sm" href={`/admin/clients/${id}/inputs/new`}>
            Neue Input-Anfrage
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <nav className="flex flex-wrap gap-2 border-b border-border pb-3 mb-4">
          <Link
            href={`/admin/clients/${id}?tab=reports`}
            className={`rounded px-3 py-1 text-sm ${activeTab === "reports" ? "bg-brand-orange text-white" : "bg-white border border-border"}`}
          >
            Status-Reports
          </Link>
          <Link
            href={`/admin/clients/${id}?tab=inputs`}
            className={`rounded px-3 py-1 text-sm ${activeTab === "inputs" ? "bg-brand-orange text-white" : "bg-white border border-border"}`}
          >
            Input-Anfragen
          </Link>
          <Link
            href={`/admin/clients/${id}?tab=users`}
            className={`rounded px-3 py-1 text-sm ${activeTab === "users" ? "bg-brand-orange text-white" : "bg-white border border-border"}`}
          >
            Benutzer
          </Link>
        </nav>

        {activeTab === "reports" ? (
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
            {!reports?.length ? <li className="text-muted">Noch keine Status-Reports.</li> : null}
          </ul>
        ) : null}

        {activeTab === "inputs" ? (
          <ul className="space-y-2 text-sm">
            {requests?.map((request) => (
              <li key={request.id}>
                {request.title}
                <br />
                <span className="text-muted">
                  {request.status}
                  {request.due_date ? ` · Fällig: ${request.due_date}` : ""}
                </span>
              </li>
            ))}
            {!requests?.length ? <li className="text-muted">Noch keine Input-Anfragen.</li> : null}
          </ul>
        ) : null}

        {activeTab === "users" ? (
          <ul className="space-y-2 text-sm">
            {users?.map((clientUser) => (
              <li key={clientUser.user_id}>
                {clientUser.display_name}
                <br />
                <span className="text-muted">{formatDate(clientUser.created_at)}</span>
              </li>
            ))}
            {!users?.length ? <li className="text-muted">Noch keine Benutzer.</li> : null}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
