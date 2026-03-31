# slint-bridge-kit

Small, app-agnostic helpers for wiring **slint-ui** Node handles: batched property writes and callback wiring. No Slint types or domain code inside this package.

## Runtime API

### `assignProperties(target, values)`

Copies properties from `values` onto `target`. **`undefined` values are skipped** — the key is not written, so the previous value on `target` remains. **`null` is copied** like any other value.

If you need to set a property to `undefined`, assign it directly on `target` instead of using this helper.

### `wireFunctions(target, handlers)`

For each key in `handlers`, sets `target[key] = handlers[key]`. Keys not listed in `handlers` are left unchanged.

## Type-only helpers

These types emit **no JavaScript**; they exist for TypeScript consumers only.

### `KeysMatching<T, V>`

Keys of `T` whose property types are assignable to `V`.

### `FunctionKeysOf<T>`

Keys of `T` whose values are functions (any parameters / return type).

### `ExhaustiveCallbacks<T, K>`

`Required<Pick<T, K>>` — an object that must define **every** key in the union `K`, with the same value types as on `T`. Combine with `satisfies` so a typo or missing callback is a **compile error**, then pass the object to `wireFunctions(target, handlers)`.

```typescript
import type { ExhaustiveCallbacks } from "slint-bridge-kit";
import { wireFunctions } from "slint-bridge-kit";

const handlers = {
  sign_in: () => {},
  sign_out: () => {},
} satisfies ExhaustiveCallbacks<YourAppStateType, "sign_in" | "sign_out">;

wireFunctions(window.AppState, handlers);
```

Replace `YourAppStateType` with your real Slint-backed handle type (defined in the app, not in this package). You can use `FunctionKeysOf` in the app to derive allowed callback key unions when helpful.

## Peer / consumers

Apps should depend on **slint-ui** and their own generated or hand-written window/global types. This package stays generic.
