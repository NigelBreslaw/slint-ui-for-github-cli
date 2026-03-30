import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatTimeReportingCellDetail } from "./format-time-reporting-cell-detail.ts";

describe("formatTimeReportingCellDetail", () => {
  const item = {
    content: {
      __typename: "PullRequest",
      title: "Fix thing",
      url: "https://github.com/o/r/pull/1",
    },
  };
  const weekDates = ["2026-03-23", "2026-03-24", "2026-03-25", "2026-03-26", "2026-03-27"];

  it("lists log contributions for a weekday", () => {
    const detailsMap = new Map([
      ["PVTI_x|2026-03-23", [{ minutes: 30, rawLine: "2026-03-23 0.5h" }]],
    ]);
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 0,
      weekDates,
      detailsMap,
    });
    assert.equal(r.title, "Time — Monday 2026-03-23");
    assert.ok(r.body.includes("Pull request: Fix thing"));
    assert.ok(r.body.includes("30m"));
    assert.ok(r.body.includes("2026-03-23 0.5h"));
  });

  it("shows empty weekday message when there are no log lines", () => {
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 1,
      weekDates,
      detailsMap: new Map(),
    });
    assert.ok(r.body.includes("No time recorded for this day"));
  });

  it("aggregates Total from Time Log across Mon–Fri", () => {
    const detailsMap = new Map([
      ["PVTI_x|2026-03-23", [{ minutes: 30, rawLine: "2026-03-23 0.5h" }]],
      ["PVTI_x|2026-03-24", [{ minutes: 60, rawLine: "2026-03-24 1h" }]],
    ]);
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 5,
      weekDates,
      detailsMap,
    });
    assert.equal(r.title, "Time — Total");
    assert.ok(r.body.includes("Week total from Time Log"));
    assert.ok(r.body.includes("1h 30m"));
    assert.ok(r.body.includes("90 minutes"));
  });

  it("explains Total when no log lines in the week", () => {
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 5,
      weekDates,
      detailsMap: new Map(),
    });
    assert.equal(r.title, "Time — Total");
    assert.ok(r.body.includes("No Time Log lines"));
  });
});
