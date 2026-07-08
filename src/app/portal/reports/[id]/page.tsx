import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReportForClient, requirePortalUser } from "@/lib/portal-queries";
import { formatDate } from "@/lib/utils";

export default async function PortalReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clientId } = await requirePortalUser();
  const report = await getReportForClient(id, clientId!);

  return (
    <article className="bg-surface border border-border rounded-lg p-6">
      <h2 className="text-3xl">{report.title}</h2>
      <p className="text-sm text-muted mt-1 mb-6">Veroeffentlicht: {formatDate(report.published_at ?? report.created_at)}</p>
      <div className="prose prose-stone max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{report.body_md}</Markdown>
      </div>
    </article>
  );
}
