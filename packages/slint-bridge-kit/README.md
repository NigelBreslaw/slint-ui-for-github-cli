# slint-bridge-kit

Small, **app-agnostic** helpers for wiring **[slint-ui](https://www.npmjs.com/package/slint-ui)** Node handles: batched property writes and callback maps. This package does **not** import Slint, ship `.slint` files, or embed domain types—your app owns `AppState` / `MainWindow` shapes (e.g. hand-written or generated from `.slint`).

**Semver:** `0.x` releases may include breaking API changes; pin or use a lockfile. After `1.0.0`, breaking changes require a major bump.

---

## Install

**Monorepo / workspace (pnpm):**

```json
{
  "dependencies": {
    "slint-bridge-kit": "workspace:*"
  }
}
```

**Published package (when available):**

```bash
pnpm add slint-bridge-kit
```

You also need **`slint-ui`** and a TypeScript toolchain in the consuming app. This library ships **TypeScript source** as the runtime entry (see `exports` in `package.json`); Node 20+ with [type stripping](https://nodejs.org/api/typescript.html) or a bundler that resolves `.ts` is typical.

---

## Peer dependencies

| Package      | Purpose |
| ------------ | ------- |
| `typescript` | `>=5.4.0` — types and `satisfies` / `ExhaustiveCallbacks` ergonomics |

**slint-ui** is not declared as a peer here because this package does not import it; real apps should depend on `slint-ui` separately and pass Slint objects into these helpers.

---

## API reference

| Name | Kind | Summary |
| ---- | ---- | -------- |
| `assignProperties(target, values)` | function | Copy `Partial<typeof target>` onto `target`; **skips** keys whose value is **`undefined`**; **`null` is assigned**. |
| `wireFunctions(target, handlers)` | function | For each key in `handlers`, set `target[key] = handlers[key]`; other keys unchanged. |
| `KeysMatching<T, V>` | type | Keys of `T` whose values are assignable to `V`. |
| `FunctionKeysOf<T>` | type | Keys of `T` whose values are functions. |
| `ExhaustiveCallbacks<T, K>` | type | `Required<Pick<T, K>>` — use with `satisfies` for exhaustive callback objects. |
| `slintEnumLiterals(values)` | function | Returns `values` unchanged; narrows inference for a `as const` string tuple (Slint enum cases on the wire). |
| `SlintEnumUnion<T>` | type | `T[number]` for `T extends readonly string[]` — derive a string union from the tuple returned by `slintEnumLiterals`. |
| `SLINT_BRIDGE_KIT_VERSION` | constant | String equal to this package’s `version` in `package.json`. |

---

## Barrel import

Public exports are available from the package root in one import:

```typescript
import {
  assignProperties,
  slintEnumLiterals,
  wireFunctions,
  type ExhaustiveCallbacks,
  type SlintEnumUnion,
} from "slint-bridge-kit";
```

---

## Slint enum literals (string unions)

Keep Slint-facing string enums in **one** `as const` list, export the union for TypeScript, and reuse the same array at runtime (e.g. `includes` checks):

```typescript
import { slintEnumLiterals, type SlintEnumUnion } from "slint-bridge-kit";

export const AUTH_STATES = slintEnumLiterals([
  "logged-out",
  "logged-in",
  "authorizing",
] as const);

export type AuthState = SlintEnumUnion<typeof AUTH_STATES>;
```

---

## `assignProperties` and `undefined`

- **`undefined` in `values`:** that property is **not** written; the previous value on `target` stays.
- **`null`:** written normally (useful when Slint or your model allows `null`).
- To **clear** to `undefined` explicitly, assign on `target` directly—do not rely on this helper.

```typescript
import { assignProperties } from "slint-bridge-kit";

assignProperties(appState, {
  user_login: "",
  avatar: undefined, // skipped — does NOT clear avatar
});
```

---

## `wireFunctions` + exhaustive callbacks

Use **`satisfies ExhaustiveCallbacks<…>`** so TypeScript rejects a missing or wrongly typed callback before you wire:

```typescript
import type { ExhaustiveCallbacks } from "slint-bridge-kit";
import { wireFunctions } from "slint-bridge-kit";

type MyAppState = {
  title: string;
  on_save: () => void;
  on_cancel: () => void;
};

declare const appState: MyAppState;

const handlers = {
  on_save: () => {},
  on_cancel: () => {},
} satisfies ExhaustiveCallbacks<MyAppState, "on_save" | "on_cancel">;

wireFunctions(appState, handlers);
```

`handlers` is built with **`Object.keys`** iteration order (your object literal key order). Use plain objects, not exotic prototypes.

---

## Type-only helpers (no runtime)

- **`KeysMatching<T, V>`** — e.g. string-valued keys: `KeysMatching<Widget, string>`.
- **`FunctionKeysOf<T>`** — callback key unions for documentation or `K` in `ExhaustiveCallbacks`.
- **`ExhaustiveCallbacks<T, K extends keyof T>`** — ensures every key in `K` is present with the correct type from `T`.

---

## License

MIT — see `package.json`.
