import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractProjectV2NumberFieldHours,
  itemContentTitleUrl,
  projectHoursToMinutes,
  TIME_SPENT_FIELD_NAME,
} from "./project-v2-item-hours.ts";

describe("projectHoursToMinutes", () => {
  it("maps 1h to 60 minutes", () => {
    assert.equal(projectHoursToMinutes(1), 60);
  });
  it("maps 0.25h to 15 minutes", () => {
    assert.equal(projectHoursToMinutes(0.25), 15);
  });
  it("rounds 0.1h to 6 minutes", () => {
    assert.equal(projectHoursToMinutes(0.1), 6);
  });
  it("rounds 0.333h to 20 minutes", () => {
    assert.equal(projectHoursToMinutes(0.333), 20);
  });
});

describe("extractProjectV2NumberFieldHours", () => {
  const itemWithTimeSpent = {
    fieldValues: {
      nodes: [
        { __typename: "ProjectV2ItemFieldTextValue", text: "x", field: { name: "Title" } },
        {
          __typename: "ProjectV2ItemFieldNumberValue",
          number: 1.5,
          field: { name: TIME_SPENT_FIELD_NAME },
        },
      ],
    },
  };

  it("returns null for non-object", () => {
    assert.equal(extractProjectV2NumberFieldHours(null, TIME_SPENT_FIELD_NAME), null);
  });
  it("returns hours when field matches", () => {
    assert.equal(extractProjectV2NumberFieldHours(itemWithTimeSpent, TIME_SPENT_FIELD_NAME), 1.5);
  });
  it("returns 0 when number is zero", () => {
    const item = {
      fieldValues: {
        nodes: [
          {
            __typename: "ProjectV2ItemFieldNumberValue",
            number: 0,
            field: { name: TIME_SPENT_FIELD_NAME },
          },
        ],
      },
    };
    assert.equal(extractProjectV2NumberFieldHours(item, TIME_SPENT_FIELD_NAME), 0);
  });
  it("returns null when field missing", () => {
    assert.equal(extractProjectV2NumberFieldHours(itemWithTimeSpent, "Other"), null);
  });
  it("ignores wrong typename", () => {
    const item = {
      fieldValues: {
        nodes: [
          {
            __typename: "ProjectV2ItemFieldTextValue",
            number: 9,
            field: { name: TIME_SPENT_FIELD_NAME },
          },
        ],
      },
    };
    assert.equal(extractProjectV2NumberFieldHours(item, TIME_SPENT_FIELD_NAME), null);
  });
});

describe("itemContentTitleUrl", () => {
  it("returns null when content missing", () => {
    assert.equal(itemContentTitleUrl({}), null);
  });
  it("returns title and url for PullRequest", () => {
    const item = {
      content: {
        __typename: "PullRequest",
        title: "Fix bug",
        url: "https://github.com/o/r/pull/1",
      },
    };
    assert.deepEqual(itemContentTitleUrl(item), {
      title: "Fix bug",
      url: "https://github.com/o/r/pull/1",
    });
  });
  it("uses empty url for DraftIssue when absent", () => {
    const item = {
      content: {
        __typename: "DraftIssue",
        title: "Draft task",
      },
    };
    assert.deepEqual(itemContentTitleUrl(item), { title: "Draft task", url: "" });
  });
});
