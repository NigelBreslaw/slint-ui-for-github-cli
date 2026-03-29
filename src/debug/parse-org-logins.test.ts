import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseOrgLogins } from "./parse-org-logins.ts";

describe("parseOrgLogins", () => {
  it("returns empty array for non-array payload", () => {
    assert.deepEqual(parseOrgLogins(null), []);
    assert.deepEqual(parseOrgLogins(undefined), []);
    assert.deepEqual(parseOrgLogins({}), []);
    assert.deepEqual(parseOrgLogins("x"), []);
  });

  it("returns empty array for empty array", () => {
    assert.deepEqual(parseOrgLogins([]), []);
  });

  it("collects string login fields in order", () => {
    assert.deepEqual(parseOrgLogins([{ login: "slint-ui" }, { login: "acme", id: 1 }]), [
      "slint-ui",
      "acme",
    ]);
  });

  it("skips rows without a string login", () => {
    assert.deepEqual(
      parseOrgLogins([
        { login: "ok" },
        null,
        {},
        { login: 42 },
        { name: "no-login" },
        { login: "" },
      ]),
      ["ok", ""],
    );
  });
});
