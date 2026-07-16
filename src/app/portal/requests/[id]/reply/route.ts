import { NextResponse } from "next/server";
import { cleanupCustomerRequestFiles, uploadCustomerRequestAttachments } from "@/lib/customer-request-upload";
import { mutationSucceeded } from "@/lib/mutation-result";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data: customerRequest } = await portal
    .from("customer_requests")
    .select("id,status")
    .eq("id", id)
    .eq("client_id", clientUser.client_id)
    .maybeSingle();

  if (!customerRequest) {
    return NextResponse.redirect(new URL("/portal/requests?error=Anfrage+nicht+gefunden", request.url), { status: 303 });
  }

  if (customerRequest.status !== "revision") {
    return NextResponse.redirect(
      new URL(`/portal/requests/${id}?error=Diese+Anfrage+kann+derzeit+nicht+ergänzt+werden.`, request.url),
      { status: 303 },
    );
  }

  const formData = await request.formData();
  const bodyMd = String(formData.get("body_md") ?? "").trim();
  if (!bodyMd) {
    return NextResponse.redirect(new URL(`/portal/requests/${id}?error=Bitte+geben+Sie+eine+Ergänzung+ein.`, request.url), {
      status: 303,
    });
  }

  const { filePaths, validationErrors } = await uploadCustomerRequestAttachments(
    supabase,
    clientUser.client_id,
    id,
    formData.getAll("attachments").filter((entry): entry is File => entry instanceof File),
  );

  if (validationErrors.length > 0) {
    await cleanupCustomerRequestFiles(supabase, filePaths);
    return NextResponse.redirect(
      new URL(`/portal/requests/${id}?error=${encodeURIComponent(validationErrors.join(" "))}`, request.url),
      { status: 303 },
    );
  }

  const { data: eventRow, error: eventError } = await portal
    .from("customer_request_events")
    .insert({
      request_id: id,
      kind: "message",
      author_role: "customer",
      author_id: user.id,
      body_md: bodyMd,
      attachment_paths: filePaths,
    })
    .select("id")
    .single();

  if (eventError || !eventRow) {
    await cleanupCustomerRequestFiles(supabase, filePaths);
    return NextResponse.redirect(
      new URL(`/portal/requests/${id}?error=Ergänzung+konnte+nicht+gespeichert+werden.`, request.url),
      { status: 303 },
    );
  }

  const { data: updatedRows, error: updateError } = await portal
    .from("customer_requests")
    .update({ status: "submitted" })
    .eq("id", id)
    .eq("client_id", clientUser.client_id)
    .eq("status", "revision")
    .select("id");

  if (!mutationSucceeded(updatedRows, updateError)) {
    await portal.from("customer_request_events").delete().eq("id", eventRow.id);
    await cleanupCustomerRequestFiles(supabase, filePaths);
    return NextResponse.redirect(
      new URL(`/portal/requests/${id}?error=Status+konnte+nicht+aktualisiert+werden.`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    new URL(`/portal/requests/${id}?success=Ergänzung+übermittelt.+Vielen+Dank!`, request.url),
    { status: 303 },
  );
}
