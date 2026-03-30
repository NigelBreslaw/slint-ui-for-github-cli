import type { ArrayModel } from "slint-ui";

/**
 * Replaces all rows in a Slint `ArrayModel` in place so `ListView` subscriptions stay valid.
 * Avoid assigning `new ArrayModel` to globals that back a `ListView`.
 */
export function replaceArrayModelContents<T>(model: ArrayModel<T>, rows: readonly T[]): void {
  const n = model.rowCount();
  if (n > 0) {
    model.remove(0, n);
  }
  if (rows.length > 0) {
    model.push(...rows);
  }
}
