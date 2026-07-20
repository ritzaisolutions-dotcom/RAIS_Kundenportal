import { InputRequestForm } from "@/components/input-request-form";

export default async function NewInputRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="space-y-4">
      <h2 className="text-xl">Neue Input-Anfrage</h2>
      <InputRequestForm
        action={`/admin/clients/${id}/inputs/new/create`}
        submitLabel="Input-Anfrage speichern"
        todayMin={today}
        allowFullTemplateApply
        flash={{ error: resolvedSearch.error, success: resolvedSearch.success }}
        statusOptions={[
          { value: "draft", label: "Entwurf" },
          { value: "open", label: "Offen" },
        ]}
      />
    </section>
  );
}
