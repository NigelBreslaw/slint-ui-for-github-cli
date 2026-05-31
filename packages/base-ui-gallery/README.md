# Base UI gallery

Standalone Slint window for browsing the [Base UI](https://base-ui.com) Slint port (`packages/base-ui-slint`, coming in PR3+).

**PR1:** App shell with welcome page.

**PR2:** Full sidebar (43 folders: Welcome + 42 upstream namespaces) with stub pages (`GalleryStubPage`) showing title, target phase, and upstream path. Node wires navigation via `wireGallerySidebarNav` in [`node/state/gallery-sidebar-nav-bridge-shared.ts`](node/state/gallery-sidebar-nav-bridge-shared.ts); nav data lives in [`node/state/base-ui-gallery-nav.ts`](node/state/base-ui-gallery-nav.ts).

Run from the monorepo root:

```bash
pnpm dev:base-ui-gallery
```

Typecheck:

```bash
pnpm --filter base-ui-gallery run typecheck
```

**Note:** Use `pnpm dev` (Node bridge) for the full expandable tree. `ui/generated/gallery-sidebar-fallback.slint` is a slint-viewer fallback with folder rows only (leaves appear after the bridge assigns rows).
