import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Entfernt nur die client_users-Zuordnung (entzieht Zugriff sofort ueber RLS),
// loescht bewusst NICHT den auth.users-Account - das bleibt eine separate,
// eigene Entscheidung und ist so reversibel.
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

  await portal.from("client_users").delete().eq("user_id", userId).eq("client_id", id);

  return NextResponse.redirect(new URL(`/admin/clients/${id}?tab=users&success=Benutzer+entfernt`, request.url), { status: 303 });
}
