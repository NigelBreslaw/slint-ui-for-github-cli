import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatTimeReportingCellDetail } from "./format-time-reporting-cell-detail.ts";
import { TIME_SPENT_FIELD_NAME } from "./project-v2-item-hours.ts";

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
      totalFieldMinutes: 120,
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
      totalFieldMinutes: null,
    });
    assert.ok(r.body.includes("No time recorded for this day"));
  });

  it("explains Total from number field", () => {
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 5,
      weekDates,
      detailsMap: new Map(),
      totalFieldMinutes: 90,
    });
    assert.equal(r.title, "Time — Total");
    assert.ok(r.body.includes(TIME_SPENT_FIELD_NAME));
    assert.ok(r.body.includes("1h 30m"));
    assert.ok(r.body.includes("not allocated"));
  });
});
