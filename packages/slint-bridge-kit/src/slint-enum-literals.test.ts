import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  slintEnumLiterals,
  slintEnumMembers,
  type SlintEnumUnion,
  type SlintEnumValues,
} from "./slint-enum-literals.ts";

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

describe("slintEnumMembers", () => {
  it("maps each case to itself", () => {
    const E = slintEnumMembers(["idle", "busy"] as const);
    assert.strictEqual(E.idle, "idle");
    assert.strictEqual(E.busy, "busy");
  });

  it("SlintEnumValues matches object values for assignability", () => {
    const E = slintEnumMembers(["a", "b"] as const);
    type V = SlintEnumValues<typeof E>;
    const useV = (x: V) => x;
    assert.strictEqual(useV(E.a), "a");
    assert.strictEqual(useV(E.b), "b");
  });
});
