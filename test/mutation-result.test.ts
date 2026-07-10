import assert from "node:assert/strict";
import test from "node:test";
import { mutationSucceeded } from "@/lib/mutation-result";

test("mutationSucceeded returns true for rows without error", () => {
  assert.equal(mutationSucceeded([{ id: "1" }], null), true);
});

test("mutationSucceeded returns false when rows are empty", () => {
  assert.equal(mutationSucceeded([], null), false);
});

test("mutationSucceeded returns false when error is present", () => {
  assert.equal(mutationSucceeded([{ id: "1" }], { message: "failed" }), false);
});
