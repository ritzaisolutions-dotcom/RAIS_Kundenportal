import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { rollbackOnboardingArtifacts, rollbackSuffix } from "@/lib/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { IMAGE_EXTENSIONS, IMAGE_MIME_TYPES, MAX_LOGO_BYTES, validateUploadedFile } from "@/lib/upload-validation";

function errorUrl(request: Request, message: string, cleanupErrors: string[] = []) {
  return new URL(`/admin/clients/new?error=${message}${rollbackSuffix(cleanupErrors)}`, request.url);
}

export async function POST(request: Request) {
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
  const name = String(formData.get("name") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const primaryContactEmail = String(formData.get("primary_contact_email") ?? "");
  const displayName = String(formData.get("display_name") ?? "");
  const logo = formData.get("logo");

  let logoPath: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    const logoValidationError = validateUploadedFile(logo, {
      maxBytes: MAX_LOGO_BYTES,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      allowedExtensions: IMAGE_EXTENSIONS,
    });
    if (logoValidationError) {
      return NextResponse.redirect(errorUrl(request, "Logo+ist+ungültig"), { status: 303 });
    }

    const extension = logo.name.includes(".") ? logo.name.split(".").pop() : "png";
    logoPath = `${slug}-${Date.now()}.${extension}`;
    const { error: logoError } = await admin.storage.from("logos").upload(logoPath, logo, {
      contentType: logo.type,
      upsert: true,
    });
    if (logoError) {
      return NextResponse.redirect(new URL("/admin/clients/new?error=Logo-Upload+fehlgeschlagen", request.url), { status: 303 });
    }
  }

  const { data: client, error: clientError } = await portal
    .from("clients")
    .insert({
      name,
      slug,
      logo_path: logoPath ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${logoPath}` : null,
      primary_contact_email: primaryContactEmail,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    if (logoPath) {
      const { errors } = await rollbackOnboardingArtifacts({ logoPath });
      return NextResponse.redirect(errorUrl(request, "Kunde+konnte+nicht+angelegt+werden", errors), { status: 303 });
    }
    return NextResponse.redirect(errorUrl(request, "Kunde+konnte+nicht+angelegt+werden"), { status: 303 });
  }

  const tempPassword = `RAIS-${crypto.randomBytes(8).toString("hex")}`;
  const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
    email: primaryContactEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      must_change_password: true,
    },
  });

  if (authError || !createdUser.user) {
    const { errors } = await rollbackOnboardingArtifacts({ clientId: client.id, logoPath });
    return NextResponse.redirect(errorUrl(request, "Benutzer+konnte+nicht+angelegt+werden", errors), { status: 303 });
  }

  const { error: clientUserError } = await portal.from("client_users").insert({
    user_id: createdUser.user.id,
    client_id: client.id,
    display_name: displayName,
    can_view_reports: true,
    can_view_inputs: true,
  });

  if (clientUserError) {
    const { errors } = await rollbackOnboardingArtifacts({
      userId: createdUser.user.id,
      clientId: client.id,
      logoPath,
    });
    return NextResponse.redirect(errorUrl(request, "Zuordnung+des+Benutzers+fehlgeschlagen", errors), { status: 303 });
  }

  const successUrl = new URL("/admin/clients/new", request.url);
  successUrl.searchParams.set("success", "Kunde+und+Client-User+wurden+angelegt");
  const response = NextResponse.redirect(successUrl, { status: 303 });
  // Temp password wird bewusst NICHT als URL-Parameter uebergeben (landet sonst in
  // Server-/Vercel-Logs, Browser-Verlauf und Referrer-Headern). Stattdessen kurzlebiger,
  // httpOnly Cookie, der nur auf dieser Seite lesbar ist und nach 2 Minuten automatisch verfaellt.
  response.cookies.set("temp_password_flash", tempPassword, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 120,
    path: "/admin/clients/new",
  });
  return response;
}
