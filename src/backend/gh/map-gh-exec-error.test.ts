import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapGhExecError } from "./map-gh-exec-error.ts";

describe("mapGhExecError", () => {
  it("maps ENOENT to install hint", () => {
    assert.equal(mapGhExecError({ code: "ENOENT" }), "gh not found (install GitHub CLI)");
  });

  it("prefixes non-empty stderr", () => {
    const err = { stderr: Buffer.from("not logged in\n", "utf8") };
    assert.equal(mapGhExecError(err), "gh: not logged in");
  });

  it("uses Error.message when stderr is present but empty after trim", () => {
    const e = Object.assign(new Error("cli failed"), {
      stderr: Buffer.from("  \n"),
    });
    assert.equal(mapGhExecError(e), "cli failed");
  });

  it("uses Error message for generic Error", () => {
    assert.equal(mapGhExecError(new Error("boom")), "boom");
  });

  it("stringifies unknown values", () => {
    assert.equal(mapGhExecError(42), "42");
  });
});
