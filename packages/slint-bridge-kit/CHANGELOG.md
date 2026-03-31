# Changelog

All notable changes to this project are documented in this file.

## 0.1.0 — 2026-03-28

First numbered release of the public API:

- `assignProperties` — batched property writes; `undefined` values are skipped (see README).
- `wireFunctions` — assign a map of callbacks onto a Slint-backed object.
- Type-only: `KeysMatching`, `FunctionKeysOf`, `ExhaustiveCallbacks`.
- `SLINT_BRIDGE_KIT_VERSION` string export (kept in sync with `package.json` version).
