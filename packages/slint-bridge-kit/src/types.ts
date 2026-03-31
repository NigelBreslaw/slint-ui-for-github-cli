/**
 * Keys of `T` whose property types are assignable to `V`.
 *
 * @example
 * ```ts
 * type T = { a: string; b: number; c: boolean };
 * type Str = KeysMatching<T, string>; // "a"
 * ```
 */
export type KeysMatching<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Keys of `T` whose values are functions (any arity / return).
 */
export type FunctionKeysOf<T extends object> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T];

/**
 * Object shape you must supply for every key in `K` — use with `satisfies` and {@link wireFunctions}.
 *
 * Typically choose `K` as a union of {@link FunctionKeysOf} keys (or a subset) from your Slint handle type.
 */
export type ExhaustiveCallbacks<T extends object, K extends keyof T> = Required<Pick<T, K>>;
