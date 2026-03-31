import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignProperties } from "./assign-properties.ts";

describe("assignProperties", () => {
  it("assigns every non-undefined entry from the partial", () => {
    const target = { a: 0, b: "", c: false as boolean };
    assignProperties(target, { a: 1, b: "x", c: true });
    assert.deepEqual(target, { a: 1, b: "x", c: true });
  });

  it("skips keys whose value is undefined so the target keeps the prior value", () => {
    const target = { a: 1, b: 2 };
    assignProperties(target, { a: undefined, b: 3 });
    assert.equal(target.a, 1);
    assert.equal(target.b, 3);
  });

  it("assigns null when provided", () => {
    const target: { x: string | null } = { x: "before" };
    assignProperties(target, { x: null });
    assert.equal(target.x, null);
  });

  it("does nothing when the partial is empty", () => {
    const target = { n: 42 };
    assignProperties(target, {});
    assert.equal(target.n, 42);
  });
});
