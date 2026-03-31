/**
 * Copy own enumerable properties from `values` onto `target`.
 *
 * **Undefined values are skipped** — the corresponding key on `target` is not updated.
 * Use direct assignment when you must set a property to `undefined`. `null` is copied.
 */
export function assignProperties<T extends object>(target: T, values: Partial<T>): void {
  for (const key of Object.keys(values) as (keyof T)[]) {
    const v = values[key];
    if (v !== undefined) {
      (target as Record<keyof T, unknown>)[key] = v;
    }
  }
}
