import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeTimeReportingDebugStem } from "./sanitize-time-reporting-debug-stem.ts";

describe("sanitizeTimeReportingDebugStem", () => {
  it("passes through alphanumeric node ids", () => {
    assert.equal(sanitizeTimeReportingDebugStem("PVT_kwDOABC123"), "PVT_kwDOABC123");
  });

  it("replaces slashes and spaces with underscores", () => {
    assert.equal(sanitizeTimeReportingDebugStem("a/b c"), "a_b_c");
  });

  it("is stable for the same input", () => {
    const id = "PVT_kwHOA==";
    assert.equal(sanitizeTimeReportingDebugStem(id), sanitizeTimeReportingDebugStem(id));
  });
});
