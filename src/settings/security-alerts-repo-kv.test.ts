import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSecurityAlertsRepoFullName } from "./security-alerts-repo-kv.ts";

describe("validateSecurityAlertsRepoFullName", () => {
  it("accepts empty and whitespace as clear", () => {
    assert.deepEqual(validateSecurityAlertsRepoFullName(""), { ok: true, value: "" });
    assert.deepEqual(validateSecurityAlertsRepoFullName("   "), { ok: true, value: "" });
  });

  it("accepts owner/repo with trim", () => {
    assert.deepEqual(validateSecurityAlertsRepoFullName("  foo/bar  "), {
      ok: true,
      value: "foo/bar",
    });
  });

  it("rejects missing slash", () => {
    const r = validateSecurityAlertsRepoFullName("foobar");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /slash/i);
    }
  });

  it("rejects extra path segments", () => {
    const r = validateSecurityAlertsRepoFullName("a/b/c");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /one slash/i);
    }
  });

  it("rejects empty owner or repo", () => {
    assert.equal(validateSecurityAlertsRepoFullName("/bar").ok, false);
    assert.equal(validateSecurityAlertsRepoFullName("foo/").ok, false);
  });
});
