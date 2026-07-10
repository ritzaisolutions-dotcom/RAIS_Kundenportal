import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/portal-queries";
import { formatDate } from "@/lib/utils";

const VALID_TABS = new Set(["reports", "inputs", "users"]);

const REPORT_STATUS_CHIP: Record<string, string> = {
  draft: "chip-neutral",
  published: "chip-success",
};

const INPUT_STATUS_CHIP: Record<string, string> = {
  draft: "chip-neutral",
  open: "chip-primary",
  submitted: "chip-warning",
  accepted: "chip-success",
  reopened: "chip-error",
};

const INPUT_STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  open: "Offen",
  submitted: "Eingereicht",
  accepted: "Akzeptiert",
  reopened: "Erneut geöffnet",
};

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; success?: string; error?: string }>;
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
    portal
      .from("client_users")
      .select("display_name,user_id,created_at,can_view_reports,can_view_inputs")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  return (
    <section className="space-y-6">
      <div className="card card-content">
        <h2 className="text-2xl">{client.name}</h2>
        <p className="text-xs text-grey-500 mt-1">Slug: {client.slug}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link className="btn btn-primary" href={`/admin/clients/${id}/reports/new`}>
            + Neuer Report
          </Link>
          <Link className="btn btn-secondary" href={`/admin/clients/${id}/inputs/new`}>
            + Neue Input-Anfrage
          </Link>
          <Link className="btn btn-secondary" href={`/admin/clients/${id}/users/new`}>
            + Benutzer hinzufügen
          </Link>
          <Link className="btn btn-ghost" href={`/admin/clients/${id}/edit`}>
            Kunde bearbeiten
          </Link>
        </div>
      </div>

      {resolvedSearch.success ? <p className="chip chip-success">{resolvedSearch.success}</p> : null}
      {resolvedSearch.error ? <p className="chip chip-error">{resolvedSearch.error}</p> : null}

      <div className="card">
        <nav className="flex flex-wrap gap-2 p-4 border-b border-grey-200">
          <Link href={`/admin/clients/${id}?tab=reports`} className={activeTab === "reports" ? "sidebar-link sidebar-link-active" : "sidebar-link"}>
            Status-Reports
          </Link>
          <Link href={`/admin/clients/${id}?tab=inputs`} className={activeTab === "inputs" ? "sidebar-link sidebar-link-active" : "sidebar-link"}>
            Input-Anfragen
          </Link>
          <Link href={`/admin/clients/${id}?tab=users`} className={activeTab === "users" ? "sidebar-link sidebar-link-active" : "sidebar-link"}>
            Benutzer
          </Link>
        </nav>

        {activeTab === "reports" ? (
          <div className="admin-list-scroll">
            {reports?.map((report) => (
              <div key={report.id} className="table-row admin-list-row admin-list-row-report">
                <div className="admin-list-inline-meta">
                  <span className="font-medium text-grey-900 truncate">{report.title}</span>
                  <span className="text-xs text-grey-500 truncate">{formatDate(report.published_at ?? report.created_at)}</span>
                </div>
                <span className={`chip ${REPORT_STATUS_CHIP[report.status] ?? "chip-neutral"} shrink-0`}>{report.status}</span>
                {report.status === "draft" ? (
                  <form action={`/admin/clients/${id}/reports/${report.id}/publish`} method="post" className="shrink-0">
                    <button type="submit" className="btn btn-secondary !text-xs !py-1.5 !px-3">
                      Veröffentlichen
                    </button>
                  </form>
                ) : (
                  <span aria-hidden="true" className="shrink-0" />
                )}
              </div>
            ))}
            {!reports?.length ? <div className="card-content text-grey-500">Noch keine Status-Reports.</div> : null}
          </div>
        ) : null}

        {activeTab === "inputs" ? (
          <div className="admin-list-scroll">
            {requests?.map((request) => (
              <div key={request.id} className="table-row admin-list-row admin-list-row-input">
                <Link
                  href={`/admin/clients/${id}/inputs/${request.id}/edit`}
                  className="admin-list-inline-meta hover:underline min-w-0"
                >
                  <span className="font-medium text-grey-900 truncate">{request.title}</span>
                  <span className="text-xs text-grey-500 truncate">
                    {request.due_date ? `Fällig: ${request.due_date}` : "Kein Fälligkeitsdatum"}
                  </span>
                </Link>
                <span className={`chip ${INPUT_STATUS_CHIP[request.status] ?? "chip-neutral"} shrink-0`}>
                  {INPUT_STATUS_LABEL[request.status] ?? request.status}
                </span>
                {request.status === "draft" ? (
                  <form action={`/admin/clients/${id}/inputs/${request.id}/publish`} method="post" className="shrink-0">
                    <button type="submit" className="btn btn-secondary !text-xs !py-1.5 !px-3">
                      Veröffentlichen
                    </button>
                  </form>
                ) : (
                  <span aria-hidden="true" className="shrink-0" />
                )}
              </div>
            ))}
            {!requests?.length ? <div className="card-content text-grey-500">Noch keine Input-Anfragen.</div> : null}
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div className="admin-list-scroll">
            {users?.map((clientUser) => (
              <div key={clientUser.user_id} className="table-row admin-list-row admin-list-row-user-compact">
                <div className="h-8 w-8 rounded-lg bg-secondary-light text-secondary-dark flex items-center justify-center text-xs font-semibold shrink-0">
                  {clientUser.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="admin-list-inline-meta">
                  <span className="font-medium text-grey-900 truncate">{clientUser.display_name}</span>
                  <span className="text-xs text-grey-500 truncate">Seit {formatDate(clientUser.created_at)}</span>
                </div>

                <form
                  action={`/admin/clients/${id}/users/${clientUser.user_id}/update`}
                  method="post"
                  className="flex items-center gap-2 shrink-0 whitespace-nowrap"
                >
                  <label className="flex items-center gap-1.5 text-xs text-grey-600 shrink-0">
                    <input type="checkbox" name="can_view_reports" defaultChecked={clientUser.can_view_reports} className="!w-4 shrink-0" />
                    Reports
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-grey-600 shrink-0">
                    <input type="checkbox" name="can_view_inputs" defaultChecked={clientUser.can_view_inputs} className="!w-4 shrink-0" />
                    Input-Anfragen
                  </label>
                  <button type="submit" className="btn btn-secondary !text-xs !py-1.5 !px-3 shrink-0">
                    Speichern
                  </button>
                </form>

                <form action={`/admin/clients/${id}/users/${clientUser.user_id}/remove`} method="post" className="shrink-0">
                  <button type="submit" className="btn btn-ghost !text-xs !py-1.5 !px-3">
                    Entfernen
                  </button>
                </form>
              </div>
            ))}
            {!users?.length ? <div className="card-content text-grey-500">Noch keine Benutzer.</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
