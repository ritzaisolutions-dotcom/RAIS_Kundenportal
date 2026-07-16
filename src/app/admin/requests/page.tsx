import Link from "next/link";
import {
  CUSTOMER_REQUEST_STATUS_CHIP,
  CUSTOMER_REQUEST_STATUS_LABEL,
  OPEN_CUSTOMER_REQUEST_STATUSES,
} from "@/lib/customer-request-status";
import { requireAdminUser } from "@/lib/portal-queries";
import { CustomerRequestStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; client?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const { supabase } = await requireAdminUser();
  const portal = supabase.schema("portal");

  const [{ data: clients }, { data: requests }] = await Promise.all([
    portal.from("clients").select("id,name").order("name"),
    portal.from("customer_requests").select("id,client_id,subject,category,area,project_name,status,created_at").order("created_at", {
      ascending: false,
    }),
  ]);

  const clientNameById = new Map((clients ?? []).map((client) => [client.id, client.name]));

  const filtered = (requests ?? []).filter((request) => {
    if (resolvedSearch.status && request.status !== resolvedSearch.status) return false;
    if (resolvedSearch.client && request.client_id !== resolvedSearch.client) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <h2 className="text-xl">Kundenanfragen</h2>

      <form method="get" className="card card-content flex flex-wrap gap-3 items-end">
        <div>
          <label htmlFor="status" className="block text-xs text-grey-500 mb-1">
            Status
          </label>
          <select id="status" name="status" defaultValue={resolvedSearch.status ?? ""}>
            <option value="">Alle</option>
            {(Object.keys(CUSTOMER_REQUEST_STATUS_LABEL) as CustomerRequestStatus[]).map((status) => (
              <option key={status} value={status}>
                {CUSTOMER_REQUEST_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="client" className="block text-xs text-grey-500 mb-1">
            Kunde
          </label>
          <select id="client" name="client" defaultValue={resolvedSearch.client ?? ""}>
            <option value="">Alle</option>
            {(clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Filtern
        </button>
      </form>

      {filtered.length ? (
        <div className="card">
          <div>
            {filtered.map((request) => {
              const status = request.status as CustomerRequestStatus;
              const isOpen = OPEN_CUSTOMER_REQUEST_STATUSES.has(status);
              return (
                <Link
                  key={request.id}
                  href={`/admin/requests/${request.id}`}
                  className="table-row flex items-center gap-4 px-6 py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-grey-900 truncate">{request.subject}</p>
                    <p className="text-xs text-grey-500 truncate">
                      {clientNameById.get(request.client_id) ?? request.client_id} · {request.category} · {request.project_name}
                    </p>
                    <p className="text-xs text-grey-500">{formatDate(request.created_at)}</p>
                  </div>
                  <span className={`chip ${isOpen ? "chip-warning" : CUSTOMER_REQUEST_STATUS_CHIP[status]} shrink-0`}>
                    {CUSTOMER_REQUEST_STATUS_LABEL[status] ?? request.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card card-content text-grey-500">Keine Anfragen gefunden.</div>
      )}
    </section>
  );
}
