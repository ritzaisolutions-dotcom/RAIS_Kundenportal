import test from "node:test";
import assert from "node:assert/strict";
import {
  ensureUniqueFieldKey,
  getLoadableOnboardingTemplates,
  ONBOARDING_INPUT_TEMPLATES,
  slugifyFieldKey,
  validateFormSchemaFields,
} from "../src/lib/onboarding-input-templates";

test("slugifyFieldKey handles German umlauts and spaces", () => {
  assert.equal(slugifyFieldKey("E-Mail zuständig Miete"), "e_mail_zustaendig_miete");
  assert.equal(slugifyFieldKey("Größe & Fläche"), "groesse_flaeche");
  assert.equal(slugifyFieldKey(""), "feld");
});

test("ensureUniqueFieldKey appends suffix on collision", () => {
  assert.equal(ensureUniqueFieldKey("Titel", ["titel"]), "titel_2");
  assert.equal(ensureUniqueFieldKey("Titel", ["titel", "titel_2"]), "titel_3");
  assert.equal(ensureUniqueFieldKey("Titel", ["titel"], 0), "titel");
});

test("validateFormSchemaFields catches empty label and select without options", () => {
  const issues = validateFormSchemaFields([
    { key: "a", label: "", type: "text", required: true },
    { key: "a", label: "Dup", type: "text" },
    { key: "sel", label: "Wahl", type: "select", options: [] },
  ]);
  assert.ok(issues.some((i) => i.message.includes("Label")));
  assert.ok(issues.some((i) => i.message.includes("Doppelter")));
  assert.ok(issues.some((i) => i.message.includes("Option")));
});

test("onboarding templates cover Haller input pack", () => {
  const ids = ONBOARDING_INPUT_TEMPLATES.map((t) => t.id);
  assert.ok(ids.includes("email-texte-freigeben"));
  assert.ok(ids.includes("microsoft-graph-m365"));
  assert.ok(ids.includes("branding-logos"));
  assert.ok(ids.includes("kalibrierungs-anfragen"));
  assert.ok(ids.includes("kontakte-miete-kauf"));
  assert.ok(ids.includes("terminregeln"));
  assert.ok(ids.includes("mitarbeiter-zugaenge"));
  assert.ok(ids.includes("kpi-waldemar"));

  const loadable = getLoadableOnboardingTemplates();
  assert.equal(loadable.length, ONBOARDING_INPUT_TEMPLATES.filter((t) => t.kind === "form").length);

  for (const template of loadable) {
    assert.ok(template.form_schema && template.form_schema.length > 0);
    const issues = validateFormSchemaFields(template.form_schema);
    assert.deepEqual(issues, [], `template ${template.id} should be valid`);
  }
});
