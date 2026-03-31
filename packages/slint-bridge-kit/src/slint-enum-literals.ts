/**
 * String union of Slint wire values from a namespace object built with {@link slintEnumMembers}.
 *
 * @example
 * ```ts
 * const Authed = slintEnumMembers(["loggedOut", "loggedIn"] as const);
 * type AuthState = SlintEnumValues<typeof Authed>; // "loggedOut" | "loggedIn"
 * ```
 */
export type SlintEnumValues<M extends Record<PropertyKey, string>> = M[keyof M];

/**
 * Build a readonly object `{ k: k }` for each Slint enum case so call sites use dot access
 * (`Authed.loggedIn`) with each property typed as the correct string literal.
 */
export function slintEnumMembers<const T extends readonly string[]>(
  cases: T,
): { readonly [K in T[number]]: K } {
  const out = {} as { [K in T[number]]: K };
  for (const k of cases) {
    (out as Record<string, string>)[k] = k;
  }
  return out as { readonly [K in T[number]]: K };
}

/**
 * Derive a string union from a `readonly` tuple of literals (e.g. Slint enum cases on the wire).
 *
 * @deprecated Prefer {@link slintEnumMembers} and {@link SlintEnumValues}; `slintEnumLiterals` /
 * `SlintEnumUnion` will be removed in a future major release.
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
 *
 * @deprecated Prefer {@link slintEnumMembers}; this helper will be removed in a future major release.
 */
export function slintEnumLiterals<const T extends readonly string[]>(values: T): T {
  return values;
}
