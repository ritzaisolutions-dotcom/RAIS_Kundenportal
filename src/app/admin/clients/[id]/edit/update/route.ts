import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { IMAGE_EXTENSIONS, IMAGE_MIME_TYPES, MAX_LOGO_BYTES, validateUploadedFile } from "@/lib/upload-validation";

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
  const name = String(formData.get("name") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const primaryContactEmail = String(formData.get("primary_contact_email") ?? "");
  const logo = formData.get("logo");

  const update: { name: string; slug: string; primary_contact_email: string; logo_path?: string } = {
    name,
    slug,
    primary_contact_email: primaryContactEmail,
  };

  if (logo instanceof File && logo.size > 0) {
    const logoValidationError = validateUploadedFile(logo, {
      maxBytes: MAX_LOGO_BYTES,
      allowedMimeTypes: IMAGE_MIME_TYPES,
      allowedExtensions: IMAGE_EXTENSIONS,
    });
    if (logoValidationError) {
      return NextResponse.redirect(new URL(`/admin/clients/${id}/edit?error=Logo+ist+ungültig`, request.url), { status: 303 });
    }

    const extension = logo.name.includes(".") ? logo.name.split(".").pop() : "png";
    const logoPath = `${slug}-${Date.now()}.${extension}`;
    const { error: logoError } = await admin.storage.from("logos").upload(logoPath, logo, {
      contentType: logo.type,
      upsert: true,
    });
    if (logoError) {
      return NextResponse.redirect(new URL(`/admin/clients/${id}/edit?error=Logo-Upload+fehlgeschlagen`, request.url), { status: 303 });
    }
    update.logo_path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${logoPath}`;
  }

  const { error } = await portal.from("clients").update(update).eq("id", id);

  if (error) {
    return NextResponse.redirect(new URL(`/admin/clients/${id}/edit?error=Speichern+fehlgeschlagen`, request.url), { status: 303 });
  }

  return NextResponse.redirect(new URL(`/admin/clients/${id}?success=Kunde+aktualisiert`, request.url), { status: 303 });
}
