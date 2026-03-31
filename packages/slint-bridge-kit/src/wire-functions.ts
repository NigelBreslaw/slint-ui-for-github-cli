/**
 * For each key in `handlers`, assigns `target[key] = handlers[key]`.
 *
 * Only keys present on `handlers` are written; other properties on `target` are untouched.
 */
export function wireFunctions<T extends object, K extends keyof T>(
  target: T,
  handlers: { [P in K]: T[P] },
): void {
  for (const key of Object.keys(handlers) as K[]) {
    (target as Record<K, T[K]>)[key] = handlers[key];
  }
}
