import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTimeReportingWeekRows, cellDetailKey } from "./build-time-reporting-week-rows.ts";
import { TIME_SPENT_FIELD_NAME } from "./project-v2-item-hours.ts";
import { TIME_LOG_FIELD_NAME } from "./parse-time-log.ts";

describe("cellDetailKey", () => {
  it("joins item id and date", () => {
    assert.equal(cellDetailKey("PVTI_x", "2026-03-24"), "PVTI_x|2026-03-24");
  });
});

describe("buildTimeReportingWeekRows", () => {
  const targetWeek = { isoYear: 2026, isoWeek: 13 };

  it("omits items that only have board Time Spent with no Time Log in the week", () => {
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
            {
              __typename: "ProjectV2ItemFieldTextValue",
              text: "2026-03-01 1h\n",
              field: { name: TIME_LOG_FIELD_NAME },
            },
          ],
        },
      },
    ];
    const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, {
      timeSpentFieldName: TIME_SPENT_FIELD_NAME,
      timeLogFieldName: TIME_LOG_FIELD_NAME,
      targetWeek,
    });
    assert.equal(rows.length, 0);
    assert.equal(cellDetailsByKey.size, 0);
  });

  it("omits titled items with no time log minutes in the target week", () => {
    const items = [
      {
        id: "PVTI_b",
        content: { __typename: "Issue", title: "Issue x", url: "https://example.com/i/1" },
        fieldValues: { nodes: [] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, {
      timeSpentFieldName: TIME_SPENT_FIELD_NAME,
      timeLogFieldName: TIME_LOG_FIELD_NAME,
      targetWeek,
    });
    assert.equal(rows.length, 0);
  });

  it("skips items without content title", () => {
    const { rows } = buildTimeReportingWeekRows(
      [{ id: "PVTI_z", content: { __typename: "PullRequest" } }],
      { timeSpentFieldName: TIME_SPENT_FIELD_NAME, targetWeek },
    );
    assert.equal(rows.length, 0);
  });

  it("fills weekday cells from Time Log for the target ISO week; total is week log sum", () => {
    const log = "2026-03-23 0.5h\n2026-03-24 30m\n2026-03-25 15m\n2026-03-25 15m\n2026-03-01 8h\n";
    const items = [
      {
        id: "PVTI_log",
        content: {
          __typename: "Issue",
          title: "Logged",
          url: "https://example.com/i/2",
        },
        fieldValues: {
          nodes: [
            {
              __typename: "ProjectV2ItemFieldNumberValue",
              number: 2,
              field: { name: TIME_SPENT_FIELD_NAME },
            },
            {
              __typename: "ProjectV2ItemFieldTextValue",
              text: log,
              field: { name: TIME_LOG_FIELD_NAME },
            },
          ],
        },
      },
    ];
    const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, {
      timeSpentFieldName: TIME_SPENT_FIELD_NAME,
      timeLogFieldName: TIME_LOG_FIELD_NAME,
      targetWeek,
    });
    assert.equal(rows[0].mon, "30m");
    assert.equal(rows[0].tue, "30m");
    assert.equal(rows[0].wed, "30m");
    assert.equal(rows[0].thu, "—");
    assert.equal(rows[0].fri, "—");
    assert.equal(rows[0].total, "1h 30m");
    const kMon = cellDetailKey("PVTI_log", "2026-03-23");
    const kWed = cellDetailKey("PVTI_log", "2026-03-25");
    assert.equal(cellDetailsByKey.get(kMon)?.length, 1);
    assert.equal(cellDetailsByKey.get(kWed)?.length, 2);
    assert.equal(
      (cellDetailsByKey.get(kWed) ?? []).reduce((s, c) => s + c.minutes, 0),
      30,
    );
  });

  it("omits all rows when time log field name is not passed (log text is ignored)", () => {
    const items = [
      {
        id: "PVTI_n",
        content: { __typename: "Issue", title: "X", url: "https://x" },
        fieldValues: {
          nodes: [
            {
              __typename: "ProjectV2ItemFieldTextValue",
              text: "2026-03-23 9h",
              field: { name: TIME_LOG_FIELD_NAME },
            },
          ],
        },
      },
    ];
    const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, {
      timeSpentFieldName: TIME_SPENT_FIELD_NAME,
      targetWeek,
    });
    assert.equal(rows.length, 0);
    assert.equal(cellDetailsByKey.size, 0);
  });

  it("includes only items with minutes in the week when multiple cards exist", () => {
    const items = [
      {
        id: "PVTI_only_board",
        content: { __typename: "Issue", title: "A", url: "https://a" },
        fieldValues: {
          nodes: [
            {
              __typename: "ProjectV2ItemFieldNumberValue",
              number: 5,
              field: { name: TIME_SPENT_FIELD_NAME },
            },
          ],
        },
      },
      {
        id: "PVTI_logged",
        content: { __typename: "Issue", title: "B", url: "https://b" },
        fieldValues: {
          nodes: [
            {
              __typename: "ProjectV2ItemFieldTextValue",
              text: "2026-03-23 1h\n",
              field: { name: TIME_LOG_FIELD_NAME },
            },
          ],
        },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, {
      timeSpentFieldName: TIME_SPENT_FIELD_NAME,
      timeLogFieldName: TIME_LOG_FIELD_NAME,
      targetWeek,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].item_id, "PVTI_logged");
    assert.equal(rows[0].mon, "1h");
    assert.equal(rows[0].total, "1h");
  });
});
