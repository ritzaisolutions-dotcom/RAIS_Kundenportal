import assert from "node:assert/strict";
import test from "node:test";
import { resolvePortalHome } from "@/lib/portal-queries";

test("resolvePortalHome prefers reports when both permissions are true", () => {
  assert.equal(resolvePortalHome({ canViewReports: true, canViewInputs: true }), "/portal/reports");
});

test("resolvePortalHome falls back to inputs when reports are disabled", () => {
  assert.equal(resolvePortalHome({ canViewReports: false, canViewInputs: true }), "/portal/inputs");
});

test("resolvePortalHome sends users to no-access when both permissions are false", () => {
  assert.equal(resolvePortalHome({ canViewReports: false, canViewInputs: false }), "/portal/no-access");
});
