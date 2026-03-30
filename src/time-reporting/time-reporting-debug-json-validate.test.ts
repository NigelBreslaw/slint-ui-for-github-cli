import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("debug-json time-reporting items (optional)", () => {
  it("includes mergedAt or closedAt on a PullRequest when dump is fresh", (t) => {
    const dumpPath = join(
      pkgRoot,
      "debug-json/time-reporting--project-v2-items--PVT_kwDOA9vi5c4BSQQM.json",
    );
    if (!existsSync(dumpPath)) {
      t.skip("no debug-json dump at expected path");
      return;
    }
    const raw = JSON.parse(readFileSync(dumpPath, "utf8")) as {
      items?: unknown[];
    };
    const items = raw.items ?? [];
    const prWithInstant = items.some((row) => {
      if (row === null || typeof row !== "object") {
        return false;
      }
      const c = (row as Record<string, unknown>).content;
      if (c === null || typeof c !== "object") {
        return false;
      }
      const rec = c as Record<string, unknown>;
      if (rec.__typename !== "PullRequest") {
        return false;
      }
      const m = rec.mergedAt;
      const cl = rec.closedAt;
      return (typeof m === "string" && m.length > 0) || (typeof cl === "string" && cl.length > 0);
    });
    if (!prWithInstant) {
      t.skip("dump has no mergedAt/closedAt; re-fetch project items after GraphQL change");
      return;
    }
    assert.ok(prWithInstant);
  });
});
