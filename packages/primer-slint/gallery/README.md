# Primer gallery

Standalone Slint window for browsing Primer components. This folder holds gallery-only UI; the library lives in the parent directory. Component demos are not embedded in the main github-app window; use this app (or browse `gallery/*-page.slint` in the repo).

**Content:** **Buttons** (`gallery-buttons-page.slint`), **Navs** (`gallery-navs-page.slint`), **Feedback** (`gallery-feedback-page.slint`), **Forms** (`gallery-forms-page.slint`), **Data** (`gallery-data-page.slint` — DataTable, Pagination). **Layout** still shows a placeholder until migrated.

**`DialogBase` / `PopupWindow`:** [`anchored-popupwindow.md`](anchored-popupwindow.md) — parent-relative coordinates, vertical flip, and references to app patterns.

**Direction:** evolve toward a Storybook-like experience: named demos per component, optional metadata (variants, tokens), and room for visual or manual QA notes in later PRs.

Run from the monorepo root:

```bash
pnpm dev:gallery
```
