import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import {
  inlineHtmlAssets,
  parseDocumentVariableSchema,
  renderDocxTemplate,
  renderHtmlTemplate,
} from "@/lib/document-template-engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BRANDING_DIR = path.join(process.cwd(), "docs_vorlagen", "05_Branding");

async function resolveBrandingAsset(fileName: string) {
  const assetPath = path.join(BRANDING_DIR, fileName);
  try {
    const content = await fs.readFile(assetPath);
    const ext = path.extname(fileName).toLowerCase();
    const mime =
      ext === ".svg"
        ? "image/svg+xml"
        : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream";
    return `data:${mime};base64,${content.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const portal = admin.schema("portal");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.redirect(new URL("/portal", request.url), { status: 303 });

  const { data: template } = await portal.from("document_templates").select("*").eq("id", id).maybeSingle();
  if (!template) {
    return NextResponse.redirect(new URL("/admin/documents?error=Vorlage+nicht+gefunden", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const clientId = String(formData.get("client_id") ?? "").trim() || null;
  const fields = parseDocumentVariableSchema(template.variable_schema);
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.key] = String(formData.get(field.key) ?? "");
  }

  const { data: fileBlob, error: downloadError } = await admin.storage
    .from("document-templates")
    .download(template.storage_path);

  if (downloadError || !fileBlob) {
    return NextResponse.redirect(
      new URL(`/admin/documents/${id}/generate?error=Vorlage+konnte+nicht+geladen+werden.`, request.url),
      { status: 303 },
    );
  }

  const sourceBuffer = Buffer.from(await fileBlob.arrayBuffer());
  let outputBuffer: Buffer;
  let contentType: string;
  let fileName: string;

  if (template.format === "docx") {
    try {
      outputBuffer = Buffer.from(renderDocxTemplate(sourceBuffer, values));
    } catch {
      return NextResponse.redirect(
        new URL(
          `/admin/documents/${id}/generate?error=` +
            encodeURIComponent(
              "Dokument konnte nicht erzeugt werden. Vermutlich sind {{…}}-Platzhalter in der Word-Vorlage über mehrere Abschnitte gesplittet – bitte am Stück neu eintippen und erneut hochladen.",
            ),
          request.url,
        ),
        { status: 303 },
      );
    }
    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    fileName = `${template.name.replace(/\s+/g, "_")}.docx`;
  } else {
    let html = renderHtmlTemplate(sourceBuffer.toString("utf8"), values);
    html = await inlineHtmlAssets(html, resolveBrandingAsset);
    outputBuffer = Buffer.from(html, "utf8");
    contentType = "text/html; charset=utf-8";
    fileName = `${template.name.replace(/\s+/g, "_")}.html`;
  }

  await portal.from("document_generations").insert({
    template_id: id,
    client_id: clientId,
    filled_values: values,
    generated_by: user.id,
  });

  return new NextResponse(new Uint8Array(outputBuffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
