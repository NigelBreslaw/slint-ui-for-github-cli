import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SLINT_LIST_NO_SELECTION,
  applySelectAllOnVisibleKeys,
  checkedFlagsForLabels,
  checkedFlagsForRowCount,
  checkedFlagsForVisibleKeys,
  formatSelectionSummary,
  isRowIndexInRange,
  rowIndexOrNone,
  selectAllStripState,
  toggleIndexInSet,
  toggleKeyInSet,
} from "./selection.ts";

describe("toggleIndexInSet", () => {
  it("adds then removes an index", () => {
    const s = new Set<number>();
    toggleIndexInSet(s, 1);
    assert.deepEqual([...s], [1]);
    toggleIndexInSet(s, 1);
    assert.deepEqual([...s], []);
  });
});

describe("checkedFlagsForRowCount", () => {
  it("maps indices to booleans", () => {
    assert.deepEqual(checkedFlagsForRowCount(3, new Set([0, 2])), [true, false, true]);
  });
});

describe("checkedFlagsForLabels", () => {
  it("uses label indices", () => {
    assert.deepEqual(checkedFlagsForLabels(["a", "b", "c"], new Set([1])), [false, true, false]);
  });
});

describe("formatSelectionSummary", () => {
  it("returns (none) when empty", () => {
    assert.equal(formatSelectionSummary(["a", "b"], new Set()), "(none)");
  });

  it("joins selected labels", () => {
    assert.equal(formatSelectionSummary(["a", "b", "c"], new Set([0, 2])), "a, c");
  });
});

describe("isRowIndexInRange / rowIndexOrNone", () => {
  it("validates row bounds", () => {
    assert.equal(isRowIndexInRange(0, 3), true);
    assert.equal(isRowIndexInRange(3, 3), false);
    assert.equal(isRowIndexInRange(-1, 3), false);
  });

  it("returns SLINT_LIST_NO_SELECTION when out of range", () => {
    assert.equal(rowIndexOrNone(2, 3), 2);
    assert.equal(rowIndexOrNone(5, 3), SLINT_LIST_NO_SELECTION);
  });
});

describe("toggleKeyInSet", () => {
  it("toggles string keys", () => {
    const s = new Set<string>(["x"]);
    toggleKeyInSet(s, "y");
    assert.deepEqual([...s].sort(), ["x", "y"]);
    toggleKeyInSet(s, "x");
    assert.deepEqual([...s], ["y"]);
  });
});

describe("checkedFlagsForVisibleKeys", () => {
  it("aligns flags to visible order", () => {
    assert.deepEqual(checkedFlagsForVisibleKeys(["b", "a"], new Set(["a"])), [false, true]);
  });
});

describe("selectAllStripState", () => {
  it("is unchecked when visible list is empty", () => {
    const st = selectAllStripState([], new Set(["a"]));
    assert.equal(st.checked, false);
    assert.equal(st.indeterminate, false);
    assert.equal(st.allSelected, false);
    assert.equal(st.someSelected, false);
  });

  it("is checked when all visible keys are selected", () => {
    const st = selectAllStripState(["a", "b"], new Set(["a", "b", "c"]));
    assert.equal(st.checked, true);
    assert.equal(st.indeterminate, false);
  });

  it("is indeterminate when some visible keys are selected", () => {
    const st = selectAllStripState(["a", "b", "c"], new Set(["b"]));
    assert.equal(st.checked, false);
    assert.equal(st.indeterminate, true);
    assert.equal(st.someSelected, true);
  });
});

describe("applySelectAllOnVisibleKeys", () => {
  it("selects all visible keys when on", () => {
    const s = new Set<string>();
    applySelectAllOnVisibleKeys(s, ["a", "b"], true);
    assert.deepEqual([...s].sort(), ["a", "b"]);
  });

  it("clears visible keys when off", () => {
    const s = new Set(["a", "b", "c"]);
    applySelectAllOnVisibleKeys(s, ["a", "b"], false);
    assert.deepEqual([...s], ["c"]);
  });
});
