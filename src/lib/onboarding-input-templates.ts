import type { FormFieldType, FormSchemaField, InputRequestKind } from "@/lib/types";

/** Slugify a label into a stable form field key (ASCII, underscore). */
export function slugifyFieldKey(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_")
      .slice(0, 64) || "feld"
  );
}

export function ensureUniqueFieldKey(desired: string, existingKeys: string[], excludeIndex?: number): string {
  const base = slugifyFieldKey(desired) || "feld";
  const taken = new Set(
    existingKeys.filter((_, i) => (excludeIndex === undefined ? true : i !== excludeIndex)),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

export type FormSchemaValidationIssue = {
  index: number;
  message: string;
};

export function validateFormSchemaFields(fields: FormSchemaField[]): FormSchemaValidationIssue[] {
  const issues: FormSchemaValidationIssue[] = [];
  const seenKeys = new Map<string, number>();

  fields.forEach((field, index) => {
    if (!field.label.trim()) {
      issues.push({ index, message: "Label ist erforderlich." });
    }
    if (!field.key.trim()) {
      issues.push({ index, message: "Key ist erforderlich." });
    }
    const prev = seenKeys.get(field.key);
    if (prev !== undefined) {
      issues.push({ index, message: `Doppelter Key „${field.key}“ (auch bei Feld ${prev + 1}).` });
    } else if (field.key) {
      seenKeys.set(field.key, index);
    }
    if (field.type === "select" && (!field.options || field.options.filter((o) => o.trim()).length < 1)) {
      issues.push({ index, message: "Auswahlfelder brauchen mindestens eine Option." });
    }
  });

  return issues;
}

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Text",
  textarea: "Mehrzeilig",
  email: "E-Mail",
  select: "Auswahl",
  date: "Datum",
  file: "Datei",
};

export const FORM_FIELD_TYPES = Object.keys(FORM_FIELD_TYPE_LABELS) as FormFieldType[];

export function createEmptyField(type: FormFieldType = "text", existingKeys: string[] = []): FormSchemaField {
  const label = FORM_FIELD_TYPE_LABELS[type];
  return {
    key: ensureUniqueFieldKey(label, existingKeys),
    label: `Neues ${label}-Feld`,
    type,
    required: false,
    options: type === "select" ? ["Option A", "Option B"] : undefined,
  };
}

export type OnboardingInputTemplate = {
  id: string;
  title: string;
  kind: InputRequestKind;
  description_md: string;
  form_schema: FormSchemaField[] | null;
  /** If true, only intended for Haller seed / not shown as generic starter. */
  hallerOnly?: boolean;
};

export const ONBOARDING_INPUT_TEMPLATES: OnboardingInputTemplate[] = [
  {
    id: "email-texte-freigeben",
    title: "E-Mail-Texte freigeben",
    kind: "form",
    description_md:
      "Bitte die vorgeschlagenen Automatik-Texte prüfen und freigeben bzw. anpassen. RAIS liefert Vorschläge; Go-Live erst nach Ihrer Freigabe.",
    form_schema: [
      {
        key: "text_usage",
        label: "Text: Usage / Bestätigung Nutzung",
        type: "textarea",
        required: true,
      },
      {
        key: "text_rueckfrage",
        label: "Text: Rückfrage",
        type: "textarea",
        required: true,
      },
      {
        key: "text_absage",
        label: "Text: Absage",
        type: "textarea",
        required: true,
      },
      {
        key: "text_erinnerung",
        label: "Text: Erinnerung",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "microsoft-graph-m365",
    title: "Microsoft Graph / M365 Zugang",
    kind: "form",
    description_md:
      "Angaben für den Microsoft-Graph-Zugang (Mail lesen/senden, Kalender). Tenant-ID ist öffentlich — kein Secret.",
    form_schema: [
      {
        key: "admin_kontakt",
        label: "M365-Administrator (Name + Kontakt)",
        type: "text",
        required: true,
      },
      {
        key: "tenant_id",
        label: "Tenant-ID",
        type: "text",
        required: true,
      },
      {
        key: "consent_bestaetigt",
        label: "Admin-Consent erteilt?",
        type: "select",
        required: true,
        options: ["Ja", "Nein", "Noch offen"],
      },
      {
        key: "access_policy_erledigt",
        label: "Exchange Access Policy eingerichtet?",
        type: "select",
        required: true,
        options: ["Ja", "Nein", "Noch offen"],
      },
    ],
  },
  {
    id: "branding-logos",
    title: "Branding-Logos",
    kind: "form",
    description_md: "Bitte Logo-Dateien hochladen (SVG/PNG bevorzugt): Variante mit Text und ohne Text.",
    form_schema: [
      {
        key: "logo_mit_text",
        label: "Logo mit Text",
        type: "file",
        required: true,
      },
      {
        key: "logo_ohne_text",
        label: "Logo ohne Text (Icon/Mark)",
        type: "file",
        required: true,
      },
    ],
  },
  {
    id: "kalibrierungs-anfragen",
    title: "Kalibrierungs-Anfragen",
    kind: "form",
    description_md:
      "Jeweils ca. 5 echte Beispiel-Anfragen zur KI-Kalibrierung (z. B. als PDF, EML oder TXT-Export).",
    form_schema: [
      {
        key: "anfragen_qualifiziert",
        label: "5 qualifizierte E-Mail-Anfragen (Datei)",
        type: "file",
        required: true,
      },
      {
        key: "anfragen_unqualifiziert",
        label: "5 unqualifizierte E-Mail-Anfragen (Datei)",
        type: "file",
        required: true,
      },
    ],
  },
  {
    id: "kontakte-miete-kauf",
    title: "Zuständige Kontakte Miete / Kauf",
    kind: "form",
    description_md: "E-Mail-Adressen der zuständigen Ansprechpartner für Routing und Terminmails.",
    form_schema: [
      {
        key: "email_miete",
        label: "E-Mail zuständig Miete",
        type: "email",
        required: true,
      },
      {
        key: "email_kauf",
        label: "E-Mail zuständig Kauf",
        type: "email",
        required: true,
      },
    ],
  },
  {
    id: "terminregeln",
    title: "Terminregeln Miete / Kauf",
    kind: "form",
    description_md:
      "Mindestangaben für die Terminvergabe sowie Bestätigung der Slot-Dauer (Kauf 1 Std., Miete 30 Min.).",
    form_schema: [
      {
        key: "mindestangaben_miete",
        label: "Mindestangaben Terminvergabe Miete",
        type: "textarea",
        required: true,
      },
      {
        key: "mindestangaben_kauf",
        label: "Mindestangaben Terminvergabe Kauf",
        type: "textarea",
        required: true,
      },
      {
        key: "dauer_kauf",
        label: "Dauer Kauf-Termin",
        type: "select",
        required: true,
        options: ["1 Stunde", "45 Minuten", "90 Minuten", "Andere (bitte in Mindestangaben notieren)"],
      },
      {
        key: "dauer_miete",
        label: "Dauer Miete-Termin",
        type: "select",
        required: true,
        options: ["30 Minuten", "45 Minuten", "60 Minuten", "Andere (bitte in Mindestangaben notieren)"],
      },
    ],
  },
  {
    id: "mitarbeiter-zugaenge",
    title: "Mitarbeiter-Zugänge",
    kind: "form",
    description_md:
      "E-Mail-Adressen aller Mitarbeiter, für die Dashboard-/Portal-Zugänge angelegt werden sollen. Optional zusätzlich als CSV.",
    form_schema: [
      {
        key: "mitarbeiter_emails",
        label: "E-Mails aller Mitarbeiter (eine pro Zeile)",
        type: "textarea",
        required: true,
      },
      {
        key: "mitarbeiter_csv",
        label: "Optional: CSV-Liste",
        type: "file",
        required: false,
      },
    ],
  },
  {
    id: "kpi-waldemar",
    title: "KPI-Wünsche Waldemar (Overdeliver)",
    kind: "form",
    hallerOnly: true,
    description_md:
      "Welche Kennzahlen und Reports soll Waldemar im Portal bzw. in den Status-Reports sehen? (Overdeliver-Abstimmung)",
    form_schema: [
      {
        key: "kpi_wuensche",
        label: "Gewünschte KPIs / Report-Inhalte",
        type: "textarea",
        required: true,
      },
    ],
  },
];

export function getOnboardingTemplate(id: string): OnboardingInputTemplate | undefined {
  return ONBOARDING_INPUT_TEMPLATES.find((t) => t.id === id);
}

export function getLoadableOnboardingTemplates(): OnboardingInputTemplate[] {
  return ONBOARDING_INPUT_TEMPLATES.filter((t) => t.kind === "form" && Array.isArray(t.form_schema));
}
