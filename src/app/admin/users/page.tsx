import { requireAdminUser } from "@/lib/portal-queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type ClientUserRow = {
  user_id: string;
  client_id: string;
  display_name: string;
  can_view_reports: boolean;
  can_view_inputs: boolean;
  can_submit_requests: boolean;
  created_at: string;
  clients: { name: string; slug: string } | null;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const { supabase } = await requireAdminUser();
  const portal = supabase.schema("portal");

  const { data: clientUsers } = await portal
    .from("client_users")
    .select("user_id,client_id,display_name,can_view_reports,can_view_inputs,can_submit_requests,created_at,clients(name,slug)")
    .order("created_at", { ascending: false });

  // E-Mail-Adressen liegen in auth.users, nicht in portal.client_users - dafuer
  // brauchen wir den Service-Role-Client und die Admin-User-API (paginiert).
  const admin = createAdminClient();
  const emailByUserId = new Map<string, string>();
  let page = 1;
  const perPage = 200;
  // Sicherheitsgrenze, falls listUsers je nie "leer" zurueckgibt.
  for (let i = 0; i < 25; i++) {
    const { data: userPage, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !userPage) break;
    for (const u of userPage.users) {
      if (u.email) emailByUserId.set(u.id, u.email);
    }
    if (userPage.users.length < perPage) break;
    page += 1;
  }

  const rows = ((clientUsers ?? []) as unknown as ClientUserRow[]).map((row) => ({
    ...row,
    email: emailByUserId.get(row.user_id) ?? "–",
  }));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl">Benutzer &amp; Rechte</h2>
          <p className="text-xs text-grey-500 mt-1">Alle Kundenzugänge über alle Kunden hinweg - E-Mail zu Kunde zuordnen und Sichtbarkeit steuern.</p>
        </div>
      </div>

      {resolvedSearch.success ? <p className="chip chip-success">{resolvedSearch.success}</p> : null}

      <div className="card">
        {rows.length ? (
          <div className="admin-list-scroll">
            {rows.map((row) => (
              <div key={row.user_id} className="table-row admin-list-row admin-list-row-user">
                <div className="h-8 w-8 rounded-lg bg-secondary-light text-secondary-dark flex items-center justify-center text-xs font-semibold shrink-0">
                  {row.display_name.charAt(0).toUpperCase()}
                </div>

                <div className="admin-list-inline-meta">
                  <span className="font-medium text-grey-900 truncate">{row.display_name}</span>
                  <span className="text-xs text-grey-500 truncate">
                    {row.email} · {row.clients?.name ?? "Unbekannter Kunde"}
                  </span>
                </div>

                <div className="text-xs text-grey-500 shrink-0 whitespace-nowrap">
                  <span className="hidden lg:inline">Seit {formatDate(row.created_at)}</span>
                  <span className="lg:hidden">–</span>
                </div>

                <form
                  action={`/admin/clients/${row.client_id}/users/${row.user_id}/update`}
                  method="post"
                  className="flex items-center gap-2 shrink-0 whitespace-nowrap"
                >
                  <input type="hidden" name="redirect_to" value="/admin/users" />
                  <label className="flex items-center gap-1.5 text-xs text-grey-600 shrink-0">
                    <input type="checkbox" name="can_view_reports" defaultChecked={row.can_view_reports} className="!w-4 shrink-0" />
                    Reports
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-grey-600 shrink-0">
                    <input type="checkbox" name="can_view_inputs" defaultChecked={row.can_view_inputs} className="!w-4 shrink-0" />
                    Input-Anfragen
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-grey-600 shrink-0">
                    <input type="checkbox" name="can_submit_requests" defaultChecked={row.can_submit_requests ?? true} className="!w-4 shrink-0" />
                    Anfragen senden
                  </label>
                  <button type="submit" className="btn btn-secondary !text-xs !py-1.5 !px-3 shrink-0">
                    Speichern
                  </button>
                </form>

                <form action={`/admin/clients/${row.client_id}/users/${row.user_id}/remove`} method="post" className="shrink-0 whitespace-nowrap">
                  <input type="hidden" name="redirect_to" value="/admin/users" />
                  <button type="submit" className="btn btn-ghost !text-xs !py-1.5 !px-3">
                    Entfernen
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-content text-grey-500">Noch keine Kundenzugänge angelegt.</div>
        )}
      </div>
    </section>
  );
}
