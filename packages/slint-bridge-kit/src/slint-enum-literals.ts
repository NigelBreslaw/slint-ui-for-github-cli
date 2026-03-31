/**
 * Derive a string union from a `readonly` tuple of literals (e.g. Slint enum cases on the wire).
 *
 * @example
 * ```ts
 * export const AUTH_STATES = slintEnumLiterals([
 *   "logged-out",
 *   "logged-in",
 * ] as const);
 * export type AuthState = SlintEnumUnion<typeof AUTH_STATES>;
 * ```
 */
export type SlintEnumUnion<T extends readonly string[]> = T[number];

/**
 * Identity helper so a `as const` tuple infers a narrow tuple type; use with {@link SlintEnumUnion}.
 */
export function slintEnumLiterals<const T extends readonly string[]>(values: T): T {
  return values;
}
