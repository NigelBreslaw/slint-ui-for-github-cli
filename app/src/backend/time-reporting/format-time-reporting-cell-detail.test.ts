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

  it("lists BOT contributions for a weekday", () => {
    const detailsMap = new Map([
      [
        "PVTI_x|2026-03-23",
        [
          {
            minutes: 30,
            rawLine: "BOT-Total Time Spent(h): 0.5h\nMerged/closed: 2026-03-23T10:00:00Z",
          },
        ],
      ],
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
    assert.ok(r.body.includes("BOT-Total Time Spent(h)"));
  });

  it("shows empty weekday message when there is no BOT entry", () => {
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 1,
      weekDates,
      detailsMap: new Map(),
    });
    assert.ok(r.body.includes("No BOT-Total Time Spent(h) attributed"));
  });

  it("aggregates Total from BOT across Mon–Fri", () => {
    const detailsMap = new Map([
      [
        "PVTI_x|2026-03-23",
        [
          {
            minutes: 30,
            rawLine: "BOT-Total Time Spent(h): 0.5h\nMerged/closed: 2026-03-23T10:00:00Z",
          },
        ],
      ],
      [
        "PVTI_x|2026-03-24",
        [
          {
            minutes: 60,
            rawLine: "BOT-Total Time Spent(h): 1h\nMerged/closed: 2026-03-24T10:00:00Z",
          },
        ],
      ],
    ]);
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 5,
      weekDates,
      detailsMap,
    });
    assert.equal(r.title, "Time — Total");
    assert.ok(r.body.includes("Week total (BOT-Total Time Spent(h))"));
    assert.ok(r.body.includes("1h 30m"));
    assert.ok(r.body.includes("90 minutes"));
  });

  it("explains Total when no BOT data in the week", () => {
    const r = formatTimeReportingCellDetail({
      item,
      itemId: "PVTI_x",
      dayIndex: 5,
      weekDates,
      detailsMap: new Map(),
    });
    assert.equal(r.title, "Time — Total");
    assert.ok(r.body.includes("No BOT-Total Time Spent(h)"));
  });
});
