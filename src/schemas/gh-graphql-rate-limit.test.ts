import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseGhGraphqlRateLimitResponse } from "./gh-graphql-rate-limit.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../test/fixtures/graphql");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
}

describe("parseGhGraphqlRateLimitResponse", () => {
  it("accepts a valid rateLimit payload", () => {
    const r = parseGhGraphqlRateLimitResponse(load("rate-limit-valid.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.rateLimit, {
        limit: 5000,
        remaining: 4999,
        resetAt: "2026-03-28T12:00:00Z",
      });
    }
  });

  it("surfaces top-level GraphQL errors when data is missing rateLimit", () => {
    const r = parseGhGraphqlRateLimitResponse(load("rate-limit-graphql-errors.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: Something went wrong");
    }
  });

  it("rejects when data has no rateLimit field", () => {
    const r = parseGhGraphqlRateLimitResponse(load("rate-limit-data-no-rateLimit.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: graphql response missing data.rateLimit");
    }
  });

  it("rejects null rateLimit node", () => {
    const r = parseGhGraphqlRateLimitResponse(load("rate-limit-rateLimit-null.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: data.rateLimit was null");
    }
  });

  it("rejects wrong types on rateLimit", () => {
    const r = parseGhGraphqlRateLimitResponse(load("rate-limit-bad-limit-type.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /^gh: rateLimit shape /);
    }
  });

  it("rejects non-object root", () => {
    const r = parseGhGraphqlRateLimitResponse(null);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "gh: graphql response was not an object");
    }
  });
});
