import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { fetchDependabotAlertsForRepo } from "../gh/dependabot-alerts.ts";
import { parseDependabotAlertsList } from "./gh-rest-dependabot-alerts.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../test/fixtures/rest");

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
}

describe("parseDependabotAlertsList", () => {
  it("accepts an empty array", () => {
    const r = parseDependabotAlertsList(load("dependabot-alerts-list-empty.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.deepEqual(r.rows, []);
    }
  });

  it("accepts a single valid alert", () => {
    const r = parseDependabotAlertsList(load("dependabot-alerts-list-valid.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.rows.length, 1);
      const row = r.rows[0];
      assert.equal(row?.number, 42);
      assert.equal(row?.state, "open");
      assert.equal(row?.summary, "Prototype pollution in lodash");
      assert.equal(row?.severity, "high");
      assert.equal(row?.packageName, "lodash");
      assert.equal(row?.ecosystem, "npm");
      assert.equal(row?.htmlUrl, "https://github.com/octocat/hello-world/security/dependabot/42");
    }
  });

  it("maps multiple alerts", () => {
    const r = parseDependabotAlertsList(load("dependabot-alerts-list-two.json"));
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.rows.length, 2);
      assert.equal(r.rows[0]?.packageName, "a");
      assert.equal(r.rows[1]?.packageName, "requests");
    }
  });

  it("rejects non-array root", () => {
    const r = parseDependabotAlertsList({ message: "Not Found" });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /not a JSON array/i);
    }
  });

  it("rejects malformed item with index in message", () => {
    const r = parseDependabotAlertsList(load("dependabot-alerts-list-malformed-item.json"));
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /index 1/);
    }
  });
});

describe("fetchDependabotAlertsForRepo (input validation only)", () => {
  it("rejects empty owner", async () => {
    const r = await fetchDependabotAlertsForRepo("", "repo");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /required/i);
    }
  });

  it("rejects owner containing slash", async () => {
    const r = await fetchDependabotAlertsForRepo("bad/name", "repo");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /must not contain '\/'/);
    }
  });

  it("rejects empty repo", async () => {
    const r = await fetchDependabotAlertsForRepo("owner", "  ");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /required/i);
    }
  });
});
