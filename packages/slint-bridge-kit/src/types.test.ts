import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExhaustiveCallbacks, FunctionKeysOf, KeysMatching } from "./types.ts";
import { wireFunctions } from "./wire-functions.ts";

/** Compile-time helpers: if these assignments fail, `tsc` fails. */
type _Equal<A, B> =
  (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;

interface Widget {
  title: string;
  size: number;
  onClick: (e: string) => void;
  onHover: () => void;
}

const _keysMatchingString: _Equal<KeysMatching<Widget, string>, "title"> = true;
const _keysMatchingNumber: _Equal<KeysMatching<Widget, number>, "size"> = true;

const _functionKeys: _Equal<FunctionKeysOf<Widget>, "onClick" | "onHover"> = true;

void _keysMatchingString;
void _keysMatchingNumber;
void _functionKeys;

describe("ExhaustiveCallbacks + wireFunctions", () => {
  it("accepts a handler map that satisfies every selected callback key", () => {
    const target: Widget = {
      title: "",
      size: 0,
      onClick: () => {},
      onHover: () => {},
    };
    const handlers = {
      onClick: (e: string) => {
        assert.equal(e, "go");
      },
      onHover: () => {},
    } satisfies ExhaustiveCallbacks<Widget, "onClick" | "onHover">;
    wireFunctions(target, handlers);
    target.onClick("go");
  });
});

// @ts-expect-error -- missing `onHover`; ExhaustiveCallbacks requires every key in K
const _incompleteHandlers: ExhaustiveCallbacks<Widget, "onClick" | "onHover"> = {
  onClick: () => {},
};

void _incompleteHandlers;
