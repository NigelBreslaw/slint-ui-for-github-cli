import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { debounce } from "./debounce.ts";

describe("debounce", () => {
  it("does not invoke fn before waitMs elapses", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      let calls = 0;
      const d = debounce(() => {
        calls += 1;
      }, 100);
      d();
      assert.equal(calls, 0);
      mock.timers.tick(99);
      assert.equal(calls, 0);
      mock.timers.tick(1);
      assert.equal(calls, 1);
    } finally {
      mock.timers.reset();
    }
  });

  it("coalesces rapid calls into one invocation with last arguments", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const seen: number[] = [];
      const d = debounce((n: number) => {
        seen.push(n);
      }, 50);
      d(1);
      d(2);
      d(3);
      mock.timers.tick(50);
      assert.deepEqual(seen, [3]);
    } finally {
      mock.timers.reset();
    }
  });

  it("flush invokes immediately with latest arguments and clears the timer", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const seen: string[] = [];
      const d = debounce((s: string) => {
        seen.push(s);
      }, 200);
      d("a");
      d("b");
      d.flush();
      assert.deepEqual(seen, ["b"]);
      mock.timers.tick(200);
      assert.deepEqual(seen, ["b"]);
    } finally {
      mock.timers.reset();
    }
  });

  it("cancel prevents a scheduled invocation", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      let calls = 0;
      const d = debounce(() => {
        calls += 1;
      }, 100);
      d();
      d.cancel();
      mock.timers.tick(100);
      assert.equal(calls, 0);
    } finally {
      mock.timers.reset();
    }
  });

  it("flush after cancel does nothing if nothing was scheduled", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      let calls = 0;
      const d = debounce(() => {
        calls += 1;
      }, 100);
      d.cancel();
      d.flush();
      assert.equal(calls, 0);
    } finally {
      mock.timers.reset();
    }
  });

  it("flush after cancel still runs fn when there was a prior call (lastArgs retained)", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const seen: number[] = [];
      const d = debounce((n: number) => {
        seen.push(n);
      }, 100);
      d(7);
      d.cancel();
      d.flush();
      assert.deepEqual(seen, [7]);
    } finally {
      mock.timers.reset();
    }
  });
});
