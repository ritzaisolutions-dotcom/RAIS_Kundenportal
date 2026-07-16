import { NextResponse } from "next/server";
import {
  buildVariableSchema,
  parseDocumentVariableSchema,
  scanDocxTemplateVariables,
  scanHtmlTemplateVariables,
} from "@/lib/document-template-engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DOCUMENT_TEMPLATE_EXTENSIONS,
  DOCUMENT_TEMPLATE_MIME_TYPES,
  validateUploadedFile,
} from "@/lib/upload-validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const portal = admin.schema("portal");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.redirect(new URL("/portal", request.url), { status: 303 });

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const file = formData.get("template_file");
  const schemaRaw = String(formData.get("variable_schema") ?? "").trim();

  if (!name || !category) {
    return NextResponse.redirect(new URL("/admin/documents/new?error=Name+und+Kategorie+sind+Pflicht.", request.url), {
      status: 303,
    });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.redirect(new URL("/admin/documents/new?error=Bitte+eine+Vorlage+hochladen.", request.url), {
      status: 303,
    });
  }

  const validationError = validateUploadedFile(file, {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: DOCUMENT_TEMPLATE_MIME_TYPES,
    allowedExtensions: DOCUMENT_TEMPLATE_EXTENSIONS,
  });
  if (validationError) {
    return NextResponse.redirect(new URL(`/admin/documents/new?error=${encodeURIComponent(validationError)}`, request.url), {
      status: 303,
    });
  }

  const ext = file.name.toLowerCase().endsWith(".docx") ? "docx" : "html";
  const format = ext;
  const storagePath = `templates/${Date.now()}-${file.name}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  let variableSchema: ReturnType<typeof parseDocumentVariableSchema> = [];
  if (schemaRaw) {
    try {
      variableSchema = parseDocumentVariableSchema(JSON.parse(schemaRaw));
    } catch {
      variableSchema = [];
    }
  }
  if (!variableSchema.length) {
    try {
      const keys = ext === "docx" ? scanDocxTemplateVariables(fileBuffer) : scanHtmlTemplateVariables(fileBuffer.toString("utf8"));
      variableSchema = buildVariableSchema(keys);
    } catch {
      return NextResponse.redirect(
        new URL(
          "/admin/documents/new?error=" +
            encodeURIComponent(
              "Platzhalter konnten nicht gelesen werden. In Word entstehen {{…}}-Tags oft über mehrere Textabschnitte – Platzhalter am Stück neu eintippen.",
            ),
          request.url,
        ),
        { status: 303 },
      );
    }
  }

  const { error: uploadError } = await admin.storage.from("document-templates").upload(storagePath, fileBuffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.redirect(new URL("/admin/documents/new?error=Upload+fehlgeschlagen.", request.url), { status: 303 });
  }

  const { error: insertError } = await portal.from("document_templates").insert({
    name,
    category,
    format,
    storage_path: storagePath,
    variable_schema: variableSchema,
    created_by: user.id,
  });

  if (insertError) {
    await admin.storage.from("document-templates").remove([storagePath]);
    return NextResponse.redirect(new URL("/admin/documents/new?error=Vorlage+konnte+nicht+gespeichert+werden.", request.url), {
      status: 303,
    });
  }

  return NextResponse.redirect(new URL("/admin/documents?success=Vorlage+gespeichert", request.url), { status: 303 });
}
