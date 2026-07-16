import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { FormSchemaField } from "@/lib/types";

export type DocumentTemplateFormat = "docx" | "html";

export type DocumentVariableField = {
  key: string;
  label: string;
};

const VARIABLE_PATTERN = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

export function scanHtmlTemplateVariables(content: string): string[] {
  const keys = new Set<string>();
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    keys.add(match[1]);
  }
  return [...keys].sort();
}

export function scanDocxTemplateVariables(buffer: Buffer): string[] {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
  });
  const tags = doc.getFullText().match(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g) ?? [];
  const keys = new Set<string>();
  for (const tag of tags) {
    const match = tag.match(/\{\{\s*([A-Z0-9_]+)\s*\}\}/);
    if (match) keys.add(match[1]);
  }
  return [...keys].sort();
}

export function buildVariableSchema(keys: string[]): DocumentVariableField[] {
  return keys.map((key) => ({
    key,
    label: key.replaceAll("_", " "),
  }));
}

export function parseDocumentVariableSchema(input: unknown): DocumentVariableField[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((field) => {
      if (!field || typeof field !== "object") return null;
      const entry = field as Record<string, unknown>;
      const key = String(entry.key ?? "").trim();
      const label = String(entry.label ?? key).trim();
      if (!key) return null;
      return { key, label } satisfies DocumentVariableField;
    })
    .filter(Boolean) as DocumentVariableField[];
}

export function clientPrefillValues(client: {
  name: string;
  primary_contact_email: string | null;
}): Record<string, string> {
  const year = String(new Date().getFullYear());
  return {
    KUNDE_FIRMA: client.name,
    KUNDENNAME_FIRMA: client.name,
    KUNDEN_EMAIL: client.primary_contact_email ?? "",
    KUNDENEMAIL: client.primary_contact_email ?? "",
    JAHR: year,
    VERTRAGSDATUM: new Date().toLocaleDateString("de-DE"),
  };
}

export function renderHtmlTemplate(content: string, values: Record<string, string>) {
  let rendered = content;
  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.replaceAll(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), value);
  }
  rendered = rendered.replace(VARIABLE_PATTERN, "");
  rendered = rendered.replace(/<div class="legend">[\s\S]*?<\/div>/gi, "");
  return rendered;
}

export async function inlineHtmlAssets(content: string, assetResolver: (fileName: string) => Promise<string | null>) {
  const imgPattern = /src="([^"]+\.(?:svg|png|jpg|jpeg|webp))"/gi;
  let rendered = content;
  const seen = new Set<string>();

  for (const match of content.matchAll(imgPattern)) {
    const fileName = match[1].split("/").pop() ?? match[1];
    if (seen.has(fileName)) continue;
    seen.add(fileName);
    const dataUri = await assetResolver(fileName);
    if (!dataUri) continue;
    rendered = rendered.replaceAll(match[1], dataUri);
  }

  return rendered;
}

export function renderDocxTemplate(buffer: Buffer, values: Record<string, string>) {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(values);
  return doc.toBuffer();
}

export function documentVariableFieldsToFormSchema(fields: DocumentVariableField[]): FormSchemaField[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: "text" as const,
    required: false,
  }));
}
