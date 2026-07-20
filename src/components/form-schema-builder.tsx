"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useMemo, useState } from "react";
import {
  createEmptyField,
  ensureUniqueFieldKey,
  FORM_FIELD_TYPE_LABELS,
  FORM_FIELD_TYPES,
  getLoadableOnboardingTemplates,
  getOnboardingTemplate,
  slugifyFieldKey,
  validateFormSchemaFields,
} from "@/lib/onboarding-input-templates";
import type { FormFieldType, FormSchemaField } from "@/lib/types";

type FormSchemaBuilderProps = {
  initialFields?: FormSchemaField[];
  /** When false, builder is hidden (freetext mode). Still submits []. */
  enabled: boolean;
  name?: string;
};

function SortableFieldCard({
  field,
  index,
  onChange,
  onRemove,
}: {
  field: FormSchemaField;
  index: number;
  onChange: (index: number, patch: Partial<FormSchemaField>) => void;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.key || `field-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--color-linen-soft)] p-3 space-y-3"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-[var(--color-stone)] px-1"
          aria-label="Feld verschieben"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="flex-1 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[var(--color-stone)] mb-1">Label</label>
            <input
              value={field.label}
              onChange={(e) => {
                const label = e.target.value;
                onChange(index, {
                  label,
                  key: slugifyFieldKey(label) || field.key,
                });
              }}
              required={false}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-stone)] mb-1">Key</label>
            <input
              value={field.key}
              onChange={(e) => onChange(index, { key: slugifyFieldKey(e.target.value) })}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-stone)] mb-1">Typ</label>
            <select
              value={field.type}
              onChange={(e) => {
                const type = e.target.value as FormFieldType;
                onChange(index, {
                  type,
                  options: type === "select" ? field.options?.length ? field.options : ["Option A", "Option B"] : undefined,
                });
              }}
            >
              {FORM_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {FORM_FIELD_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
              <input
                type="checkbox"
                checked={Boolean(field.required)}
                onChange={(e) => onChange(index, { required: e.target.checked })}
              />
              Pflichtfeld
            </label>
          </div>
          {field.type === "select" ? (
            <div className="sm:col-span-2">
              <label className="block text-xs text-[var(--color-stone)] mb-1">
                Optionen (eine pro Zeile)
              </label>
              <textarea
                rows={3}
                value={(field.options ?? []).join("\n")}
                onChange={(e) =>
                  onChange(index, {
                    options: e.target.value.split("\n").map((line) => line.trimEnd()),
                  })
                }
              />
            </div>
          ) : null}
        </div>
        <button type="button" className="btn btn-secondary text-xs shrink-0" onClick={() => onRemove(index)}>
          Entfernen
        </button>
      </div>
    </div>
  );
}

function FormSchemaPreview({ fields }: { fields: FormSchemaField[] }) {
  if (!fields.length) {
    return <p className="text-sm text-[var(--color-stone)]">Noch keine Felder — Partner sieht ein leeres Formular.</p>;
  }

  return (
    <div className="space-y-3 pointer-events-none opacity-90">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="login-label block mb-1">
            {field.label || "(ohne Label)"}
            {field.required ? " *" : ""}
          </label>
          {field.type === "textarea" ? (
            <textarea rows={3} disabled placeholder="…" />
          ) : field.type === "select" ? (
            <select disabled>
              <option>Bitte wählen</option>
              {(field.options ?? []).filter(Boolean).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : field.type === "file" ? (
            <input type="file" disabled />
          ) : (
            <input type={field.type} disabled placeholder="…" />
          )}
        </div>
      ))}
    </div>
  );
}

export function FormSchemaBuilder({
  initialFields,
  enabled,
  name = "form_schema",
}: FormSchemaBuilderProps) {
  const dndId = useId();
  const templates = useMemo(() => getLoadableOnboardingTemplates(), []);
  const [fields, setFields] = useState<FormSchemaField[]>(
    () => initialFields ?? [createEmptyField("text"), createEmptyField("textarea", ["text"])],
  );
  const [templateId, setTemplateId] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const issues = enabled ? validateFormSchemaFields(fields) : [];
  const sortableIds = fields.map((f, i) => f.key || `field-${i}`);

  function updateField(index: number, patch: Partial<FormSchemaField>) {
    setFields((prev) => {
      const next = prev.map((f, i) => (i === index ? { ...f, ...patch } : f));
      if (patch.key !== undefined || patch.label !== undefined) {
        const keys = next.map((f) => f.key);
        const unique = ensureUniqueFieldKey(next[index].key || next[index].label, keys, index);
        next[index] = { ...next[index], key: unique };
      }
      return next;
    });
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function addField(type: FormFieldType) {
    setFields((prev) => [...prev, createEmptyField(type, prev.map((f) => f.key))]);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIndex = prev.findIndex((f, i) => (f.key || `field-${i}`) === active.id);
      const newIndex = prev.findIndex((f, i) => (f.key || `field-${i}`) === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    if (!id) return;
    const template = getOnboardingTemplate(id);
    if (!template?.form_schema) return;
    setFields(template.form_schema.map((f) => ({ ...f, options: f.options ? [...f.options] : undefined })));
  }

  const payload = enabled
    ? fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: Boolean(f.required),
        ...(f.type === "select"
          ? { options: (f.options ?? []).map((o) => o.trim()).filter(Boolean) }
          : {}),
      }))
    : [];

  if (!enabled) {
    return <input type="hidden" name={name} value="[]" />;
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={JSON.stringify(payload)} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="block text-xs text-[var(--color-stone)] mb-1" htmlFor={`${dndId}-template`}>
            Vorlage laden
          </label>
          <select
            id={`${dndId}-template`}
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">— Manuell / leer belassen —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
                {t.hallerOnly ? " (Haller)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {FORM_FIELD_TYPES.map((type) => (
            <button key={type} type="button" className="btn btn-secondary text-xs" onClick={() => addField(type)}>
              + {FORM_FIELD_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <SortableFieldCard
                key={sortableIds[index]}
                field={field}
                index={index}
                onChange={updateField}
                onRemove={removeField}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {issues.length > 0 ? (
        <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
          {issues.map((issue) => (
            <li key={`${issue.index}-${issue.message}`}>
              Feld {issue.index + 1}: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--color-linen)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)] mb-3">
          Vorschau (Partner)
        </p>
        <FormSchemaPreview fields={fields} />
      </div>
    </div>
  );
}
