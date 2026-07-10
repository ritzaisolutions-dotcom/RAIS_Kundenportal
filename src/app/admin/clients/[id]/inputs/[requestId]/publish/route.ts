import { NextResponse } from "next/server";
import { mutationSucceeded } from "@/lib/mutation-result";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const portal = admin.schema("portal");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.redirect(new URL("/portal", request.url), { status: 303 });

  const { data: updatedRows, error } = await portal
    .from("input_requests")
    .update({ status: "open" })
    .eq("id", requestId)
    .eq("client_id", id)
    .eq("status", "draft")
    .select("id");

  if (!mutationSucceeded(updatedRows, error)) {
    return NextResponse.redirect(new URL(`/admin/clients/${id}?tab=inputs&error=Veröffentlichen+fehlgeschlagen`, request.url), { status: 303 });
  }

  return NextResponse.redirect(new URL(`/admin/clients/${id}?tab=inputs&success=Veröffentlicht`, request.url), { status: 303 });
}
