import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { formatRateLimitResetLocal } from "./format-reset-at-local.ts";

const savedTz = process.env.TZ;

describe("formatRateLimitResetLocal", () => {
  beforeEach(() => {
    process.env.TZ = "UTC";
  });

  afterEach(() => {
    if (savedTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = savedTz;
    }
  });

  it("matches Date#toLocaleString with the same formatting options (stable under TZ=UTC)", () => {
    const iso = "2020-06-15T12:00:00.000Z";
    const expected = new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
    assert.equal(formatRateLimitResetLocal(iso), expected);
  });

  it("returns the input when the timestamp is not parseable", () => {
    assert.equal(formatRateLimitResetLocal("not-a-date"), "not-a-date");
  });
});
