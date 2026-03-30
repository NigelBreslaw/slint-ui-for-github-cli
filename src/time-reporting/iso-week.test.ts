import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addIsoWeeks,
  currentIsoWeekUtc,
  formatIsoWeekLabel,
  isoWeekAndYearFromUtcDate,
  utcMondayOfIsoWeek,
  weekdayDatesMondayToFriday,
} from "./iso-week.ts";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe("isoWeekAndYearFromUtcDate", () => {
  it("returns 2024-W01 for 2024-01-04 (Thursday)", () => {
    assert.deepEqual(isoWeekAndYearFromUtcDate(utc(2024, 1, 4)), { isoYear: 2024, isoWeek: 1 });
  });
  it("returns 2024-W01 for 2024-01-01 (Monday)", () => {
    assert.deepEqual(isoWeekAndYearFromUtcDate(utc(2024, 1, 1)), { isoYear: 2024, isoWeek: 1 });
  });
  it("returns 2026-W13 for 2026-03-28", () => {
    assert.deepEqual(isoWeekAndYearFromUtcDate(utc(2026, 3, 28)), { isoYear: 2026, isoWeek: 13 });
  });
});

describe("formatIsoWeekLabel", () => {
  it("pads single-digit week", () => {
    assert.equal(formatIsoWeekLabel(2026, 1), "2026-W01");
  });
  it("does not pad two-digit week", () => {
    assert.equal(formatIsoWeekLabel(2026, 13), "2026-W13");
  });
});

describe("utcMondayOfIsoWeek", () => {
  it("2024-W01 starts Monday 2024-01-01 UTC", () => {
    const mon = utcMondayOfIsoWeek(2024, 1);
    assert.equal(mon.toISOString(), "2024-01-01T00:00:00.000Z");
  });
});

describe("weekdayDatesMondayToFriday", () => {
  it("returns five YYYY-MM-DD strings for 2026-W13", () => {
    const d = weekdayDatesMondayToFriday(2026, 13);
    assert.equal(d.length, 5);
    assert.equal(d[0], "2026-03-23");
    assert.equal(d[4], "2026-03-27");
  });
});

describe("addIsoWeeks", () => {
  it("increments within same year", () => {
    assert.deepEqual(addIsoWeeks(2024, 1, 1), { isoYear: 2024, isoWeek: 2 });
  });
});

describe("currentIsoWeekUtc", () => {
  it("returns finite iso year and week", () => {
    const w = currentIsoWeekUtc();
    assert.ok(Number.isFinite(w.isoYear) && w.isoYear >= 2000);
    assert.ok(Number.isFinite(w.isoWeek) && w.isoWeek >= 1 && w.isoWeek <= 53);
  });
});
