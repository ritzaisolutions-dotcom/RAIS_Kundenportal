import Link from "next/link";
import { requirePortalUser } from "@/lib/portal-queries";

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  submitted: "Eingereicht",
  accepted: "Akzeptiert",
  reopened: "Erneut geoeffnet",
};

export default async function PortalInputsPage() {
  const { supabase, clientId } = await requirePortalUser();
  const { data: requests } = await supabase
    .schema("portal")
    .from("input_requests")
    .select("id,title,status,due_date")
    .eq("client_id", clientId!)
    .in("status", ["open", "submitted", "accepted", "reopened"])
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Input-Anfragen</h2>
      {requests?.length ? (
        <ul className="space-y-3">
          {requests.map((request) => (
            <li key={request.id} className="bg-surface border border-border rounded-lg p-4">
              <Link href={`/portal/inputs/${request.id}`} className="font-semibold text-lg hover:underline">
                {request.title}
              </Link>
              <p className="text-sm text-muted mt-1">
                Status: {STATUS_LABEL[request.status] ?? request.status}
                {request.due_date ? ` · Faellig: ${request.due_date}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-surface border border-border rounded-lg p-6 text-muted">Aktuell keine offenen Input-Anfragen.</div>
      )}
    </section>
  );
}
