import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCountdownMs } from "./format-countdown.ts";

describe("formatCountdownMs", () => {
  it("formats 90 seconds as 01:30", () => {
    assert.equal(formatCountdownMs(90_000), "01:30");
  });

  it("formats 59 seconds as 00:59", () => {
    assert.equal(formatCountdownMs(59_000), "00:59");
  });

  it("formats exactly one minute", () => {
    assert.equal(formatCountdownMs(60_000), "01:00");
  });

  it("returns 00:00 for zero, negative, NaN, and Infinity", () => {
    assert.equal(formatCountdownMs(0), "00:00");
    assert.equal(formatCountdownMs(-1), "00:00");
    assert.equal(formatCountdownMs(Number.NaN), "00:00");
    assert.equal(formatCountdownMs(Number.POSITIVE_INFINITY), "00:00");
  });
});
