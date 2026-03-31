# slint-bridge-kit

Small, app-agnostic helpers for wiring **slint-ui** Node handles: batched property writes and callback wiring. No Slint types or domain code inside this package.

## Runtime API

### `assignProperties(target, values)`

Copies properties from `values` onto `target`. **`undefined` values are skipped** — the key is not written, so the previous value on `target` remains. **`null` is copied** like any other value.

If you need to set a property to `undefined`, assign it directly on `target` instead of using this helper.

### `wireFunctions(target, handlers)`

For each key in `handlers`, sets `target[key] = handlers[key]`. Keys not listed in `handlers` are left unchanged.

## Peer / consumers

Apps should depend on **slint-ui** and their own generated or hand-written window/global types. This package stays generic.
