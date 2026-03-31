import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slintEnumLiterals, type SlintEnumUnion } from "./slint-enum-literals.ts";

describe("slintEnumLiterals", () => {
  it("returns the same tuple reference", () => {
    const values = ["a", "b"] as const;
    assert.strictEqual(slintEnumLiterals(values), values);
  });

  it("preserves readonly tuple inference for SlintEnumUnion", () => {
    const STATES = slintEnumLiterals(["idle", "busy"] as const);
    type S = SlintEnumUnion<typeof STATES>;
    const _exhaustive = (x: S): number => (x === "idle" ? 0 : 1);
    assert.equal(_exhaustive("busy"), 1);
  });
});
