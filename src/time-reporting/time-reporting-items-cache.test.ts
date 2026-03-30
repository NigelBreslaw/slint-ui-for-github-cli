import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getTimeReportingCellDetailsByKey,
  getTimeReportingWeekRowOrder,
  resetTimeReportingItemsState,
  setTimeReportingCachedItems,
  setTimeReportingWeekRowOrder,
} from "./time-reporting-items-cache.ts";

describe("time-reporting-items-cache", () => {
  it("reset clears cell details", () => {
    setTimeReportingCachedItems("PVT_x", [], new Map([["k", [{ minutes: 1 }]]]));
    assert.equal(getTimeReportingCellDetailsByKey().size, 1);
    resetTimeReportingItemsState();
    assert.equal(getTimeReportingCellDetailsByKey().size, 0);
  });

  it("reset clears week row order", () => {
    setTimeReportingWeekRowOrder(["PVTI_a"]);
    assert.equal(getTimeReportingWeekRowOrder().length, 1);
    resetTimeReportingItemsState();
    assert.equal(getTimeReportingWeekRowOrder().length, 0);
  });
});
