import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const admin = createAdminClient();
  const portal = admin.schema("portal");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.redirect(new URL("/portal", request.url), { status: 303 });

  const formData = await request.formData();
  const canViewReports = formData.get("can_view_reports") === "on";
  const canViewInputs = formData.get("can_view_inputs") === "on";

  await portal
    .from("client_users")
    .update({ can_view_reports: canViewReports, can_view_inputs: canViewInputs })
    .eq("user_id", userId)
    .eq("client_id", id);

  return NextResponse.redirect(new URL(`/admin/clients/${id}?tab=users&success=Sichtbarkeit+gespeichert`, request.url), { status: 303 });
}
