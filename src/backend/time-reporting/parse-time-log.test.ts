import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseDurationToMinutes,
  parseTimeLogLines,
  TIME_LOG_FIELD_NAME,
} from "./parse-time-log.ts";

describe("TIME_LOG_FIELD_NAME", () => {
  it("is the GitHub Projects text field label (kept for docs and external scripts)", () => {
    assert.equal(TIME_LOG_FIELD_NAME, "Time Log");
  });
});

describe("parseDurationToMinutes", () => {
  it("parses decimal hours", () => {
    assert.equal(parseDurationToMinutes("0.5h"), 30);
    assert.equal(parseDurationToMinutes("1h"), 60);
  });
  it("parses minutes suffix", () => {
    assert.equal(parseDurationToMinutes("45m"), 45);
  });
  it("parses combined h and m", () => {
    assert.equal(parseDurationToMinutes("1h 30m"), 90);
    assert.equal(parseDurationToMinutes("1h30m"), 90);
  });
  it("parses bare decimal as hours", () => {
    assert.equal(parseDurationToMinutes("2"), 120);
  });
  it("returns null for empty or unknown", () => {
    assert.equal(parseDurationToMinutes(""), null);
    assert.equal(parseDurationToMinutes("nope"), null);
  });
});

describe("parseTimeLogLines", () => {
  it("skips comments and blank lines", () => {
    const lines = parseTimeLogLines("# note\n\n2026-03-23 1h\n");
    assert.equal(lines.length, 1);
    assert.equal(lines[0].date, "2026-03-23");
  });
  it("accepts colon after date", () => {
    const lines = parseTimeLogLines("2026-03-24: 30m");
    assert.equal(lines.length, 1);
    assert.equal(lines[0].minutes, 30);
  });
  it("aggregates multiple lines same day in separate entries (caller sums)", () => {
    const lines = parseTimeLogLines("2026-03-25 15m\n2026-03-25 15m");
    assert.equal(lines.length, 2);
    assert.equal(lines[0].minutes + lines[1].minutes, 30);
  });
});
