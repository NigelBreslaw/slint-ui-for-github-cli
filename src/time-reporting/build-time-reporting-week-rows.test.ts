import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTimeReportingWeekRows, cellDetailKey } from "./build-time-reporting-week-rows.ts";
import { TIME_SPENT_FIELD_NAME } from "./project-v2-item-hours.ts";

describe("cellDetailKey", () => {
  it("joins item id and date", () => {
    assert.equal(cellDetailKey("PVTI_x", "2026-03-24"), "PVTI_x|2026-03-24");
  });
});

describe("buildTimeReportingWeekRows", () => {
  const targetWeek = { isoYear: 2026, isoWeek: 13 };

  it("produces day placeholders and total from Time Spent", () => {
    const items = [
      {
        id: "PVTI_a",
        content: {
          __typename: "PullRequest",
          title: "PR one",
          url: "https://example.com/1",
        },
        fieldValues: {
          nodes: [
            {
              __typename: "ProjectV2ItemFieldNumberValue",
              number: 1.5,
              field: { name: TIME_SPENT_FIELD_NAME },
            },
          ],
        },
      },
    ];
    const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, {
      timeSpentFieldName: TIME_SPENT_FIELD_NAME,
      targetWeek,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].item_id, "PVTI_a");
    assert.equal(rows[0].title, "PR one");
    assert.equal(rows[0].mon, "—");
    assert.equal(rows[0].total, "1h 30m");
    assert.equal(cellDetailsByKey.size, 0);
  });

  it("uses em dash total when time field missing", () => {
    const items = [
      {
        id: "PVTI_b",
        content: { __typename: "Issue", title: "Issue x", url: "https://example.com/i/1" },
        fieldValues: { nodes: [] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, {
      timeSpentFieldName: TIME_SPENT_FIELD_NAME,
      targetWeek,
    });
    assert.equal(rows[0].total, "—");
  });

  it("skips items without content title", () => {
    const { rows } = buildTimeReportingWeekRows(
      [{ id: "PVTI_z", content: { __typename: "PullRequest" } }],
      { timeSpentFieldName: TIME_SPENT_FIELD_NAME, targetWeek },
    );
    assert.equal(rows.length, 0);
  });
});
