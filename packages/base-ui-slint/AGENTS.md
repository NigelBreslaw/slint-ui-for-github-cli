# Base UI Slint — guide for contributors and AI assistants

**Location:** Library code lives in **`packages/base-ui-slint/`**. Import from gallery or apps with **relative** paths (e.g. [`tokens.slint`](tokens.slint), [`base-ui.slint`](base-ui.slint)).

**Gallery:** `pnpm dev:base-ui-gallery` from the monorepo root — [`packages/base-ui-gallery/README.md`](../base-ui-gallery/README.md).

## Purpose

- **Audience:** Contributors porting [@base-ui/react](https://base-ui.com) into Slint.
- **Goals:** Headless behavior and accessibility first; **neutral** tokens only (no Primer hex in this package).
- **Relationship to primer-slint:** Separate package. Primer may consume base-ui-slint positioning/focus after Phase 3 QA.

## Phase status (namespaces)

| Area | Status |
|------|--------|
| `tokens.slint` | **Phase 1 — implemented** |
| `foundation/positioner.slint`, `foundation/popup-host.slint` | **PR4 — implemented** (`BaseUiAnchoredPopup`) |
| `foundation/dismiss.slint` | **PR5 — implemented** (`BaseUiOpenChangeReasons`, wired into popup) |
| `foundation/modality.slint` | **PR6 — implemented** (`BaseUiPopupFocusScope`, focus chrome, `modal` on popup) |
| `foundation/floating-tree.slint`, `foundation/hover-delay.slint` | **PR7 — implemented** (`BaseUiFloatingTree`, `BaseUiFloatingAnchorSnap`, `BaseUiHoverDelayGate`; layer claim on popup) |
| `foundation/composite.slint`, `foundation/open-change.slint`, `foundation/id.slint` | **PR8 — implemented** (`BaseUiCompositeList`, `BaseUiCompositeNavigation`, `BaseUiOpenChangeDetails`, `BaseUiIdGenerator`) |
| `foundation/field-core.slint`, `foundation/button-chrome.slint`, `foundation/store.slint`, `foundation/a11y.slint` | **PR9 — implemented** (`BaseUiField`, `BaseUiDialogStore`, `BaseUiButtonChrome` / `A11y`, checkbox chrome) |
| Other `foundation/*` | Phase 1 complete |
| `components/*` | **Stubs only** — one `README.md` per namespace; Slint widgets in Phase 2+ |

See [`readme.md`](readme.md) for the full namespace table and upstream links.

## Tokens

- Single file: [`tokens.slint`](tokens.slint).
- Globals: `BaseUiColors`, `BaseUiFocusTokens`, `BaseUiOpacityTokens`, `BaseUiLayoutTokens`.
- **Rule:** assign each shared color once; compose `out` properties from primitives; no duplicate literals across globals.
- Theme: `Palette.color-scheme` from `std-widgets` (gallery header toggles light/dark).

## Barrel

[`base-ui.slint`](base-ui.slint) exports only implemented symbols. Uncomment or add widget exports as namespaces land.

## New component (Phase 2+)

1. Read upstream `packages/react/src/<namespace>/` and Vitest a11y tests.
2. Add `components/<Namespace>/` with entry `*.slint` and `README.md`.
3. Map tokens in `tokens.slint` if new semantic colors are required (audit table first).
4. Export from `base-ui.slint` when the API is stable.
5. Add a gallery demo page under `packages/base-ui-gallery/ui/views/`.

## Verification

From the monorepo root:

```bash
pnpm --filter base-ui-gallery run typecheck
pnpm dev:base-ui-gallery
```

Open **Foundation → Design tokens** and confirm swatches + focus ring toggle.
