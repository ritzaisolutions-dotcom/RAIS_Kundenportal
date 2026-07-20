"use client";

import { useState, type ReactNode } from "react";
import { FormSchemaBuilder } from "@/components/form-schema-builder";
import { getOnboardingTemplate, getLoadableOnboardingTemplates } from "@/lib/onboarding-input-templates";
import type { FormSchemaField, InputRequestKind } from "@/lib/types";

type InputRequestFormProps = {
  action: string;
  submitLabel: string;
  todayMin: string;
  dueDateMin?: string;
  flash?: { error?: string; success?: string };
  initial?: {
    title?: string;
    description_md?: string;
    kind?: InputRequestKind;
    form_schema?: FormSchemaField[];
    due_date?: string;
    status?: string;
  };
  statusOptions: Array<{ value: string; label: string }>;
  /** Allow loading a full template (title + description + schema) on new forms. */
  allowFullTemplateApply?: boolean;
  children?: ReactNode;
};

export function InputRequestForm({
  action,
  submitLabel,
  todayMin,
  dueDateMin,
  flash,
  initial,
  statusOptions,
  allowFullTemplateApply = false,
}: InputRequestFormProps) {
  const [kind, setKind] = useState<InputRequestKind>((initial?.kind as InputRequestKind) ?? "form");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description_md ?? "");
  const [schemaResetKey, setSchemaResetKey] = useState(0);
  const [schemaSeed, setSchemaSeed] = useState<FormSchemaField[] | undefined>(initial?.form_schema);
  const templates = getLoadableOnboardingTemplates();

  function onFullTemplate(id: string) {
    if (!id) return;
    const template = getOnboardingTemplate(id);
    if (!template) return;
    setTitle(template.title);
    setDescription(template.description_md);
    setKind(template.kind);
    if (template.form_schema) {
      setSchemaSeed(template.form_schema.map((f) => ({ ...f, options: f.options ? [...f.options] : undefined })));
      setSchemaResetKey((k) => k + 1);
    }
  }

  return (
    <form action={action} method="post" className="portal-card portal-card-body space-y-4">
      {allowFullTemplateApply ? (
        <div>
          <label className="block text-xs text-[var(--color-stone)] mb-1" htmlFor="full_template">
            Onboarding-Vorlage übernehmen
          </label>
          <select id="full_template" defaultValue="" onChange={(e) => onFullTemplate(e.target.value)}>
            <option value="">— Leeres Formular —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
                {t.hallerOnly ? " (Haller)" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--color-stone)]">
            Übernimmt Titel, Beschreibung und Felder. Danach frei anpassbar.
          </p>
        </div>
      ) : null}

      <div>
        <label className="block text-xs text-[var(--color-stone)] mb-1" htmlFor="title">
          Titel
        </label>
        <input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs text-[var(--color-stone)] mb-1" htmlFor="description_md">
          Beschreibung
        </label>
        <textarea
          id="description_md"
          name="description_md"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--color-stone)] mb-1" htmlFor="kind">
          Typ
        </label>
        <select
          id="kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as InputRequestKind)}
        >
          <option value="form">Formular</option>
          <option value="freetext">Freitext</option>
        </select>
      </div>

      <div>
        <p className="block text-xs text-[var(--color-stone)] mb-2">Formular-Felder</p>
        {kind === "form" ? (
          <FormSchemaBuilder key={schemaResetKey} enabled initialFields={schemaSeed} />
        ) : (
          <>
            <p className="text-sm text-[var(--color-stone)] mb-2">
              Freitext: Partner erhält ein einzelnes Antwortfeld — kein Schema nötig.
            </p>
            <FormSchemaBuilder enabled={false} />
          </>
        )}
      </div>

      <div>
        <label className="block text-xs text-[var(--color-stone)] mb-1" htmlFor="due_date">
          Fälligkeitsdatum
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          min={dueDateMin ?? todayMin}
          defaultValue={initial?.due_date ?? ""}
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--color-stone)] mb-1" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={initial?.status ?? "draft"}>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {flash?.error ? <p className="chip chip-error">{flash.error}</p> : null}
      {flash?.success ? <p className="chip chip-success">{flash.success}</p> : null}

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
