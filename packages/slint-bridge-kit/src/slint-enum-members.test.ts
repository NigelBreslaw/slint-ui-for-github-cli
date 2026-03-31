import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slintEnumMembers, type SlintEnumValues } from "./slint-enum-members.ts";

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
