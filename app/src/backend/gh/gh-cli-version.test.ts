import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatMinGhCliVersion,
  isGhSemverAtLeast,
  MIN_GH_CLI_VERSION,
  parseSemverFromGhVersionLine,
} from "./gh-cli-version.ts";

describe("formatMinGhCliVersion", () => {
  it("matches MIN_GH_CLI_VERSION", () => {
    assert.equal(formatMinGhCliVersion(), "2.89.0");
    assert.equal(MIN_GH_CLI_VERSION.major, 2);
  });
});

describe("parseSemverFromGhVersionLine", () => {
  it("parses gh version first line", () => {
    assert.deepEqual(parseSemverFromGhVersionLine("gh version 2.89.0 (2026-03-26)"), {
      major: 2,
      minor: 89,
      patch: 0,
    });
  });

  it("returns null for malformed line", () => {
    assert.equal(parseSemverFromGhVersionLine("git version 2.0"), null);
    assert.equal(parseSemverFromGhVersionLine(""), null);
  });
});

describe("isGhSemverAtLeast vs MIN_GH_CLI_VERSION (2.89.0)", () => {
  const min = MIN_GH_CLI_VERSION;

  it("accepts 2.89.0", () => {
    assert.equal(isGhSemverAtLeast({ major: 2, minor: 89, patch: 0 }, min), true);
  });

  it("rejects 2.88.99", () => {
    assert.equal(isGhSemverAtLeast({ major: 2, minor: 88, patch: 99 }, min), false);
  });

  it("accepts 2.90.0 and 3.0.0", () => {
    assert.equal(isGhSemverAtLeast({ major: 2, minor: 90, patch: 0 }, min), true);
    assert.equal(isGhSemverAtLeast({ major: 3, minor: 0, patch: 0 }, min), true);
  });
});
