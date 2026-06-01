# Base UI gallery

Standalone Slint window for browsing the [Base UI](https://base-ui.com) Slint port.

**PR1:** App shell with welcome page.

**PR2:** Full sidebar (Welcome + 42 upstream namespaces) with stub pages.

**PR3:** [`packages/base-ui-slint`](../base-ui-slint) scaffold (`tokens.slint`, `base-ui.slint`, component README stubs) and **Foundation → Design tokens** (`foundation-tokens`) with neutral swatches and focus-ring preview.

**PR4:** `foundation/positioner.slint` + `foundation/popup-host.slint` (`BaseUiAnchoredPopup`) and **Foundation → Anchor & popup** (`foundation-anchor`) with side/align/margin/offset controls and overflow flip.

**PR5:** `foundation/dismiss.slint` (open-change reasons) + dismiss wired into `BaseUiAnchoredPopup`. **Foundation → Dismiss** (`foundation-dismiss`) — Escape, outside press, modal backdrop, live **Last close reason** readout.

Run from the monorepo root:

```bash
pnpm dev:base-ui-gallery
```

Typecheck:

```bash
pnpm --filter base-ui-gallery run typecheck
```

**Navigation:** Node (`pnpm dev`) wires the full tree via `wireGallerySidebarNav`. `ui/generated/gallery-sidebar-fallback.slint` supports slint-viewer with Welcome + Foundation folders expanded.

**Tokens:** Gallery chrome re-exports [`base-ui-slint/tokens.slint`](../base-ui-slint/tokens.slint); do not duplicate semantic colors in gallery-only files.
