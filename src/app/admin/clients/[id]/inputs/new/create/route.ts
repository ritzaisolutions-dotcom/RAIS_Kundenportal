import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const portal = admin.schema("portal");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.redirect(new URL("/portal", request.url));

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "");
  const descriptionMd = String(formData.get("description_md") ?? "");
  const kind = String(formData.get("kind") ?? "form");
  const dueDate = String(formData.get("due_date") ?? "");
  const status = String(formData.get("status") ?? "draft");
  const formSchemaRaw = String(formData.get("form_schema") ?? "[]");

  let formSchema: unknown = null;
  if (kind === "form") {
    try {
      formSchema = JSON.parse(formSchemaRaw);
    } catch {
      return NextResponse.redirect(new URL(`/admin/clients/${id}/inputs/new?error=Form-Schema+ist+kein+valider+JSON`, request.url));
    }
  }

  const { error } = await portal.from("input_requests").insert({
    client_id: id,
    title,
    description_md: descriptionMd || null,
    kind,
    form_schema: kind === "form" ? formSchema : null,
    status,
    due_date: dueDate || null,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/admin/clients/${id}/inputs/new?error=Speichern+fehlgeschlagen`, request.url));
  }

  return NextResponse.redirect(new URL(`/admin/clients/${id}/inputs/new?success=Input-Anfrage+gespeichert`, request.url));
}
