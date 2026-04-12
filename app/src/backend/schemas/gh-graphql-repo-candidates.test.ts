import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { fetchRepoCandidatesPageGraphql } from "../gh/graphql-repo-candidates.ts";
import {
  compareUpdatedAtDesc,
  mergeIssueAndPullRequestNodesByUpdatedAt,
  parseRepoCandidatesGraphqlData,
  type RepoCandidateNode,
} from "./gh-graphql-repo-candidates.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../test/fixtures/graphql");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
}

describe("compareUpdatedAtDesc", () => {
  it("orders newer timestamps first", () => {
    assert.ok(compareUpdatedAtDesc("2026-01-02T00:00:00Z", "2026-01-01T00:00:00Z") < 0);
    assert.ok(compareUpdatedAtDesc("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z") > 0);
    assert.equal(compareUpdatedAtDesc("2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"), 0);
  });
});

describe("mergeIssueAndPullRequestNodesByUpdatedAt", () => {
  it("interleaves by updatedAt descending", () => {
    const issues: RepoCandidateNode[] = [
      {
        id: "i1",
        number: 1,
        title: "a",
        updatedAt: "2026-01-01T00:00:00Z",
        url: "u1",
      },
      {
        id: "i2",
        number: 2,
        title: "b",
        updatedAt: "2026-01-05T00:00:00Z",
        url: "u2",
      },
    ];
    const prs: RepoCandidateNode[] = [
      {
        id: "p1",
        number: 3,
        title: "c",
        updatedAt: "2026-01-03T00:00:00Z",
        url: "u3",
      },
    ];
    const rows = mergeIssueAndPullRequestNodesByUpdatedAt(issues, prs);
    assert.equal(rows.length, 3);
    assert.equal(rows[0]?.number, 2);
    assert.equal(rows[0]?.kind, "issue");
    assert.equal(rows[1]?.number, 3);
    assert.equal(rows[1]?.kind, "pullRequest");
    assert.equal(rows[2]?.number, 1);
    assert.equal(rows[2]?.kind, "issue");
  });
});

describe("parseRepoCandidatesGraphqlData", () => {
  it("accepts a valid repository payload and merges rows", () => {
    const r = parseRepoCandidatesGraphqlData(load("repo-candidates-valid.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.rows.length, 3);
      assert.equal(r.value.rows[0]?.number, 11);
      assert.equal(r.value.rows[0]?.kind, "issue");
      assert.equal(r.value.rows[1]?.number, 99);
      assert.equal(r.value.rows[1]?.kind, "pullRequest");
      assert.equal(r.value.rows[2]?.number, 10);
      assert.equal(r.value.issuesPageInfo.hasNextPage, false);
      assert.equal(r.value.pullRequestsPageInfo.hasNextPage, true);
      assert.equal(r.value.pullRequestsPageInfo.endCursor, "Y3Vyc29yOnYyOpK5");
    }
  });

  it("rejects null repository", () => {
    const r = parseRepoCandidatesGraphqlData(load("repo-candidates-repo-null.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /not found|not accessible/i);
    }
  });

  it("rejects malformed issue node", () => {
    const r = parseRepoCandidatesGraphqlData(load("repo-candidates-malformed-issue-node.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /issues node at index 0/i);
    }
  });
});

describe("fetchRepoCandidatesPageGraphql (input validation only)", () => {
  it("rejects empty owner", async () => {
    const r = await fetchRepoCandidatesPageGraphql("", "slint", { first: 10 });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /required/i);
    }
  });

  it("rejects owner containing slash", async () => {
    const r = await fetchRepoCandidatesPageGraphql("bad/org", "slint", { first: 10 });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /must not contain '\/'/);
    }
  });
});
