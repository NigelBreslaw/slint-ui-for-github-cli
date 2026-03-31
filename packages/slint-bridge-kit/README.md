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
| `ExhaustiveAllCallbacks<T>` | type | `ExhaustiveCallbacks<T, FunctionKeysOf<T>>` — wire every function property on `T` in one map (Slint globals only; not for types with `run`/`show`/…). |
| `slintEnumMembers(cases)` | function | Readonly `{ [K in cases[number]]: K }` — dot access for Slint wire enum strings (`Authed.loggedIn`). |
| `SlintEnumValues<M>` | type | Union of string values from a members object returned by `slintEnumMembers`. |
| `SLINT_BRIDGE_KIT_VERSION` | constant | String equal to this package’s `version` in `package.json`. |

---

## Barrel import

Public exports are available from the package root in one import:

```typescript
import {
  assignProperties,
  slintEnumMembers,
  wireFunctions,
  type ExhaustiveAllCallbacks,
  type ExhaustiveCallbacks,
  type SlintEnumValues,
} from "slint-bridge-kit";
```

---

## Slint enum members (dot access)

List Slint wire enum cases **once** as a `as const` array; `slintEnumMembers` returns a readonly object with `key === value` so call sites use `Authed.loggedIn` instead of raw strings. Use `SlintEnumValues<typeof Authed>` for the string union type.

```typescript
import { slintEnumMembers, type SlintEnumValues } from "slint-bridge-kit";

export const Authed = slintEnumMembers([
  "loggedOut",
  "loggedIn",
  "authorizing",
] as const);

export type AuthState = SlintEnumValues<typeof Authed>;

// window.AppState.auth = Authed.loggedIn;
```

At runtime, use `Object.values(Authed)` (or `Object.keys`) where you previously used a tuple with `includes`.

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

When **every** function property on the handle is a Slint callback and you wire them all in one object, use **`ExhaustiveAllCallbacks<T>`** instead of listing keys:

```typescript
import type { ExhaustiveAllCallbacks } from "slint-bridge-kit";

const handlers = {
  on_save: () => {},
  on_cancel: () => {},
} satisfies ExhaustiveAllCallbacks<MyAppState>;
```

`handlers` is built with **`Object.keys`** iteration order (your object literal key order). Use plain objects, not exotic prototypes.

---

## Type-only helpers (no runtime)

- **`KeysMatching<T, V>`** — e.g. string-valued keys: `KeysMatching<Widget, string>`.
- **`FunctionKeysOf<T>`** — callback key unions for documentation or `K` in `ExhaustiveCallbacks`.
- **`ExhaustiveCallbacks<T, K extends keyof T>`** — ensures every key in `K` is present with the correct type from `T`.
- **`ExhaustiveAllCallbacks<T>`** — same for every `FunctionKeysOf<T>` key (Slint globals only).
- **`SlintEnumValues<M>`** — union of wire strings from a `slintEnumMembers` object.

---

## License

MIT — see `package.json`.
