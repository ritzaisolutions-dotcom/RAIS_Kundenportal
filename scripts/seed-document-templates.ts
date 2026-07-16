import fs from "node:fs/promises";
import path from "node:path";
import {
  buildVariableSchema,
  scanDocxTemplateVariables,
  scanHtmlTemplateVariables,
} from "../src/lib/document-template-engine";
import { createAdminClient } from "../src/lib/supabase/admin";

type SeedTemplate = {
  filePath: string;
  name: string;
  category: string;
};

const SEED_TEMPLATES: SeedTemplate[] = [
  {
    filePath: "01_Rechnungen/Rechnung_Anzahlung_VORLAGE.html",
    name: "Rechnung Anzahlung",
    category: "Rechnung",
  },
  {
    filePath: "01_Rechnungen/Rechnung_Retainer_VORLAGE.html",
    name: "Rechnung Retainer",
    category: "Rechnung",
  },
  {
    filePath: "01_Rechnungen/Rechnung_Schlusszahlung_VORLAGE.html",
    name: "Rechnung Schlusszahlung",
    category: "Rechnung",
  },
  {
    filePath: "03_Angebot/Angebotsvorlage_VORLAGE.html",
    name: "Angebot",
    category: "Angebot",
  },
  {
    filePath: "04_Testimonial/Testimonial_VORLAGE.html",
    name: "Testimonial",
    category: "Testimonial",
  },
];

async function main() {
  const admin = createAdminClient();
  const portal = admin.schema("portal");
  const baseDir = path.join(process.cwd(), "docs_vorlagen");

  for (const seed of SEED_TEMPLATES) {
    const absolutePath = path.join(baseDir, seed.filePath);
    const content = await fs.readFile(absolutePath);
    const ext = path.extname(seed.filePath).toLowerCase();
    const format = ext === ".docx" ? "docx" : "html";
    const storagePath = `seed/${seed.filePath.replace(/\\/g, "/")}`;

    const keys =
      format === "docx"
        ? scanDocxTemplateVariables(content)
        : scanHtmlTemplateVariables(content.toString("utf8"));
    const variableSchema = buildVariableSchema(keys);

    const { data: existing } = await portal
      .from("document_templates")
      .select("id")
      .eq("name", seed.name)
      .eq("category", seed.category)
      .maybeSingle();

    if (existing) {
      console.log(`skip (exists): ${seed.name}`);
      continue;
    }

    await admin.storage.from("document-templates").upload(storagePath, content, {
      contentType: format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/html",
      upsert: true,
    });

    const { error } = await portal.from("document_templates").insert({
      name: seed.name,
      category: seed.category,
      format,
      storage_path: storagePath,
      variable_schema: variableSchema,
    });

    if (error) {
      throw new Error(`Failed to seed ${seed.name}: ${error.message}`);
    }

    console.log(`seeded: ${seed.name} (${keys.length} variables)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
