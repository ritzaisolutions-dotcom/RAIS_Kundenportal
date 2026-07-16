import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { rollbackOnboardingArtifacts, rollbackSuffix } from "@/lib/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function errorUrl(request: Request, clientId: string, message: string, cleanupErrors: string[] = []) {
  return new URL(`/admin/clients/${clientId}/users/new?error=${message}${rollbackSuffix(cleanupErrors)}`, request.url);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const email = String(formData.get("email") ?? "");
  const displayName = String(formData.get("display_name") ?? "");
  const canViewReports = formData.get("can_view_reports") === "on";
  const canViewInputs = formData.get("can_view_inputs") === "on";
  const canSubmitRequests = formData.get("can_submit_requests") === "on";

  const tempPassword = `RAIS-${crypto.randomBytes(8).toString("hex")}`;
  const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });

  if (authError || !createdUser.user) {
    return NextResponse.redirect(errorUrl(request, id, "Benutzer+konnte+nicht+angelegt+werden"), {
      status: 303,
    });
  }

  const { error: clientUserError } = await portal.from("client_users").insert({
    user_id: createdUser.user.id,
    client_id: id,
    display_name: displayName,
    can_view_reports: canViewReports,
    can_view_inputs: canViewInputs,
    can_submit_requests: canSubmitRequests,
  });

  if (clientUserError) {
    const { errors } = await rollbackOnboardingArtifacts({ userId: createdUser.user.id });
    return NextResponse.redirect(errorUrl(request, id, "Zuordnung+fehlgeschlagen", errors), { status: 303 });
  }

  const successUrl = new URL(`/admin/clients/${id}/users/new`, request.url);
  successUrl.searchParams.set("success", "Benutzer+wurde+angelegt");
  const response = NextResponse.redirect(successUrl, { status: 303 });
  response.cookies.set("temp_password_flash", tempPassword, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 120,
    path: `/admin/clients/${id}/users/new`,
  });
  return response;
}
