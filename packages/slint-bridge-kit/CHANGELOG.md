# Changelog

All notable changes to this project are documented in this file.

## 0.2.2 — 2026-03-28

- `slintEnumMembers(cases)` — readonly `{ [K in cases[number]]: K }` for dot access on Slint wire enum strings.
- Type-only: `SlintEnumValues<M>` — union of values from a members object (replaces `SlintEnumUnion<typeof tuple>` when using `slintEnumMembers`).
- `slintEnumLiterals` and `SlintEnumUnion` are **deprecated**; they remain until a future major release.

## 0.2.1 — 2026-03-28

- Type-only: `ExhaustiveAllCallbacks<T>` — shorthand for `ExhaustiveCallbacks<T, FunctionKeysOf<T>>` when wiring every callback on a Slint global in one object.

## 0.2.0 — 2026-03-28

- `slintEnumLiterals` — identity helper for `as const` string tuples (single source of truth for Slint-style enum strings).
- Type-only: `SlintEnumUnion<T>` — `T[number]` for `readonly string[]` tuples from `slintEnumLiterals`.

## 0.1.0 — 2026-03-28

First numbered release of the public API:

- `assignProperties` — batched property writes; `undefined` values are skipped (see README).
- `wireFunctions` — assign a map of callbacks onto a Slint-backed object.
- Type-only: `KeysMatching`, `FunctionKeysOf`, `ExhaustiveCallbacks`.
- `SLINT_BRIDGE_KIT_VERSION` string export (kept in sync with `package.json` version).
