/** Slint list convention: no row selected (`selected-index` / similar). */
export const SLINT_LIST_NO_SELECTION = -1;

/** Toggle membership of `index` in `selected`. */
export function toggleIndexInSet(selected: Set<number>, index: number): void {
  if (selected.has(index)) {
    selected.delete(index);
  } else {
    selected.add(index);
  }
}

/** `bool[]` of length `rowCount` — `true` where index is in `selected`. */
export function checkedFlagsForRowCount(
  rowCount: number,
  selected: ReadonlySet<number>,
): boolean[] {
  return Array.from({ length: rowCount }, (_, i) => selected.has(i));
}

/** `bool[]` aligned to `labels` — `true` where row index is in `selected`. */
export function checkedFlagsForLabels(
  labels: readonly string[],
  selected: ReadonlySet<number>,
): boolean[] {
  return labels.map((_, i) => selected.has(i));
}

/** Comma-separated selected labels, or `"(none)"` when empty. */
export function formatSelectionSummary(
  labels: readonly string[],
  selected: ReadonlySet<number>,
): string {
  const names = labels.filter((_, i) => selected.has(i));
  return names.length === 0 ? "(none)" : names.join(", ");
}

/** Whether `index` is a valid row index for a list of `rowCount` items. */
export function isRowIndexInRange(index: number, rowCount: number): boolean {
  return index >= 0 && index < rowCount;
}

/** `index` when in range, otherwise {@link SLINT_LIST_NO_SELECTION}. */
export function rowIndexOrNone(index: number, rowCount: number): number {
  return isRowIndexInRange(index, rowCount) ? index : SLINT_LIST_NO_SELECTION;
}

/** Toggle membership of `key` in `selected`. */
export function toggleKeyInSet<T>(selected: Set<T>, key: T): void {
  if (selected.has(key)) {
    selected.delete(key);
  } else {
    selected.add(key);
  }
}

/** `bool[]` aligned to `visibleKeys` — `true` where key is in `selected`. */
export function checkedFlagsForVisibleKeys<T>(
  visibleKeys: readonly T[],
  selected: ReadonlySet<T>,
): boolean[] {
  return visibleKeys.map((k) => selected.has(k));
}

export type SelectAllStripState = {
  /** All visible keys selected (false when `visibleKeys` is empty). */
  checked: boolean;
  /** Some but not all visible keys selected. */
  indeterminate: boolean;
  allSelected: boolean;
  someSelected: boolean;
};

/** Tri-state for a select-all strip over the currently visible keys. */
export function selectAllStripState<T>(
  visibleKeys: readonly T[],
  selected: ReadonlySet<T>,
): SelectAllStripState {
  const allSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));
  const someSelected = visibleKeys.some((k) => selected.has(k));
  return {
    allSelected,
    someSelected,
    checked: allSelected,
    indeterminate: !allSelected && someSelected,
  };
}

/** Add or remove every key in `visibleKeys` from `selected`. */
export function applySelectAllOnVisibleKeys<T>(
  selected: Set<T>,
  visibleKeys: readonly T[],
  on: boolean,
): void {
  if (on) {
    for (const k of visibleKeys) {
      selected.add(k);
    }
  } else {
    for (const k of visibleKeys) {
      selected.delete(k);
    }
  }
}
