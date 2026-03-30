import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { buildTimeReportingWeekRows } from "./build-time-reporting-week-rows.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("buildTimeReportingWeekRows fixture (downloaded-shaped payload)", () => {
  it("parses committed sample JSON and yields one row for 2026-W13", () => {
    const raw = JSON.parse(
      readFileSync(join(fixturesDir, "time-reporting-items-bot-sample.json"), "utf8"),
    ) as { items: unknown[] };
    const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(raw.items, {
      targetWeek: { isoYear: 2026, isoWeek: 13 },
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].item_id, "PVTI_sample_a");
    assert.equal(rows[0].title, "Fixture PR in week");
    assert.equal(rows[0].wed, "30m");
    assert.equal(rows[0].total, "30m");
    assert.ok(cellDetailsByKey.size >= 1);
  });
});
