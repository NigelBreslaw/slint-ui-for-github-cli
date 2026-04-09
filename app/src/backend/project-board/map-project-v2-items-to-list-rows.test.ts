import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectBoardItemKind } from "../../bridges/node/slint-interface.ts";
import {
  extractProjectV2SingleSelectName,
  mapProjectV2ItemsToListRows,
  PROJECT_BOARD_STATUS_FIELD_NAME,
} from "./map-project-v2-items-to-list-rows.ts";

describe("extractProjectV2SingleSelectName", () => {
  const itemWithStatus = {
    fieldValues: {
      nodes: [
        {
          __typename: "ProjectV2ItemFieldSingleSelectValue",
          name: "Done",
          field: { name: PROJECT_BOARD_STATUS_FIELD_NAME },
        },
      ],
    },
  };

  it("returns null for non-object", () => {
    assert.equal(extractProjectV2SingleSelectName(null, PROJECT_BOARD_STATUS_FIELD_NAME), null);
  });

  it("returns option name when field matches", () => {
    assert.equal(
      extractProjectV2SingleSelectName(itemWithStatus, PROJECT_BOARD_STATUS_FIELD_NAME),
      "Done",
    );
  });

  it("returns null when field name differs", () => {
    assert.equal(extractProjectV2SingleSelectName(itemWithStatus, "Priority"), null);
  });

  it("ignores number typename", () => {
    const item = {
      fieldValues: {
        nodes: [
          {
            __typename: "ProjectV2ItemFieldNumberValue",
            number: 1,
            field: { name: PROJECT_BOARD_STATUS_FIELD_NAME },
          },
        ],
      },
    };
    assert.equal(extractProjectV2SingleSelectName(item, PROJECT_BOARD_STATUS_FIELD_NAME), null);
  });
});

describe("mapProjectV2ItemsToListRows", () => {
  const prMerged = {
    id: "PVTI_1",
    content: {
      __typename: "PullRequest",
      number: 447,
      title: "Add test logs and coverage report",
      url: "https://github.com/slint-ui/account/pull/447",
      state: "MERGED",
      assignees: {
        nodes: [{ login: "NigelBreslaw" }, { login: "other" }, { login: "third" }],
      },
      repository: { nameWithOwner: "slint-ui/account" },
    },
    fieldValues: {
      nodes: [
        {
          __typename: "ProjectV2ItemFieldSingleSelectValue",
          name: "Merged",
          field: { name: PROJECT_BOARD_STATUS_FIELD_NAME },
        },
      ],
    },
  };

  const issueClosed = {
    id: "PVTI_2",
    content: {
      __typename: "Issue",
      number: 12,
      title: "Track flaky test",
      url: "https://github.com/slint-ui/account/issues/12",
      state: "CLOSED",
      assignees: { nodes: [] },
      repository: { nameWithOwner: "slint-ui/account" },
    },
    fieldValues: { nodes: [] },
  };

  const draft = {
    id: "PVTI_3",
    content: {
      __typename: "DraftIssue",
      title: "Ideas backlog",
      assignees: { nodes: [{ login: "alice" }] },
    },
    fieldValues: {
      nodes: [
        {
          __typename: "ProjectV2ItemFieldSingleSelectValue",
          name: "Backlog",
          field: { name: PROJECT_BOARD_STATUS_FIELD_NAME },
        },
      ],
    },
  };

  it("maps PullRequest with repo, state, elided assignees, and Status field", () => {
    const rows = mapProjectV2ItemsToListRows([prMerged]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kind, projectBoardItemKind.pullRequest);
    assert.equal(rows[0].state, "MERGED");
    assert.equal(rows[0].number, 447);
    assert.equal(rows[0].title, "Add test logs and coverage report");
    assert.equal(rows[0].url, "https://github.com/slint-ui/account/pull/447");
    assert.equal(
      rows[0].subtitle,
      "slint-ui/account#447 · Pull request · MERGED · NigelBreslaw, other +1 · Merged",
    );
  });

  it("maps Issue without assignees or project Status", () => {
    const rows = mapProjectV2ItemsToListRows([issueClosed]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kind, projectBoardItemKind.issue);
    assert.equal(rows[0].state, "CLOSED");
    assert.equal(rows[0].number, 12);
    assert.equal(rows[0].subtitle, "slint-ui/account#12 · Issue · CLOSED");
  });

  it("maps DraftIssue and uses empty url from itemContentTitleUrl", () => {
    const rows = mapProjectV2ItemsToListRows([draft]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kind, projectBoardItemKind.draftIssue);
    assert.equal(rows[0].state, "");
    assert.equal(rows[0].number, 0);
    assert.equal(rows[0].title, "Ideas backlog");
    assert.equal(rows[0].url, "");
    assert.equal(rows[0].subtitle, "Draft · alice · Backlog");
  });

  it("preserves order and skips items without content title", () => {
    const bad = {
      id: "x",
      content: {
        __typename: "PullRequest",
        number: 1,
        title: "",
        url: "https://github.com/a/b/1",
        state: "OPEN",
        assignees: { nodes: [] },
        repository: { nameWithOwner: "a/b" },
      },
      fieldValues: { nodes: [] },
    };
    const rows = mapProjectV2ItemsToListRows([prMerged, bad, issueClosed]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].title, "Add test logs and coverage report");
    assert.equal(rows[1].title, "Track flaky test");
  });

  it("matches fixture-shaped items from time-reporting sample", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../time-reporting/fixtures");
    const raw = JSON.parse(
      readFileSync(join(fixturesDir, "time-reporting-items-bot-sample.json"), "utf8"),
    ) as { items: unknown[] };
    const rows = mapProjectV2ItemsToListRows(raw.items);
    assert.equal(rows.length, 3);
    assert.equal(rows[0].kind, projectBoardItemKind.pullRequest);
    assert.equal(rows[0].state, "MERGED");
    assert.equal(rows[0].number, 1);
    assert.equal(rows[0].title, "Fixture PR in week");
    assert.ok(rows[0].subtitle.includes("Pull request"));
    assert.ok(rows[0].subtitle.includes("MERGED"));
    assert.equal(rows[2].kind, projectBoardItemKind.pullRequest);
    assert.equal(rows[2].state, "OPEN");
    assert.equal(rows[2].number, 3);
  });
});
