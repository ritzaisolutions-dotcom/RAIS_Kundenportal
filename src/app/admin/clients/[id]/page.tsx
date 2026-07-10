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
  searchParams: Promise<{ tab?: string; success?: string }>;
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
          <div>
            {reports?.map((report) => (
              <div key={report.id} className="table-row flex items-center justify-between gap-3 px-6 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="font-medium text-grey-900 truncate">{report.title}</p>
                  <p className="text-xs text-grey-500">{formatDate(report.published_at ?? report.created_at)}</p>
                </div>
                <span className={`chip ${REPORT_STATUS_CHIP[report.status] ?? "chip-neutral"} shrink-0`}>{report.status}</span>
              </div>
            ))}
            {!reports?.length ? <div className="card-content text-grey-500">Noch keine Status-Reports.</div> : null}
          </div>
        ) : null}

        {activeTab === "inputs" ? (
          <div>
            {requests?.map((request) => (
              <div key={request.id} className="table-row flex items-center justify-between gap-3 px-6 py-3 last:border-b-0">
                <Link
                  href={`/admin/clients/${id}/inputs/${request.id}/edit`}
                  className="min-w-0 flex-1 flex items-baseline gap-2 hover:underline"
                >
                  <p className="font-medium text-grey-900 truncate shrink-0">{request.title}</p>
                  <p className="text-xs text-grey-500 truncate">
                    {request.due_date ? `Fällig: ${request.due_date}` : "Kein Fälligkeitsdatum"}
                  </p>
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
                ) : null}
              </div>
            ))}
            {!requests?.length ? <div className="card-content text-grey-500">Noch keine Input-Anfragen.</div> : null}
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div>
            {users?.map((clientUser) => (
              <div key={clientUser.user_id} className="table-row flex flex-wrap items-center gap-4 px-6 py-4 last:border-b-0">
                <div className="h-8 w-8 rounded-lg bg-secondary-light text-secondary-dark flex items-center justify-center text-xs font-semibold shrink-0">
                  {clientUser.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-[160px]">
                  <p className="font-medium text-grey-900 truncate">{clientUser.display_name}</p>
                  <p className="text-xs text-grey-500">Seit {formatDate(clientUser.created_at)}</p>
                </div>

                <form
                  action={`/admin/clients/${id}/users/${clientUser.user_id}/update`}
                  method="post"
                  className="flex flex-wrap items-center gap-3 flex-1"
                >
                  <label className="flex items-center gap-1.5 text-xs text-grey-600">
                    <input type="checkbox" name="can_view_reports" defaultChecked={clientUser.can_view_reports} className="w-auto" />
                    Reports
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-grey-600">
                    <input type="checkbox" name="can_view_inputs" defaultChecked={clientUser.can_view_inputs} className="w-auto" />
                    Input-Anfragen
                  </label>
                  <button type="submit" className="btn btn-secondary !text-xs !py-1.5 !px-3">
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
