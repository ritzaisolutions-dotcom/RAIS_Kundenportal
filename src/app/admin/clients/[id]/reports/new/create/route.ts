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
  const bodyMd = String(formData.get("body_md") ?? "");
  const status = String(formData.get("status") ?? "draft");

  const { error } = await portal.from("status_reports").insert({
    client_id: id,
    title,
    body_md: bodyMd,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    created_by: user.id,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/admin/clients/${id}/reports/new?error=Speichern+fehlgeschlagen`, request.url));
  }

  return NextResponse.redirect(new URL(`/admin/clients/${id}/reports/new?success=Report+gespeichert`, request.url));
}
