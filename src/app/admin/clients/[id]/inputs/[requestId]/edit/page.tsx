import { notFound } from "next/navigation";
import { InputRequestForm } from "@/components/input-request-form";
import { parseFormSchema, requireAdminUser } from "@/lib/portal-queries";
import type { InputRequestKind } from "@/lib/types";

export default async function EditInputRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; requestId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id, requestId } = await params;
  const resolvedSearch = await searchParams;
  const { supabase } = await requireAdminUser();
  const portal = supabase.schema("portal");
  const { data: request } = await portal
    .from("input_requests")
    .select("id,title,description_md,kind,form_schema,due_date,status")
    .eq("id", requestId)
    .eq("client_id", id)
    .maybeSingle();

  if (!request) notFound();

  const today = new Date().toISOString().slice(0, 10);
  // min darf ein bereits in der Vergangenheit liegendes Fälligkeitsdatum nicht verstecken/blockieren -
  // sonst laesst sich ein ueberfaelliger Termin nicht mehr unveraendert speichern.
  const dueDateMin = request.due_date && request.due_date < today ? request.due_date : today;

  return (
    <section className="space-y-4">
      <h2 className="text-xl">Input-Anfrage bearbeiten</h2>
      <InputRequestForm
        action={`/admin/clients/${id}/inputs/${requestId}/edit/update`}
        submitLabel="Änderungen speichern"
        todayMin={today}
        dueDateMin={dueDateMin}
        flash={{ error: resolvedSearch.error, success: resolvedSearch.success }}
        initial={{
          title: request.title,
          description_md: request.description_md ?? "",
          kind: request.kind as InputRequestKind,
          form_schema: parseFormSchema(request.form_schema),
          due_date: request.due_date ?? "",
          status: request.status,
        }}
        statusOptions={[
          { value: "draft", label: "Entwurf" },
          { value: "open", label: "Offen" },
          { value: "submitted", label: "Eingereicht" },
          { value: "accepted", label: "Akzeptiert" },
          { value: "reopened", label: "Erneut geöffnet" },
        ]}
      />
    </section>
  );
}
