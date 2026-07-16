import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADMIN_STATUS_TRANSITIONS,
  CUSTOMER_REQUEST_STATUS_LABEL,
  OPEN_CUSTOMER_REQUEST_STATUSES,
} from "../src/lib/customer-request-status";
import { buildVariableSchema, renderHtmlTemplate, scanHtmlTemplateVariables } from "../src/lib/document-template-engine";

test("customer request status maps cover all statuses", () => {
  const statuses = Object.keys(CUSTOMER_REQUEST_STATUS_LABEL);
  assert.equal(statuses.length, 6);
  for (const status of statuses) {
    assert.ok(CUSTOMER_REQUEST_STATUS_LABEL[status as keyof typeof CUSTOMER_REQUEST_STATUS_LABEL]);
    assert.ok(ADMIN_STATUS_TRANSITIONS[status as keyof typeof ADMIN_STATUS_TRANSITIONS]);
  }
});

test("open customer request statuses are actionable for RAIS", () => {
  assert.ok(OPEN_CUSTOMER_REQUEST_STATUSES.has("submitted"));
  assert.ok(OPEN_CUSTOMER_REQUEST_STATUSES.has("revision"));
  assert.equal(OPEN_CUSTOMER_REQUEST_STATUSES.has("completed"), false);
});

test("html template variable scan and render", () => {
  const html = "<p>{{KUNDE_FIRMA}} – {{RECHNUNGSNUMMER}}</p><div class=\"legend\">hint</div>";
  const keys = scanHtmlTemplateVariables(html);
  assert.deepEqual(keys, ["KUNDE_FIRMA", "RECHNUNGSNUMMER"]);
  assert.deepEqual(buildVariableSchema(keys)[0].key, "KUNDE_FIRMA");
  const rendered = renderHtmlTemplate(html, { KUNDE_FIRMA: "Acme GmbH", RECHNUNGSNUMMER: "R-001" });
  assert.match(rendered, /Acme GmbH/);
  assert.doesNotMatch(rendered, /legend/);
});
