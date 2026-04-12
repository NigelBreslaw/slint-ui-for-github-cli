import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  addProjectV2ItemByIdGraphql,
  addProjectV2ItemsByContentIdsSequential,
  type AddProjectV2ItemOutcome,
  type AddProjectV2ItemsSequentialOptions,
} from "../gh/graphql-add-project-v2-item.ts";
import { parseAddProjectV2ItemByIdResponse } from "./gh-graphql-add-project-v2-item.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../test/fixtures/graphql");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
}

describe("parseAddProjectV2ItemByIdResponse", () => {
  it("returns project item id on success", () => {
    const r = parseAddProjectV2ItemByIdResponse(load("add-project-v2-item-success.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.projectItemId, "PVTI_lADOABCD_thisisanexample");
    }
  });

  it("surfaces GraphQL errors", () => {
    const r = parseAddProjectV2ItemByIdResponse(load("add-project-v2-item-errors.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /Resource not accessible/i);
    }
  });

  it("rejects null item", () => {
    const r = parseAddProjectV2ItemByIdResponse(load("add-project-v2-item-no-item.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /item was missing/i);
    }
  });
});

describe("addProjectV2ItemByIdGraphql (validation only)", () => {
  it("rejects empty project id", async () => {
    const r = await addProjectV2ItemByIdGraphql("", "MDU6SXNzdWU");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /required/i);
    }
  });

  it("rejects empty content id", async () => {
    const r = await addProjectV2ItemByIdGraphql("PVT_kwHOABCD", "  ");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /required/i);
    }
  });
});

describe("addProjectV2ItemsByContentIdsSequential", () => {
  it("returns empty array for empty content ids", async () => {
    const opts: AddProjectV2ItemsSequentialOptions = { delayMsBetween: 0 };
    const out: AddProjectV2ItemOutcome[] = await addProjectV2ItemsByContentIdsSequential(
      "PVT_proj",
      [],
      opts,
    );
    assert.deepEqual(out, []);
  });

  it("is exported for bulk-add flows", () => {
    assert.equal(typeof addProjectV2ItemsByContentIdsSequential, "function");
  });
});
