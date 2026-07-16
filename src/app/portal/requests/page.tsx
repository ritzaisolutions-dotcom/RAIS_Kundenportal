import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CUSTOMER_REQUEST_STATUS_CHIP,
  CUSTOMER_REQUEST_STATUS_LABEL,
} from "@/lib/customer-request-status";
import { requirePortalUser, resolvePortalHome } from "@/lib/portal-queries";
import { CustomerRequestStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function PortalRequestsPage() {
  const { supabase, clientId, canViewReports, canViewInputs, canSubmitRequests } = await requirePortalUser();
  if (!canSubmitRequests) {
    redirect(resolvePortalHome({ canViewReports, canViewInputs, canSubmitRequests }));
  }

  const portal = supabase.schema("portal");
  const { data: requests } = await portal
    .from("customer_requests")
    .select("id,subject,category,area,project_name,status,created_at")
    .eq("client_id", clientId!)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">Anfragen</h2>
        <Link href="/portal/requests/new" className="btn btn-primary shrink-0">
          + Neue Anfrage
        </Link>
      </div>

      {requests?.length ? (
        <div className="card">
          <div>
            {requests.map((request) => {
              const status = request.status as CustomerRequestStatus;
              return (
                <Link
                  key={request.id}
                  href={`/portal/requests/${request.id}`}
                  className="table-row flex items-center gap-4 px-6 py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-grey-900 truncate">{request.subject}</p>
                    <p className="text-xs text-grey-500 truncate">
                      {request.category} · {request.area} · {request.project_name}
                    </p>
                    <p className="text-xs text-grey-500">{formatDate(request.created_at)}</p>
                  </div>
                  <span className={`chip ${CUSTOMER_REQUEST_STATUS_CHIP[status] ?? "chip-neutral"} shrink-0`}>
                    {CUSTOMER_REQUEST_STATUS_LABEL[status] ?? request.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card card-content text-grey-600">
          <p>Sie haben noch keine Anfragen gestellt.</p>
          <Link href="/portal/requests/new" className="text-primary-dark font-medium mt-2 inline-block">
            Erste Anfrage senden
          </Link>
        </div>
      )}
    </section>
  );
}
