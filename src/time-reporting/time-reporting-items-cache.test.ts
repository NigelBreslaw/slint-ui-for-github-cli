import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getTimeReportingCellDetailsByKey,
  resetTimeReportingItemsState,
  setTimeReportingCachedItems,
} from "./time-reporting-items-cache.ts";

describe("time-reporting-items-cache", () => {
  it("reset clears cell details", () => {
    setTimeReportingCachedItems("PVT_x", [], new Map([["k", [{ minutes: 1 }]]]));
    assert.equal(getTimeReportingCellDetailsByKey().size, 1);
    resetTimeReportingItemsState();
    assert.equal(getTimeReportingCellDetailsByKey().size, 0);
  });
});
