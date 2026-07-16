import assert from "node:assert/strict";
import test from "node:test";
import { resolvePortalHome } from "@/lib/portal-queries";

test("resolvePortalHome prefers reports when reports permission is true", () => {
  assert.equal(
    resolvePortalHome({ canViewReports: true, canViewInputs: true, canSubmitRequests: true }),
    "/portal/reports",
  );
});

test("resolvePortalHome falls back to inputs when reports are disabled", () => {
  assert.equal(
    resolvePortalHome({ canViewReports: false, canViewInputs: true, canSubmitRequests: true }),
    "/portal/inputs",
  );
});

test("resolvePortalHome falls back to requests when only submit permission is enabled", () => {
  assert.equal(
    resolvePortalHome({ canViewReports: false, canViewInputs: false, canSubmitRequests: true }),
    "/portal/requests",
  );
});

test("resolvePortalHome sends users to no-access when all permissions are false", () => {
  assert.equal(
    resolvePortalHome({ canViewReports: false, canViewInputs: false, canSubmitRequests: false }),
    "/portal/no-access",
  );
});
