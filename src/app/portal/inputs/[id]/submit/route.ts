import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseFormSchema } from "@/lib/portal-queries";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const portal = admin.schema("portal");
  const { data: clientUser } = await portal.from("client_users").select("client_id").eq("user_id", user.id).maybeSingle();
  if (!clientUser?.client_id) return NextResponse.redirect(new URL("/login", request.url));

  const { data: inputRequest } = await portal
    .from("input_requests")
    .select("id,kind,form_schema,status")
    .eq("id", id)
    .eq("client_id", clientUser.client_id)
    .maybeSingle();
  if (!inputRequest) {
    return NextResponse.redirect(new URL(`/portal/inputs/${id}?error=Anfrage+nicht+gefunden`, request.url));
  }

  if (!["open", "reopened"].includes(inputRequest.status)) {
    return NextResponse.redirect(new URL(`/portal/inputs/${id}?error=Anfrage+ist+nicht+offen`, request.url));
  }

  const formData = await request.formData();
  const payload: Record<string, string | null> = {};
  const filePaths: string[] = [];

  if (inputRequest.kind === "freetext") {
    payload.freetext = String(formData.get("freetext") ?? "");
  } else {
    const fields = parseFormSchema(inputRequest.form_schema);
    for (const field of fields) {
      if (field.type === "file") {
        const file = formData.get(field.key);
        if (file instanceof File && file.size > 0) {
          const filePath = `${clientUser.client_id}/${id}/${Date.now()}-${file.name}`;
          const { error } = await admin.storage.from("submissions").upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });
          if (!error) filePaths.push(filePath);
        }
        continue;
      }
      payload[field.key] = String(formData.get(field.key) ?? "");
    }
  }

  const extraAttachments = formData.getAll("attachments");
  for (const attachment of extraAttachments) {
    if (!(attachment instanceof File) || attachment.size === 0) continue;
    const filePath = `${clientUser.client_id}/${id}/${Date.now()}-${attachment.name}`;
    const { error } = await admin.storage.from("submissions").upload(filePath, attachment, {
      contentType: attachment.type,
      upsert: false,
    });
    if (!error) filePaths.push(filePath);
  }

  await portal.from("input_submissions").insert({
    request_id: id,
    client_id: clientUser.client_id,
    submitted_by: user.id,
    data: payload,
    file_paths: filePaths,
  });

  await portal.from("input_requests").update({ status: "submitted" }).eq("id", id);

  return NextResponse.redirect(new URL(`/portal/inputs/${id}?success=Vielen+Dank%2C+die+Antwort+wurde+gespeichert`, request.url));
}
