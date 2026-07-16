import { NextResponse } from "next/server";
import { cleanupCustomerRequestFiles, uploadCustomerRequestAttachments } from "@/lib/customer-request-upload";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const portal = supabase.schema("portal");
  const { data: clientUser } = await portal
    .from("client_users")
    .select("client_id,can_submit_requests")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!clientUser?.client_id || !clientUser.can_submit_requests) {
    return NextResponse.redirect(new URL("/portal/no-access", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const subject = String(formData.get("subject") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const projectName = String(formData.get("project_name") ?? "").trim();
  const descriptionMd = String(formData.get("description_md") ?? "").trim();

  const validationErrors: string[] = [];
  if (!subject) validationErrors.push("Bitte geben Sie einen Betreff ein.");
  if (!category) validationErrors.push("Bitte wählen Sie eine Kategorie.");
  if (!area) validationErrors.push("Bitte wählen Sie einen Bereich.");
  if (!projectName) validationErrors.push("Bitte geben Sie ein Projekt an.");
  if (!descriptionMd) validationErrors.push("Bitte geben Sie eine Beschreibung ein.");

  if (validationErrors.length > 0) {
    return NextResponse.redirect(
      new URL(`/portal/requests/new?error=${encodeURIComponent(validationErrors.join(" "))}`, request.url),
      { status: 303 },
    );
  }

  const requestKey = `new-${Date.now()}`;
  const attachmentFiles = formData.getAll("attachments").filter((entry): entry is File => entry instanceof File);
  const { filePaths, validationErrors: uploadErrors } = await uploadCustomerRequestAttachments(
    supabase,
    clientUser.client_id,
    requestKey,
    attachmentFiles,
  );

  if (uploadErrors.length > 0) {
    await cleanupCustomerRequestFiles(supabase, filePaths);
    return NextResponse.redirect(
      new URL(`/portal/requests/new?error=${encodeURIComponent(uploadErrors.join(" "))}`, request.url),
      { status: 303 },
    );
  }

  const { data: createdRequest, error } = await portal
    .from("customer_requests")
    .insert({
      client_id: clientUser.client_id,
      created_by: user.id,
      subject,
      category,
      area,
      project_name: projectName,
      description_md: descriptionMd,
      attachment_paths: filePaths,
    })
    .select("id")
    .single();

  if (error || !createdRequest) {
    await cleanupCustomerRequestFiles(supabase, filePaths);
    return NextResponse.redirect(
      new URL("/portal/requests/new?error=Anfrage+konnte+nicht+gespeichert+werden.", request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    new URL(`/portal/requests/${createdRequest.id}?success=Anfrage+übermittelt.+Sie+erhalten+eine+Bestätigung+per+E-Mail.`, request.url),
    { status: 303 },
  );
}
