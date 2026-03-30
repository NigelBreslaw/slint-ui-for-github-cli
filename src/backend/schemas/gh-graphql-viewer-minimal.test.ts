import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseGhGraphqlViewerMinimalResponse } from "./gh-graphql-viewer-minimal.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../test/fixtures/graphql");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
}

describe("parseGhGraphqlViewerMinimalResponse", () => {
  it("accepts a full viewer payload", () => {
    const r = parseGhGraphqlViewerMinimalResponse(load("viewer-valid.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.viewer.login, "octocat");
      assert.equal(r.viewer.name, "The Octocat");
      assert.equal(r.viewer.status?.message, "Working from home");
    }
  });

  it("accepts null status", () => {
    const r = parseGhGraphqlViewerMinimalResponse(load("viewer-status-null.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.viewer.login, "octocat");
      assert.equal(r.viewer.name, null);
      assert.equal(r.viewer.status, null);
    }
  });

  it("surfaces top-level GraphQL errors", () => {
    const r = parseGhGraphqlViewerMinimalResponse(load("viewer-graphql-errors.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: Bad credentials");
    }
  });

  it("rejects when data has no viewer field", () => {
    const r = parseGhGraphqlViewerMinimalResponse(load("viewer-data-no-viewer.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: graphql response missing data.viewer");
    }
  });

  it("rejects null viewer", () => {
    const r = parseGhGraphqlViewerMinimalResponse(load("viewer-viewer-null.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: data.viewer was null");
    }
  });

  it("rejects viewer missing required login", () => {
    const r = parseGhGraphqlViewerMinimalResponse(load("viewer-missing-login.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /^gh: viewer shape /);
    }
  });

  it("rejects non-object root", () => {
    const r = parseGhGraphqlViewerMinimalResponse(undefined);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: graphql response was not an object");
    }
  });
});
