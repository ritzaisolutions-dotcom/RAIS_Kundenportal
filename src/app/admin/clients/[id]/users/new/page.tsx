import { cookies } from "next/headers";
import { TempPasswordReveal } from "@/app/admin/clients/new/temp-password-reveal";

export default async function NewClientUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const cookieStore = await cookies();
  const tempPassword = cookieStore.get("temp_password_flash")?.value ?? null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl">Benutzer hinzufügen</h2>
      <form action={`/admin/clients/${id}/users/new/create`} method="post" className="card card-content space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs text-grey-600 mb-1">
            E-Mail
          </label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="display_name" className="block text-xs text-grey-600 mb-1">
            Anzeigename
          </label>
          <input id="display_name" name="display_name" required />
        </div>
        <div className="space-y-2">
          <p className="block text-xs text-grey-600">Freigegebene Ansichten</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="can_view_reports" defaultChecked className="w-auto" />
            Reports
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="can_view_inputs" defaultChecked className="w-auto" />
            Input-Anfragen
          </label>
        </div>
        {resolvedSearch?.error ? <p className="chip chip-error">{resolvedSearch.error}</p> : null}
        {resolvedSearch?.success ? <p className="chip chip-success">{resolvedSearch.success}</p> : null}
        {tempPassword ? <TempPasswordReveal password={tempPassword} clearUrl={`/admin/clients/${id}/users/new/clear-temp-password`} /> : null}
        <button type="submit" className="btn btn-primary">
          Benutzer anlegen
        </button>
      </form>
    </section>
  );
}
