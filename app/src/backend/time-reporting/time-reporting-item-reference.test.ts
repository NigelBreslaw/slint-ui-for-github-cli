import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignmentYmdForWeekdayColumn,
  referenceCloseOrMergeInstantIso,
} from "./time-reporting-item-reference.ts";

describe("referenceCloseOrMergeInstantIso", () => {
  it("returns mergedAt for PullRequest when set", () => {
    assert.equal(
      referenceCloseOrMergeInstantIso({
        __typename: "PullRequest",
        mergedAt: "2026-03-25T12:00:00Z",
        closedAt: "2026-03-26T12:00:00Z",
      }),
      "2026-03-25T12:00:00Z",
    );
  });

  it("returns closedAt for PullRequest when mergedAt missing", () => {
    assert.equal(
      referenceCloseOrMergeInstantIso({
        __typename: "PullRequest",
        closedAt: "2026-03-24T08:00:00Z",
      }),
      "2026-03-24T08:00:00Z",
    );
  });

  it("returns closedAt for Issue", () => {
    assert.equal(
      referenceCloseOrMergeInstantIso({
        __typename: "Issue",
        closedAt: "2026-03-23T15:30:00Z",
      }),
      "2026-03-23T15:30:00Z",
    );
  });

  it("returns null for open PullRequest", () => {
    assert.equal(
      referenceCloseOrMergeInstantIso({
        __typename: "PullRequest",
        state: "OPEN",
      }),
      null,
    );
  });

  it("returns null for DraftIssue", () => {
    assert.equal(
      referenceCloseOrMergeInstantIso({
        __typename: "DraftIssue",
        title: "x",
      }),
      null,
    );
  });

  it("returns null for non-object", () => {
    assert.equal(referenceCloseOrMergeInstantIso(null), null);
  });
});

describe("assignmentYmdForWeekdayColumn", () => {
  it("returns same UTC calendar day for Wednesday", () => {
    assert.equal(assignmentYmdForWeekdayColumn("2026-03-25T12:00:00Z"), "2026-03-25");
  });

  it("maps Saturday to Friday of that ISO week (2026-W13)", () => {
    assert.equal(assignmentYmdForWeekdayColumn("2026-03-28T12:00:00Z"), "2026-03-27");
  });

  it("maps Sunday to Friday of that ISO week", () => {
    assert.equal(assignmentYmdForWeekdayColumn("2026-03-29T12:00:00Z"), "2026-03-27");
  });

  it("returns null for invalid date string", () => {
    assert.equal(assignmentYmdForWeekdayColumn("not-a-date"), null);
  });
});
