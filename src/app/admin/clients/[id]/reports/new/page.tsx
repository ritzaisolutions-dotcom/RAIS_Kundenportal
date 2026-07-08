import { ReportEditorForm } from "@/components/admin/report-editor-form";

export default async function NewReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Neuen Report erstellen</h2>
      {resolvedSearch.error ? <p className="text-sm text-red-600">{resolvedSearch.error}</p> : null}
      {resolvedSearch.success ? <p className="text-sm text-green-700">{resolvedSearch.success}</p> : null}
      <ReportEditorForm clientId={id} action={`/admin/clients/${id}/reports/new/create`} />
    </section>
  );
}
