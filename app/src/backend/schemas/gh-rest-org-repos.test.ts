import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { fetchAllSlintUiOrgReposRest } from "../gh/fetch-slint-ui-org-repos-rest.ts";
import { parseOrgReposListJson } from "./gh-rest-org-repos.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../test/fixtures/rest");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
}

describe("parseOrgReposListJson", () => {
  it("accepts an empty array", () => {
    const r = parseOrgReposListJson(load("org-repos-list-empty.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.repos, []);
    }
  });

  it("maps name, full_name, and default_branch", () => {
    const r = parseOrgReposListJson(load("org-repos-list-valid.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.repos.length, 2);
      assert.deepEqual(r.repos[0], {
        name: "slint",
        fullName: "slint-ui/slint",
        defaultBranch: "master",
      });
      assert.deepEqual(r.repos[1], {
        name: "website",
        fullName: "slint-ui/website",
        defaultBranch: "main",
      });
    }
  });

  it("maps null default_branch to empty string", () => {
    const r = parseOrgReposListJson(load("org-repos-list-null-branch.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.repos.length, 1);
      assert.equal(r.repos[0]?.defaultBranch, "");
    }
  });

  it("rejects non-array root", () => {
    const r = parseOrgReposListJson({ message: "Not Found" });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /not a JSON array/i);
    }
  });

  it("rejects malformed item with index in message", () => {
    const r = parseOrgReposListJson(load("org-repos-list-malformed-item.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /index 1/);
    }
  });
});

describe("fetchAllSlintUiOrgReposRest", () => {
  it("is exported for callers that integrate with gh api", () => {
    assert.equal(typeof fetchAllSlintUiOrgReposRest, "function");
  });
});
