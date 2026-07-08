import Link from "next/link";
import { requirePortalUser } from "@/lib/portal-queries";
import { formatDate } from "@/lib/utils";

export default async function PortalReportsPage() {
  const { supabase, clientId } = await requirePortalUser();
  const { data: reports } = await supabase
    .schema("portal")
    .from("status_reports")
    .select("id,title,published_at,created_at")
    .eq("client_id", clientId!)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Status-Reports</h2>
      {reports?.length ? (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="bg-surface border border-border rounded-lg p-4">
              <Link href={`/portal/reports/${report.id}`} className="font-semibold text-lg hover:underline">
                {report.title}
              </Link>
              <p className="text-sm text-muted mt-1">Veröffentlicht: {formatDate(report.published_at ?? report.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-surface border border-border rounded-lg p-6 text-muted">Noch keine Reports verfügbar.</div>
      )}
    </section>
  );
}
