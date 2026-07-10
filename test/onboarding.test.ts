import assert from "node:assert/strict";
import test from "node:test";
import { rollbackSuffix } from "@/lib/onboarding";

test("rollbackSuffix returns empty suffix when rollback succeeded", () => {
  assert.equal(rollbackSuffix([]), "");
});

test("rollbackSuffix includes marker when rollback had errors", () => {
  assert.equal(rollbackSuffix(["client:fail"]), "+(Rollback+teilweise+fehlgeschlagen)");
});
