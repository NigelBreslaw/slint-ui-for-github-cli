import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wireFunctions } from "./wire-functions.ts";

describe("wireFunctions", () => {
  it("assigns only the handler keys onto the target", () => {
    const noop = () => {};
    const target: { a: () => void; b: () => void; c: number } = {
      a: noop,
      b: noop,
      c: 7,
    };
    const fnA = () => {};
    const fnB = () => {};
    wireFunctions(target, { a: fnA, b: fnB });
    assert.equal(target.a, fnA);
    assert.equal(target.b, fnB);
    assert.equal(target.c, 7);
  });

  it("replaces prior callbacks for overlapping keys", () => {
    const target: { onX: (n: number) => number } = {
      onX: (n) => n,
    };
    const next = (n: number) => n * 2;
    wireFunctions(target, { onX: next });
    assert.equal(target.onX(3), 6);
  });
});

describe("wireFunctions typing", () => {
  it("accepts a handler object that satisfies the selected keys", () => {
    type Slice = { one: (x: string) => void; two: () => boolean };
    const target: Slice = {
      one: () => {},
      two: () => true,
    };
    const handlers = {
      one: (x: string) => {
        assert.equal(x, "ok");
      },
      two: () => false,
    } satisfies Pick<Slice, "one" | "two">;
    wireFunctions(target, handlers);
    target.one("ok");
    assert.equal(target.two(), false);
  });
});
