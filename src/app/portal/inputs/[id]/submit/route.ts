import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseFormSchema } from "@/lib/portal-queries";
import {
  MAX_SUBMISSION_FILE_BYTES,
  MAX_SUBMISSION_TOTAL_BYTES,
  SUBMISSION_EXTENSIONS,
  SUBMISSION_MIME_TYPES,
  validateUploadedFile,
} from "@/lib/upload-validation";

async function cleanupUploadedFiles(supabase: SupabaseClient, filePaths: string[]) {
  if (!filePaths.length) return;
  await supabase.storage.from("submissions").remove(filePaths);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const portal = supabase.schema("portal");
  const { data: clientUser } = await portal.from("client_users").select("client_id,can_view_inputs").eq("user_id", user.id).maybeSingle();
  if (!clientUser?.client_id) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  if (!clientUser.can_view_inputs) {
    return NextResponse.redirect(new URL(`/portal/inputs/${id}?error=Keine+Berechtigung+für+diese+Aktion`, request.url), { status: 303 });
  }

  const { data: inputRequest } = await portal
    .from("input_requests")
    .select("id,kind,form_schema,status")
    .eq("id", id)
    .eq("client_id", clientUser.client_id)
    .maybeSingle();
  if (!inputRequest) {
    return NextResponse.redirect(new URL(`/portal/inputs/${id}?error=Anfrage+nicht+gefunden`, request.url), { status: 303 });
  }

  if (!["open", "reopened"].includes(inputRequest.status)) {
    return NextResponse.redirect(new URL(`/portal/inputs/${id}?error=Anfrage+ist+nicht+offen`, request.url), { status: 303 });
  }

  const formData = await request.formData();
  const payload: Record<string, string | null> = {};
  const filePaths: string[] = [];
  const validationErrors: string[] = [];
  let totalUploadedBytes = 0;

  if (inputRequest.kind === "freetext") {
    const freetext = String(formData.get("freetext") ?? "").trim();
    if (!freetext) {
      validationErrors.push("Bitte geben Sie eine Antwort ein.");
    }
    payload.freetext = freetext;
  } else {
    const fields = parseFormSchema(inputRequest.form_schema);
    for (const field of fields) {
      if (field.type === "file") {
        const file = formData.get(field.key);
        if (field.required && (!(file instanceof File) || file.size === 0)) {
          validationErrors.push(`Bitte laden Sie eine Datei für "${field.label}" hoch.`);
          continue;
        }
        if (file instanceof File && file.size > 0) {
          const uploadValidationError = validateUploadedFile(file, {
            maxBytes: MAX_SUBMISSION_FILE_BYTES,
            allowedMimeTypes: SUBMISSION_MIME_TYPES,
            allowedExtensions: SUBMISSION_EXTENSIONS,
          });
          if (uploadValidationError) {
            validationErrors.push(`Datei "${field.label}": ${uploadValidationError}`);
            continue;
          }

          totalUploadedBytes += file.size;
          if (totalUploadedBytes > MAX_SUBMISSION_TOTAL_BYTES) {
            validationErrors.push("Gesamtgröße aller Anhänge überschreitet das erlaubte Limit.");
            continue;
          }

          const filePath = `${clientUser.client_id}/${id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("submissions").upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });
          if (error) {
            validationErrors.push(`Datei-Upload fehlgeschlagen: ${field.label}`);
          } else {
            filePaths.push(filePath);
          }
        }
        continue;
      }
      const value = String(formData.get(field.key) ?? "").trim();
      if (field.required && !value) {
        validationErrors.push(`Bitte füllen Sie das Feld "${field.label}" aus.`);
      }
      payload[field.key] = value;
    }
  }

  const extraAttachments = formData.getAll("attachments");
  for (const attachment of extraAttachments) {
    if (!(attachment instanceof File) || attachment.size === 0) continue;

    const uploadValidationError = validateUploadedFile(attachment, {
      maxBytes: MAX_SUBMISSION_FILE_BYTES,
      allowedMimeTypes: SUBMISSION_MIME_TYPES,
      allowedExtensions: SUBMISSION_EXTENSIONS,
    });
    if (uploadValidationError) {
      validationErrors.push(`Datei "${attachment.name}": ${uploadValidationError}`);
      continue;
    }

    totalUploadedBytes += attachment.size;
    if (totalUploadedBytes > MAX_SUBMISSION_TOTAL_BYTES) {
      validationErrors.push("Gesamtgröße aller Anhänge überschreitet das erlaubte Limit.");
      continue;
    }

    const filePath = `${clientUser.client_id}/${id}/${Date.now()}-${attachment.name}`;
    const { error } = await supabase.storage.from("submissions").upload(filePath, attachment, {
      contentType: attachment.type,
      upsert: false,
    });
    if (error) {
      validationErrors.push(`Upload fehlgeschlagen: ${attachment.name}`);
    } else {
      filePaths.push(filePath);
    }
  }

  if (validationErrors.length > 0) {
    await cleanupUploadedFiles(supabase, filePaths);
    return NextResponse.redirect(
      new URL(`/portal/inputs/${id}?error=${encodeURIComponent(validationErrors.join(" "))}`, request.url),
      { status: 303 },
    );
  }

  const { data: submission, error: submissionError } = await portal
    .from("input_submissions")
    .insert({
      request_id: id,
      client_id: clientUser.client_id,
      submitted_by: user.id,
      data: payload,
      file_paths: filePaths,
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    await cleanupUploadedFiles(supabase, filePaths);
    return NextResponse.redirect(new URL(`/portal/inputs/${id}?error=Antwort+konnte+nicht+gespeichert+werden.`, request.url), {
      status: 303,
    });
  }

  const { error: statusError } = await admin.schema("portal").from("input_requests").update({ status: "submitted" }).eq("id", id);
  if (statusError) {
    await admin.schema("portal").from("input_submissions").delete().eq("id", submission.id);
    await cleanupUploadedFiles(supabase, filePaths);
    return NextResponse.redirect(new URL(`/portal/inputs/${id}?error=Status+konnte+nicht+aktualisiert+werden.`, request.url), {
      status: 303,
    });
  }

  return NextResponse.redirect(new URL(`/portal/inputs/${id}?success=Vielen+Dank%2C+die+Antwort+wurde+gespeichert.`, request.url), {
    status: 303,
  });
}
