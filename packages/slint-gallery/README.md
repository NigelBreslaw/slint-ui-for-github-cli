# Primer gallery

Standalone Slint window for browsing Primer components. This package is split as **`ui/`** (Slint), **`node/`** (TypeScript + `slint-ui` entry), and **`rust/`** (native Skia / wasm runner). The **`primer-slint`** design system lives in the sibling package [`primer-slint`](../primer-slint/). Component demos are not embedded in the main github-app window; use this app (or browse `ui/views/*-page.slint`).

**Content:** **Buttons** (`gallery-buttons-page.slint`), **Navs** (`gallery-navs-page.slint`), **Feedback** (`gallery-feedback-page.slint`), **Forms** (`gallery-forms-page.slint`), **Data** (`gallery-data-page.slint` — DataTable, Pagination2), **Action list** (`gallery-action-list-page.slint` — ActionList, Storybook Features demos).

**`AnchoredOverlay` / `PopupWindow`:** [`ui/views/anchored-popupwindow.md`](ui/views/anchored-popupwindow.md) — parent-relative coordinates, vertical flip, and references to app patterns.

**Direction:** evolve toward a Storybook-like experience: named demos per component, optional metadata (variants, tokens), and room for visual or manual QA notes in later PRs.

Run from the monorepo root:

```bash
pnpm dev:gallery
```
