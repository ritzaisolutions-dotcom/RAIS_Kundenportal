import Link from "next/link";
import { redirect } from "next/navigation";
import { parseFormSchema, requirePortalUser, resolvePortalHome } from "@/lib/portal-queries";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  submitted: "Eingereicht",
  accepted: "Akzeptiert",
  reopened: "Erneut geöffnet",
};

const STATUS_CHIP: Record<string, string> = {
  open: "chip-primary",
  submitted: "chip-warning",
  accepted: "chip-success",
  reopened: "chip-error",
};

const WAITING_STATUSES = new Set(["open", "reopened"]);

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || !WAITING_STATUSES.has(status)) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default async function PortalInputsPage() {
  const { supabase, clientId, canViewReports, canViewInputs, canSubmitRequests } = await requirePortalUser();
  if (!canViewInputs) {
    redirect(resolvePortalHome({ canViewReports, canViewInputs, canSubmitRequests }));
  }

  const portal = supabase.schema("portal");

  const { data: requests } = await portal
    .from("input_requests")
    .select("id,title,status,due_date,kind,form_schema")
    .eq("client_id", clientId!)
    .in("status", ["open", "submitted", "accepted", "reopened"])
    .order("due_date", { ascending: true, nullsFirst: false });

  const requestIds = (requests ?? []).map((request) => request.id);
  const { data: submissions } = requestIds.length
    ? await portal.from("input_submissions").select("request_id,data,created_at").in("request_id", requestIds)
    : { data: [] as { request_id: string; data: unknown; created_at: string }[] };

  // Letzte Einreichung pro Anfrage (falls mehrfach nachgereicht wurde)
  const latestSubmissionByRequest = new Map<string, Record<string, unknown>>();
  for (const submission of submissions ?? []) {
    const existing = latestSubmissionByRequest.get(submission.request_id);
    if (!existing) latestSubmissionByRequest.set(submission.request_id, (submission.data as Record<string, unknown>) ?? {});
  }

  function completionPercent(request: NonNullable<typeof requests>[number]) {
    const submissionData = latestSubmissionByRequest.get(request.id);
    const fields = parseFormSchema(request.form_schema);

    if (!fields.length) {
      // Freitext-Anfragen ohne Formularfelder: binär, entweder eingereicht oder nicht
      return submissionData ? 100 : 0;
    }
    if (!submissionData) return 0;

    const filled = fields.filter((field) => {
      const value = submissionData[field.key];
      return value !== undefined && value !== null && String(value).trim() !== "";
    }).length;
    return Math.round((filled / fields.length) * 100);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl">Aufgaben</h2>

      {requests?.length ? (
        <div className="card">
          <div>
            {requests.map((request) => {
              const pct = completionPercent(request);
              const overdue = isOverdue(request.due_date, request.status);
              return (
                <Link
                  key={request.id}
                  href={`/portal/inputs/${request.id}`}
                  className="table-row flex items-center gap-4 px-6 py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-grey-900 truncate">{request.title}</p>
                    <p className="text-xs text-grey-500">
                      {request.due_date ? `Fällig: ${formatDate(request.due_date)}` : "Kein Fälligkeitsdatum"}
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1 w-36 shrink-0">
                    <div className="w-full h-1.5 rounded-full bg-grey-200 overflow-hidden">
                      <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-grey-500">{pct}% übermittelt</p>
                  </div>

                  {overdue ? (
                    <span className="chip chip-error shrink-0">Überfällig</span>
                  ) : (
                    <span className={`chip ${STATUS_CHIP[request.status] ?? "chip-neutral"} shrink-0`}>
                      {STATUS_LABEL[request.status] ?? request.status}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="stat-highlight p-8 text-center">
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-xl text-white font-semibold">Alles erledigt!</h3>
            <p className="text-secondary-200 text-sm max-w-sm">
              Sie haben aktuell keine offenen Aufgaben. Unser Team kümmert sich um den Rest — wir melden uns, sobald wir wieder
              etwas von Ihnen brauchen.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
