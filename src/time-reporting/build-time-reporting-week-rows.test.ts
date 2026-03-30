import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTimeReportingWeekRows, cellDetailKey } from "./build-time-reporting-week-rows.ts";
import { BOT_TOTAL_TIME_SPENT_FIELD_NAME } from "./project-v2-item-hours.ts";

describe("cellDetailKey", () => {
  it("joins item id and date", () => {
    assert.equal(cellDetailKey("PVTI_x", "2026-03-24"), "PVTI_x|2026-03-24");
  });
});

function botNode(hours: number) {
  return {
    __typename: "ProjectV2ItemFieldNumberValue",
    number: hours,
    field: { name: BOT_TOTAL_TIME_SPENT_FIELD_NAME },
  };
}

describe("buildTimeReportingWeekRows", () => {
  const targetWeek = { isoYear: 2026, isoWeek: 13 };

  it("includes row when BOT > 0 and mergedAt is Wed in target week", () => {
    const items = [
      {
        id: "PVTI_a",
        content: {
          __typename: "PullRequest",
          title: "PR one",
          url: "https://example.com/1",
          mergedAt: "2026-03-25T14:00:00Z",
        },
        fieldValues: { nodes: [botNode(0.5)] },
      },
    ];
    const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].item_id, "PVTI_a");
    assert.equal(rows[0].title, "PR one");
    assert.equal(rows[0].mon, "—");
    assert.equal(rows[0].tue, "—");
    assert.equal(rows[0].wed, "30m");
    assert.equal(rows[0].thu, "—");
    assert.equal(rows[0].fri, "—");
    assert.equal(rows[0].total, "30m");
    const k = cellDetailKey("PVTI_a", "2026-03-25");
    assert.equal(cellDetailsByKey.get(k)?.length, 1);
    assert.ok(cellDetailsByKey.get(k)?.[0].rawLine?.includes("BOT-Total"));
  });

  it("uses closedAt when PullRequest has no mergedAt", () => {
    const items = [
      {
        id: "PVTI_b",
        content: {
          __typename: "PullRequest",
          title: "Closed only",
          url: "https://example.com/2",
          closedAt: "2026-03-24T10:00:00Z",
        },
        fieldValues: { nodes: [botNode(1)] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tue, "1h");
    assert.equal(rows[0].total, "1h");
  });

  it("includes Issue closed in target week", () => {
    const items = [
      {
        id: "PVTI_i",
        content: {
          __typename: "Issue",
          title: "Bug",
          url: "https://example.com/i/1",
          closedAt: "2026-03-23T18:00:00Z",
        },
        fieldValues: { nodes: [botNode(0.25)] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].mon, "15m");
  });

  it("maps weekend merge to Friday column in same week", () => {
    const items = [
      {
        id: "PVTI_w",
        content: {
          __typename: "PullRequest",
          title: "Weekend",
          url: "https://example.com/w",
          mergedAt: "2026-03-29T12:00:00Z",
        },
        fieldValues: { nodes: [botNode(2)] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].fri, "2h");
    assert.equal(rows[0].mon, "—");
  });

  it("omits row when BOT is 0", () => {
    const items = [
      {
        id: "PVTI_z",
        content: {
          __typename: "PullRequest",
          title: "No time",
          url: "https://z",
          mergedAt: "2026-03-25T12:00:00Z",
        },
        fieldValues: { nodes: [botNode(0)] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 0);
  });

  it("omits row when merge is in another ISO week", () => {
    const items = [
      {
        id: "PVTI_o",
        content: {
          __typename: "PullRequest",
          title: "Other week",
          url: "https://o",
          mergedAt: "2026-04-01T12:00:00Z",
        },
        fieldValues: { nodes: [botNode(1)] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 0);
  });

  it("omits open PullRequest without mergedAt or closedAt", () => {
    const items = [
      {
        id: "PVTI_open",
        content: {
          __typename: "PullRequest",
          title: "Open",
          url: "https://open",
          state: "OPEN",
        },
        fieldValues: { nodes: [botNode(5)] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 0);
  });

  it("skips items without content title", () => {
    const { rows } = buildTimeReportingWeekRows(
      [
        {
          id: "PVTI_z",
          content: { __typename: "PullRequest", mergedAt: "2026-03-25T12:00:00Z" },
          fieldValues: { nodes: [botNode(1)] },
        },
      ],
      { targetWeek },
    );
    assert.equal(rows.length, 0);
  });

  it("includes only items in week when multiple cards exist", () => {
    const items = [
      {
        id: "PVTI_in",
        content: {
          __typename: "PullRequest",
          title: "In",
          url: "https://in",
          mergedAt: "2026-03-26T12:00:00Z",
        },
        fieldValues: { nodes: [botNode(0.5)] },
      },
      {
        id: "PVTI_out",
        content: {
          __typename: "PullRequest",
          title: "Out",
          url: "https://out",
          mergedAt: "2026-04-02T12:00:00Z",
        },
        fieldValues: { nodes: [botNode(3)] },
      },
    ];
    const { rows } = buildTimeReportingWeekRows(items, { targetWeek });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].item_id, "PVTI_in");
  });
});
